'use server';

import { db } from '@/app/lib/db';
import { players, weeklyActuals } from '@/app/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface WeeklyActualsResult {
  success: boolean;
  updated: number;
  skipped: number;
  error?: string;
}

/**
 * Fetch player stats from ESPN for a specific week
 * Uses the scoreboard + game summary endpoints (proven working approach)
 */
async function fetchESPNWeeklyStats(season: number, week: number) {
  try {
    // First, get all games for this week
    // ESPN API format: seasontype=2 for regular season, seasontype=3 for playoffs
    const seasontype = week <= 18 ? 2 : 3;
    const scoreboardResponse = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=${seasontype}&week=${week}`,
      { cache: 'no-store' }
    );
    
    if (!scoreboardResponse.ok) {
      console.warn(`ESPN scoreboard API returned ${scoreboardResponse.status} for ${season} week ${week}`);
      return new Map();
    }
    
    const scoreboardData = await scoreboardResponse.json();
    const games = scoreboardData.events || [];
    
    console.log(`[Weekly Actuals] Found ${games.length} games for week ${week}`);
    
    // Fetch stats from each game
    const allPlayerStats = new Map<string, any>();
    
    for (const game of games) {
      const gameId = game.id;
      
      try {
        const gameResponse = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`,
          { cache: 'no-store' }
        );
        
        if (!gameResponse.ok) continue;
        
        const gameData = await gameResponse.json();
        
        if (gameData.boxscore?.players) {
          // Process both teams
          for (const teamStats of gameData.boxscore.players) {
            // Process each stat category (passing, rushing, receiving)
            for (const statCategory of teamStats.statistics) {
              const categoryName = statCategory.name;
              
              if (statCategory.athletes) {
                for (const athleteData of statCategory.athletes) {
                  const espnId = athleteData.athlete.id;
                  const stats = athleteData.stats || [];
                  
                  // Get or create player stats entry
                  let playerStats = allPlayerStats.get(espnId);
                  if (!playerStats) {
                    playerStats = {
                      espnId,
                      name: athleteData.athlete.displayName,
                      position: athleteData.athlete.position?.abbreviation || '',
                      passingYards: 0,
                      passingTouchdowns: 0,
                      interceptions: 0,
                      rushingYards: 0,
                      rushingTouchdowns: 0,
                      receptions: 0,
                      receivingYards: 0,
                      receivingTouchdowns: 0,
                      fumblesLost: 0,
                    };
                    allPlayerStats.set(espnId, playerStats);
                  }
                  
                  // Parse stats based on category
                  if (categoryName === 'passing' && stats.length >= 5) {
                    playerStats.passingYards = parseInt(stats[1]) || 0;
                    playerStats.passingTouchdowns = parseInt(stats[3]) || 0;
                    playerStats.interceptions = parseInt(stats[4]) || 0;
                  } else if (categoryName === 'rushing' && stats.length >= 4) {
                    playerStats.rushingYards = parseInt(stats[1]) || 0;
                    playerStats.rushingTouchdowns = parseInt(stats[3]) || 0;
                  } else if (categoryName === 'receiving' && stats.length >= 4) {
                    playerStats.receptions = parseInt(stats[0]) || 0;
                    playerStats.receivingYards = parseInt(stats[1]) || 0;
                    playerStats.receivingTouchdowns = parseInt(stats[3]) || 0;
                  } else if (categoryName === 'fumbles' && stats.length >= 2) {
                    playerStats.fumblesLost = parseInt(stats[1]) || 0;
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching game ${gameId}:`, error);
      }
      
      // Small delay between game requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return allPlayerStats;
  } catch (error) {
    console.error('Error fetching ESPN weekly stats:', error);
    return new Map();
  }
}

/**
 * Calculate fantasy points from stats
 * Matches the scoring system: 6pt pass TD, 1pt/25 pass yds, -2 INT, etc.
 */
function calculateFantasyPoints(stats: any): number {
  if (!stats) return 0;
  
  let points = 0;
  
  // Passing stats
  const passYds = stats.passingYards || 0;
  const passTDs = stats.passingTouchdowns || 0;
  const passInt = stats.interceptions || 0;
  
  points += passYds / 25; // 0.04 pts per yard (1 pt per 25 yards)
  points += passTDs * 6; // 6 pts per TD
  points += passInt * -2; // -2 pts per INT
  
  // Rushing stats
  const rushYds = stats.rushingYards || 0;
  const rushTDs = stats.rushingTouchdowns || 0;
  
  points += rushYds / 10; // 0.1 pts per yard (1 pt per 10 yards)
  points += rushTDs * 6; // 6 pts per TD
  
  // Receiving stats
  const recYds = stats.receivingYards || 0;
  const recTDs = stats.receivingTouchdowns || 0;
  const receptions = stats.receptions || 0;
  
  points += recYds / 10; // 0.1 pts per yard (1 pt per 10 yards)
  points += recTDs * 6; // 6 pts per TD
  points += receptions * 0.5; // 0.5 pts per reception (Half PPR)
  
  // Fumbles lost
  const fumbles = stats.fumblesLost || 0;
  points += fumbles * -2; // -2 pts per fumble lost
  
  return points;
}

/**
 * Sync weekly actuals from ESPN for a specific week
 */
export async function syncWeeklyActuals(
  season: number,
  week: number
): Promise<WeeklyActualsResult> {
  try {
    console.log(`[Weekly Actuals] Starting sync for ${season} week ${week}`);
    
    // Get all players from database
    const allPlayers = await db.select().from(players);
    console.log(`[Weekly Actuals] Found ${allPlayers.length} players in database`);
    
    // Fetch stats from ESPN
    const espnStatsMap = await fetchESPNWeeklyStats(season, week);
    console.log(`[Weekly Actuals] Fetched stats for ${espnStatsMap.size} players from ESPN`);
    
    let updated = 0;
    let skipped = 0;
    
    // Process each player
    for (const player of allPlayers) {
      if (!player.espnId) {
        skipped++;
        continue;
      }
      
      // Find this player's stats in ESPN data
      const espnStats = espnStatsMap.get(player.espnId);
      
      if (!espnStats) {
        skipped++;
        continue;
      }
      
      // Calculate fantasy points
      const fantasyPoints = calculateFantasyPoints(espnStats);
      
      // Only save if player had any activity (points > 0 or explicitly 0 with stats)
      if (fantasyPoints === 0 && !espnStats.passingYards && !espnStats.rushingYards && !espnStats.receptions) {
        skipped++;
        continue;
      }
      
      // Check if record already exists
      const existing = await db
        .select()
        .from(weeklyActuals)
        .where(
          and(
            eq(weeklyActuals.playerId, player.id),
            eq(weeklyActuals.season, season),
            eq(weeklyActuals.week, week)
          )
        );
      
      if (existing.length > 0) {
        // Update existing record
        await db
          .update(weeklyActuals)
          .set({
            fantasyPoints,
            stats: espnStats,
            updatedAt: new Date(),
          })
          .where(eq(weeklyActuals.id, existing[0].id));
      } else {
        // Insert new record
        await db.insert(weeklyActuals).values({
          playerId: player.id,
          espnId: player.espnId,
          season,
          week,
          fantasyPoints,
          stats: espnStats,
        });
      }
      
      updated++;
    }
    
    console.log(`[Weekly Actuals] Complete: ${updated} updated, ${skipped} skipped`);
    
    return {
      success: true,
      updated,
      skipped,
    };
  } catch (error) {
    console.error('[Weekly Actuals] Error:', error);
    return {
      success: false,
      updated: 0,
      skipped: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync multiple weeks of actuals at once
 */
export async function syncMultipleWeeksActuals(
  season: number,
  startWeek: number,
  endWeek: number
): Promise<{ success: boolean; results: Array<{ week: number; updated: number; skipped: number }> }> {
  const results = [];
  
  for (let week = startWeek; week <= endWeek; week++) {
    console.log(`\n[Weekly Actuals] ===== Starting week ${week} =====`);
    const result = await syncWeeklyActuals(season, week);
    
    if (result.success) {
      results.push({
        week,
        updated: result.updated || 0,
        skipped: result.skipped || 0,
      });
    }
    
    // Small delay between requests to be nice to ESPN API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n[Weekly Actuals] ===== Multi-week sync complete! =====`);
  console.log(`Total weeks processed: ${results.length}`);
  const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);
  console.log(`Total player-week records: ${totalUpdated}`);
  
  return { success: true, results };
}
