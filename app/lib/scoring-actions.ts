'use server';

import { db } from '@/app/lib/db';
import { players, rosterEntries, seasons } from '@/app/lib/db/schema';
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
    
    return {
      week: data.week?.number || 1,
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
  points += Math.floor(stats.passingYards / 25);
  points += stats.passingTouchdowns * 6;
  points -= stats.interceptions * 2;
  
  // Rushing
  points += Math.floor(stats.rushingYards / 10);
  points += stats.rushingTouchdowns * 6;
  
  // Receiving (Half PPR)
  points += stats.receptions * 0.5;
  points += Math.floor(stats.receivingYards / 10);
  points += stats.receivingTouchdowns * 6;
  
  return points;
}

/**
 * Main function to fetch live stats for all rostered players
 */
export async function getLivePlayerStats(seasonYear: number): Promise<PlayerStats[]> {
  try {
    // Get all players on rosters
    const rosterPlayers = await getActiveRosterPlayers(seasonYear);
    
    if (rosterPlayers.length === 0) {
      return [];
    }

    // Get current week's games
    const { week, games } = await getCurrentWeekGames();
    
    // Map to store accumulated stats by ESPN player ID
    const playerStatsMap = new Map<string, PlayerStats>();
    
    // Fetch stats from all games
    for (const game of games) {
      const gameStats = await getGamePlayerStats(game.id);
      const gameStatus = game.status.type.state;
      
      // Process each rostered player
      for (const rosterPlayer of rosterPlayers) {
        if (!rosterPlayer.espnId) continue;
        
        const espnStats = gameStats.get(rosterPlayer.espnId);
        if (!espnStats) continue;
        
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
    
    return Array.from(playerStatsMap.values());
  } catch (error) {
    console.error('Error fetching live player stats:', error);
    return [];
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
        const fullStats = {
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
