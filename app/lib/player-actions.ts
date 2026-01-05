'use server';

import { db } from '@/app/lib/db';
import { players, weeklyActuals } from '@/app/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { fetchNFLPlayers, type ESPNPlayer } from '@/app/lib/espn-api';
import { revalidatePath } from 'next/cache';

export async function syncPlayersFromESPN() {
  try {
    console.log('[Player Sync] Starting ESPN player sync...');
    const espnPlayers = await fetchNFLPlayers();
    console.log(`[Player Sync] Fetched ${espnPlayers.length} players from ESPN API`);
    let syncedCount = 0;
    
    for (const espnPlayer of espnPlayers) {
      try {
        // Check if player already exists
        const existing = await db
          .select()
          .from(players)
          .where(eq(players.espnId, espnPlayer.id))
          .limit(1);
        
        const playerData = {
          espnId: espnPlayer.id,
          name: espnPlayer.displayName,
          position: espnPlayer.position?.abbreviation || 'UNK',
          team: espnPlayer.team?.abbreviation || 'FA',
          jerseyNumber: espnPlayer.jersey || null,
          status: espnPlayer.status?.type || 'ACTIVE',
          imageUrl: espnPlayer.headshot?.href || null,
          metadata: espnPlayer as any,
          updatedAt: new Date(),
        };
        
        if (existing.length > 0) {
          // Update existing player
          await db
            .update(players)
            .set(playerData)
            .where(eq(players.id, existing[0].id));
        } else {
          // Insert new player
          await db.insert(players).values(playerData);
        }
        
        syncedCount++;
        if (syncedCount % 50 === 0) {
          console.log(`[Player Sync] Progress: ${syncedCount} players synced...`);
        }
      } catch (error) {
        console.error(`Error syncing player ${espnPlayer.displayName}:`, error);
      }
    }
    
    console.log(`[Player Sync] Complete: ${syncedCount} players synced successfully`);
    revalidatePath('/');
    return { success: true, count: syncedCount };
  } catch (error) {
    console.error('Error syncing players:', error);
    return { error: 'Failed to sync players from ESPN' };
  }
}

export async function searchPlayers(query: string, season: number = 2025) {
  try {
    if (!query || query.trim() === '') {
      // If no query, return first 100 eligible players with their average points
      const result = await db
        .select({
          id: players.id,
          espnId: players.espnId,
          name: players.name,
          position: players.position,
          team: players.team,
          jerseyNumber: players.jerseyNumber,
          status: players.status,
          imageUrl: players.imageUrl,
          metadata: players.metadata,
          isDraftEligible: players.isDraftEligible,
          avgPoints: sql<number>`COALESCE(AVG(${weeklyActuals.fantasyPoints}), 0)`.as('avg_points'),
          gamesPlayed: sql<number>`COUNT(${weeklyActuals.id})`.as('games_played'),
        })
        .from(players)
        .leftJoin(weeklyActuals, sql`${weeklyActuals.playerId} = ${players.id} AND ${weeklyActuals.season} = ${season}`)
        .where(eq(players.isDraftEligible, true))
        .groupBy(players.id)
        .orderBy(sql`COALESCE(AVG(${weeklyActuals.fantasyPoints}), 0) DESC`)
        .limit(100);
      
      return result;
    }
    
    const searchTerm = `%${query.toLowerCase()}%`;
    const { sql: rawSql, ilike } = await import('drizzle-orm');
    
    const result = await db
      .select({
        id: players.id,
        espnId: players.espnId,
        name: players.name,
        position: players.position,
        team: players.team,
        jerseyNumber: players.jerseyNumber,
        status: players.status,
        imageUrl: players.imageUrl,
        metadata: players.metadata,
        isDraftEligible: players.isDraftEligible,
        avgPoints: sql<number>`COALESCE(AVG(${weeklyActuals.fantasyPoints}), 0)`.as('avg_points'),
        gamesPlayed: sql<number>`COUNT(${weeklyActuals.id})`.as('games_played'),
      })
      .from(players)
      .leftJoin(weeklyActuals, sql`${weeklyActuals.playerId} = ${players.id} AND ${weeklyActuals.season} = ${season}`)
      .where(
        rawSql`(LOWER(${players.name}) LIKE ${searchTerm} 
          OR LOWER(${players.team}) LIKE ${searchTerm}
          OR LOWER(${players.position}) LIKE ${searchTerm})
          AND ${players.isDraftEligible} = true`
      )
      .groupBy(players.id)
      .orderBy(sql`COALESCE(AVG(${weeklyActuals.fantasyPoints}), 0) DESC`)
      .limit(100);
    
    return result;
  } catch (error) {
    console.error('Error searching players:', error);
    throw new Error('Failed to search players');
  }
}

