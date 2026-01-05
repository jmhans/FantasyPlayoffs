'use server';

import { db } from '@/app/lib/db';
import { players, weeklyActuals } from '@/app/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { fetchNFLPlayers, type ESPNPlayer } from '@/app/lib/espn-api';
import { revalidatePath } from 'next/cache';

export async function syncPlayersFromESPN() {
  try {
    const espnPlayers = await fetchNFLPlayers();
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
      } catch (error) {
        console.error(`Error syncing player ${espnPlayer.displayName}:`, error);
      }
    }
    
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
