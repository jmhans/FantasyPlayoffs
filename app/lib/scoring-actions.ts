'use server';

import { db } from '@/app/lib/db';
import { players, rosterEntries, seasons, weeklyActuals, weeklyScores } from '@/app/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';

interface PlayerStats {
  playerId: number | null;
  playerName: string;
  espnId: string;
  team: string;
  position: string;
  passingYards: number;
  passingTouchdowns: number;
  interceptions: number;
  rushingYards: number;
  rushingTouchdowns: number;
  receptions: number;
  receivingYards: number;
  receivingTouchdowns: number;
  fantasyPoints: number;
  projectedPoints: number | null;
  gameStatus: 'pre' | 'in' | 'post';
  lastUpdated: Date;
}

interface ESPNGame {
  id: string;
  status: {
    type: {
      state: 'pre' | 'in' | 'post';
    };
  };
  competitions: Array<{
    competitors: Array<{
      team: {
        id: string;
        abbreviation: string;
      };
    }>;
  }>;
}

/**
 * Fetch all active roster players from our database for a specific season
 */
async function getActiveRosterPlayers(seasonYear: number) {
  try {
    const activeRosters = await db
      .select({
        playerId: rosterEntries.playerId,
        playerName: rosterEntries.playerName,
        position: rosterEntries.position,
        team: rosterEntries.team,
        espnId: players.espnId,
        projectedPoints: players.projectedPoints,
      })
      .from(rosterEntries)
      .innerJoin(players, eq(rosterEntries.playerId, players.id))
      .innerJoin(seasons, eq(rosterEntries.seasonId, seasons.id))
      .where(and(
        eq(seasons.year, seasonYear),
        eq(seasons.isActive, true)
      ));

    return activeRosters;
  } catch (error) {
    console.error('Error fetching roster players:', error);
    return [];
  }
}

/**
 * Fetch current week's games from ESPN
 */
async function getCurrentWeekGames(): Promise<{ week: number; games: ESPNGame[] }> {
  try {
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
      { next: { revalidate: 60 } } // Cache for 1 minute
    );
    
    const data = await response.json();
    
    // ESPN returns seasonType: 3 for playoffs with week 1, 2, 3, 4
    // We want to store as NFL weeks 19, 20, 21, 22 to avoid overwriting regular season
    const espnWeek = data.week?.number || 1;
    const seasonType = data.season?.type || 2; // 2=regular, 3=playoffs
    const actualWeek = seasonType === 3 ? espnWeek + 18 : espnWeek;
    
    return {
      week: actualWeek,
      games: data.events || [],
    };
  } catch (error) {
    console.error('Error fetching scoreboard:', error);
    return { week: 1, games: [] };
  }
}

/**
 * Fetch player stats from a specific game
 */