export async function getAllPlayers() {
  try {
    // Return first 100 for initial load
    return await db.select().from(players).limit(100);
  } catch (error) {
    console.error('Error fetching players:', error);
    throw new Error('Failed to fetch players');
  }
}

/**
 * Import players from specific NFL teams and positions
 */
export async function importPlayersFromTeams(teams: string[], positions: string[]) {
  const logs: string[] = [];
  
  try {
    logs.push(`Starting import for teams: ${teams.join(', ')}`);
    logs.push(`Positions: ${positions.join(', ')}`);
    
    const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
    let importedCount = 0;
    let teamsProcessed = 0;
    
    // Fetch teams data to get team IDs
    logs.push('Fetching teams from ESPN...');
    const teamsResponse = await fetch(`${ESPN_API_BASE}/teams?limit=32`);
    if (!teamsResponse.ok) {
      throw new Error(`ESPN API returned ${teamsResponse.status}`);
    }
    const teamsData = await teamsResponse.json();
    
    // Filter for selected teams
    const selectedTeams = teamsData.sports[0].leagues[0].teams.filter((team: any) => 
      teams.includes(team.team.abbreviation)
    );
    
    logs.push(`Found ${selectedTeams.length} matching teams`);
    
    // For each selected team, fetch roster
    for (const teamData of selectedTeams) {
      try {
        const teamId = teamData.team.id;
        const teamAbbreviation = teamData.team.abbreviation;
        
        logs.push(`\nFetching roster for ${teamAbbreviation}...`);
        
        const rosterResponse = await fetch(
          `${ESPN_API_BASE}/teams/${teamId}/roster`
        );
        
        if (!rosterResponse.ok) {
          logs.push(`⚠️ Roster API returned ${rosterResponse.status} for ${teamAbbreviation}`);
          continue;
        }
        
        const rosterData = await rosterResponse.json();
        
        if (!rosterData.athletes) {
          logs.push(`⚠️ ${teamAbbreviation}: No athletes data found`);
          continue;
        }
        
        // Only process offense group
        const offenseGroup = rosterData.athletes.find((group: any) => group.position === 'offense');
        
        if (!offenseGroup) {
          logs.push(`⚠️ ${teamAbbreviation}: No offense group found`);
          logs.push(`Available groups: ${rosterData.athletes.map((g: any) => g.position).join(', ')}`);
          continue;
        }
        
        if (!offenseGroup.items) {
          logs.push(`⚠️ ${teamAbbreviation}: Offense group has no items`);
          continue;
        }
        
        // Filter for selected positions
        const filteredPlayers = offenseGroup.items.filter((player: any) => 
          positions.includes(player.position?.abbreviation)
        );
        
        logs.push(`${teamAbbreviation}: ${filteredPlayers.length} players (${offenseGroup.items.length} total offensive players)`);
        
        // Save each player to database
        for (const espnPlayer of filteredPlayers) {
          try {
            // Check if player already exists
            const existing = await db
              .select()
              .from(players)
              .where(eq(players.espnId, espnPlayer.id))
              .limit(1);
            
            const playerData = {
              espnId: espnPlayer.id,
              name: espnPlayer.displayName,
              position: espnPlayer.position?.abbreviation || 'UNK',
              team: teamAbbreviation,
              jerseyNumber: espnPlayer.jersey || null,
              status: espnPlayer.status?.type || 'ACTIVE',
              imageUrl: espnPlayer.headshot?.href || null,
              isDraftEligible: true, // Mark as draft eligible by default
              metadata: espnPlayer as any,
              updatedAt: new Date(),
            };
            
            if (existing.length > 0) {
              // Update existing player
              await db
                .update(players)
                .set(playerData)
                .where(eq(players.id, existing[0].id));
            } else {
              // Insert new player
              await db.insert(players).values(playerData);
            }
            
            importedCount++;
          } catch (error) {
            logs.push(`❌ Error saving ${espnPlayer.displayName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        teamsProcessed++;
        
        // Small delay between teams to be nice to ESPN API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        logs.push(`❌ Error processing team ${teamData.team.abbreviation}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    logs.push(`\n✅ Complete: ${importedCount} players imported from ${teamsProcessed} teams`);
    revalidatePath('/');
    return { 
      success: true, 
      count: importedCount,
      teamsProcessed,
      logs: logs.join('\n')
    };
  } catch (error) {
    logs.push(`❌ Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { 
      error: error instanceof Error ? error.message : 'Failed to import players',
      logs: logs.join('\n')
    };
  }
}