async function getGamePlayerStats(gameId: string): Promise<Map<string, Partial<PlayerStats>>> {
  try {
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`,
      { next: { revalidate: 30 } } // Cache for 30 seconds during live games
    );
    
    const data = await response.json();
    const playerStatsMap = new Map<string, Partial<PlayerStats>>();
    
    if (data.boxscore?.players) {
      // Process both teams
      for (const teamStats of data.boxscore.players) {
        // Process each stat category (passing, rushing, receiving)
        for (const statCategory of teamStats.statistics) {
          const categoryName = statCategory.name;
          
          if (statCategory.athletes) {
            for (const athleteData of statCategory.athletes) {
              const espnId = athleteData.athlete.id;
              const stats = athleteData.stats || [];
              
              // Get or create player stats entry
              let playerStats = playerStatsMap.get(espnId);
              if (!playerStats) {
                playerStats = {
                  playerName: athleteData.athlete.displayName,
                  espnId,
                  position: athleteData.athlete.position?.abbreviation || '',
                  passingYards: 0,
                  passingTouchdowns: 0,
                  interceptions: 0,
                  rushingYards: 0,
                  rushingTouchdowns: 0,
                  receptions: 0,
                  receivingYards: 0,
                  receivingTouchdowns: 0,
                };
              }
              
              // Parse stats based on category
              if (categoryName === 'passing' && stats.length >= 5) {
                // Stats format: [C/ATT, YDS, AVG, TD, INT, ...]
                playerStats.passingYards = parseInt(stats[1]) || 0;
                playerStats.passingTouchdowns = parseInt(stats[3]) || 0;
                playerStats.interceptions = parseInt(stats[4]) || 0;
              } else if (categoryName === 'rushing' && stats.length >= 4) {
                // Stats format: [ATT, YDS, AVG, TD, LONG]
                playerStats.rushingYards = parseInt(stats[1]) || 0;
                playerStats.rushingTouchdowns = parseInt(stats[3]) || 0;
              } else if (categoryName === 'receiving' && stats.length >= 4) {
                // Stats format: [REC, YDS, AVG, TD, LONG, TGTS]
                playerStats.receptions = parseInt(stats[0]) || 0;
                playerStats.receivingYards = parseInt(stats[1]) || 0;
                playerStats.receivingTouchdowns = parseInt(stats[3]) || 0;
              }
              
              playerStatsMap.set(espnId, playerStats);
            }
          }
        }
      }
    }
    
    return playerStatsMap;
  } catch (error) {
    console.error(`Error fetching game ${gameId} stats:`, error);
    return new Map();
  }
}

/**
 * Calculate fantasy points based on stats
 * Standard scoring: 
 * - Passing: 1 pt per 25 yards, 6 pts per TD, -2 per INT
 * - Rushing: 1 pt per 10 yards, 6 pts per TD
 * - Receiving: 1 pt per 10 yards, 6 pts per TD, 0.5 pt per reception (Half PPR)
 */
function calculateFantasyPoints(stats: {
  passingYards: number;
  passingTouchdowns: number;
  interceptions: number;
  rushingYards: number;
  rushingTouchdowns: number;
  receptions: number;
  receivingYards: number;
  receivingTouchdowns: number;
}): number {
  let points = 0;
  
  // Passing
  points += stats.passingYards / 25;
  points += stats.passingTouchdowns * 6;
  points -= stats.interceptions * 2;
  
  // Rushing
  points += stats.rushingYards / 10;
  points += stats.rushingTouchdowns * 6;
  
  // Receiving (Half PPR)
  points += stats.receptions * 0.5;
  points += stats.receivingYards / 10;
  points += stats.receivingTouchdowns * 6;
  
  return points;
}

/**
 * Get player stats from weeklyActuals table for a specific week
 * Joins with players table to get full player info
 */
async function getStoredWeeklyActuals(seasonYear: number, week: number) {
  try {
    const actuals = await db
      .select({
        playerId: weeklyActuals.playerId,
        espnId: weeklyActuals.espnId,
        fantasyPoints: weeklyActuals.fantasyPoints,
        stats: weeklyActuals.stats,
        playerName: players.name,
        position: players.position,
        team: players.team,
      })
      .from(weeklyActuals)
      .innerJoin(players, eq(weeklyActuals.playerId, players.id))
      .where(
        and(
          eq(weeklyActuals.season, seasonYear),
          eq(weeklyActuals.week, week)
        )
      );

    console.log(`[getStoredWeeklyActuals] Found ${actuals.length} actuals for ${seasonYear} week ${week}`);
    return actuals;
  } catch (error) {
    console.error('Error fetching stored actuals:', error);
    return [];
  }
}

/**
 * Main function to fetch live stats for all rostered players
 * Can fetch from live ESPN API or from stored weeklyActuals
 */
export async function getLivePlayerStats(seasonYear: number, week?: number): Promise<PlayerStats[]> {
  try {
    // Get all players on rosters
    const rosterPlayers = await getActiveRosterPlayers(seasonYear);
    
    if (rosterPlayers.length === 0) {
      return [];
    }

    // If week is specified, try to get data from weeklyActuals first
    if (week) {
      const storedActuals = await getStoredWeeklyActuals(seasonYear, week);
      
      console.log(`[getLivePlayerStats] Week ${week} requested, found ${storedActuals.length} stored actuals`);
      console.log(`[getLivePlayerStats] Found ${rosterPlayers.length} roster players`);
      
      if (storedActuals.length > 0) {
        // Map stored actuals to player stats - only include rostered players
        const playerStatsMap = new Map<string, PlayerStats>();
        
        for (const actual of storedActuals) {
          const rosterPlayer = rosterPlayers.find(p => p.espnId === actual.espnId);
          if (!rosterPlayer) {
            console.log(`[getLivePlayerStats] Skipping ${actual.playerName} (${actual.espnId}) - not on roster`);
            continue;
          }
          
          const stats = actual.stats as any || {};
          
          playerStatsMap.set(actual.espnId, {
            playerId: actual.playerId,
            playerName: actual.playerName,
            espnId: actual.espnId,
            team: actual.team || '',
            position: actual.position || '',
            passingYards: stats.passingYards || 0,
            passingTouchdowns: stats.passingTouchdowns || 0,
            interceptions: stats.interceptions || 0,
            rushingYards: stats.rushingYards || 0,
            rushingTouchdowns: stats.rushingTouchdowns || 0,
            receptions: stats.receptions || 0,
            receivingYards: stats.receivingYards || 0,
            receivingTouchdowns: stats.receivingTouchdowns || 0,
            fantasyPoints: Number(actual.fantasyPoints),
            projectedPoints: rosterPlayer.projectedPoints || null,
            gameStatus: 'post',
            lastUpdated: new Date(),
          });
        }
        
        console.log(`[getLivePlayerStats] Returning ${playerStatsMap.size} player stats`);
        return Array.from(playerStatsMap.values());
      }
    }

    // Get current week's games from ESPN live API
    const { week: currentWeek, games } = await getCurrentWeekGames();
    
    console.log(`[getLivePlayerStats] Live mode: found ${games.length} games for week ${currentWeek}`);
    console.log(`[getLivePlayerStats] Checking ${rosterPlayers.length} roster players`);
    
    // Map to store accumulated stats by ESPN player ID
    const playerStatsMap = new Map<string, PlayerStats>();
    
    // Fetch stats from all games
    for (const game of games) {
      const gameStats = await getGamePlayerStats(game.id);
      console.log(`[getLivePlayerStats] Game ${game.id}: found stats for ${gameStats.size} players`);
      
      const gameStatus = game.status.type.state;
      
      // Process each rostered player
      for (const rosterPlayer of rosterPlayers) {
        if (!rosterPlayer.espnId) continue;
        
        const espnStats = gameStats.get(rosterPlayer.espnId);
        if (!espnStats) continue;
        
        console.log(`[getLivePlayerStats] Matched: ${rosterPlayer.playerName} (${rosterPlayer.espnId})`);
        
        // Initialize or get existing stats
        let playerStats = playerStatsMap.get(rosterPlayer.espnId);
        if (!playerStats) {
          playerStats = {
            playerId: rosterPlayer.playerId,
            playerName: rosterPlayer.playerName,
            espnId: rosterPlayer.espnId,
            team: rosterPlayer.team || '',
            position: rosterPlayer.position || '',
            passingYards: espnStats.passingYards || 0,
            passingTouchdowns: espnStats.passingTouchdowns || 0,
            interceptions: espnStats.interceptions || 0,
            rushingYards: espnStats.rushingYards || 0,
            rushingTouchdowns: espnStats.rushingTouchdowns || 0,
            receptions: espnStats.receptions || 0,
            receivingYards: espnStats.receivingYards || 0,
            receivingTouchdowns: espnStats.receivingTouchdowns || 0,
            fantasyPoints: 0,
            projectedPoints: rosterPlayer.projectedPoints || null,
            gameStatus,
            lastUpdated: new Date(),
          };
          
          // Calculate fantasy points
          playerStats.fantasyPoints = calculateFantasyPoints(playerStats);
          playerStatsMap.set(rosterPlayer.espnId, playerStats);
        }
      }
    }
    
    const results = Array.from(playerStatsMap.values());
    
    // Save live stats to database as actuals for the current week
    if (results.length > 0 && !week) {
      console.log(`[getLivePlayerStats] Saving ${results.length} live stats to database for week ${currentWeek}`);
      await saveLiveStatsToActuals(seasonYear, currentWeek, results);
      
      // Also calculate roster scores from the actuals
      await updateRosterScoresFromActuals(seasonYear, currentWeek);
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching live player stats:', error);
    return [];
  }
}

/**
 * Save live player stats to weeklyActuals table
 */
async function saveLiveStatsToActuals(season: number, week: number, stats: PlayerStats[]) {
  try {
    let updated = 0;
    let inserted = 0;
    
    for (const stat of stats) {
      if (!stat.playerId || !stat.espnId) continue;
      
      // Check if entry already exists
      const existing = await db
        .select()
        .from(weeklyActuals)
        .where(
          and(
            eq(weeklyActuals.playerId, stat.playerId),
            eq(weeklyActuals.season, season),
            eq(weeklyActuals.week, week)
          )
        )
        .limit(1);
      
      const statsData = {
        passingYards: stat.passingYards,
        passingTouchdowns: stat.passingTouchdowns,
        interceptions: stat.interceptions,
        rushingYards: stat.rushingYards,
        rushingTouchdowns: stat.rushingTouchdowns,
        receptions: stat.receptions,
        receivingYards: stat.receivingYards,
        receivingTouchdowns: stat.receivingTouchdowns,
      };
      
      if (existing.length > 0) {
        // Update existing record
        await db
          .update(weeklyActuals)
          .set({
            fantasyPoints: stat.fantasyPoints,
            stats: statsData,
            updatedAt: new Date(),
          })
          .where(eq(weeklyActuals.id, existing[0].id));
        updated++;
      } else {
        // Insert new record
        await db.insert(weeklyActuals).values({
          playerId: stat.playerId,
          espnId: stat.espnId,
          season,
          week,
          fantasyPoints: stat.fantasyPoints,
          stats: statsData,
        });
        inserted++;
      }
    }
    
    console.log(`[saveLiveStatsToActuals] Saved stats for week ${week}: ${inserted} inserted, ${updated} updated`);
  } catch (error) {
    console.error('[saveLiveStatsToActuals] Error saving stats:', error);
  }
}

/**
 * Update roster scores (weeklyScores) from weeklyActuals
 * This connects player stats to roster entries
 */
async function updateRosterScoresFromActuals(season: number, week: number) {
  try {
    console.log(`[updateRosterScoresFromActuals] Calculating roster scores for season ${season}, week ${week}`);
    
    // Get all active roster entries for this season
    const rosters = await db
      .select({
        rosterEntryId: rosterEntries.id,
        playerId: rosterEntries.playerId,
        playerName: rosterEntries.playerName,
      })
      .from(rosterEntries)
      .innerJoin(seasons, eq(rosterEntries.seasonId, seasons.id))
      .where(and(
        eq(seasons.year, season),
        eq(seasons.isActive, true)
      ));

    let updated = 0;
    let skipped = 0;

    // Process each roster entry
    for (const roster of rosters) {
      if (!roster.playerId) {
        skipped++;
        continue;
      }

      // Get the player's actual stats for this week
      const actuals = await db
        .select({
          fantasyPoints: weeklyActuals.fantasyPoints,
        })
        .from(weeklyActuals)
        .where(
          and(
            eq(weeklyActuals.playerId, roster.playerId),
            eq(weeklyActuals.season, season),
            eq(weeklyActuals.week, week)
          )
        );

      if (actuals.length === 0) {
        skipped++;
        continue;
      }

      const points = Number(actuals[0].fantasyPoints);

      // Check if weekly score already exists
      const existing = await db
        .select()
        .from(weeklyScores)
        .where(
          and(
            eq(weeklyScores.rosterEntryId, roster.rosterEntryId),
            eq(weeklyScores.week, week)
          )
        );

      if (existing.length > 0) {
        // Update existing record
        await db
          .update(weeklyScores)
          .set({
            points,
            updatedAt: new Date(),
          })
          .where(eq(weeklyScores.id, existing[0].id));
      } else {
        // Insert new record
        await db.insert(weeklyScores).values({
          rosterEntryId: roster.rosterEntryId,
          week: week,
          points,
        });
      }

      updated++;
    }

    console.log(`[updateRosterScoresFromActuals] Updated ${updated} roster scores, skipped ${skipped}`);
  } catch (error) {
    console.error('[updateRosterScoresFromActuals] Error:', error);
  }
}

/**
 * Get stats for a specific player by ESPN ID
 */
export async function getPlayerStats(espnId: string, week?: number): Promise<PlayerStats | null> {
  try {
    const { games } = await getCurrentWeekGames();
    
    for (const game of games) {
      const gameStats = await getGamePlayerStats(game.id);
      const espnStats = gameStats.get(espnId);
      
      if (espnStats) {
        const fullStats: PlayerStats = {
          playerId: 0, // Will be filled from DB if needed
          playerName: espnStats.playerName || '',
          espnId,
          team: '',
          position: espnStats.position || '',
          passingYards: espnStats.passingYards || 0,
          passingTouchdowns: espnStats.passingTouchdowns || 0,
          interceptions: espnStats.interceptions || 0,
          rushingYards: espnStats.rushingYards || 0,
          rushingTouchdowns: espnStats.rushingTouchdowns || 0,
          receptions: espnStats.receptions || 0,
          receivingYards: espnStats.receivingYards || 0,
          receivingTouchdowns: espnStats.receivingTouchdowns || 0,
          fantasyPoints: 0,
          projectedPoints: null,
          gameStatus: game.status.type.state,
          lastUpdated: new Date(),
        };
        
        fullStats.fantasyPoints = calculateFantasyPoints(fullStats);
        
        return fullStats;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return null;
  }
}
