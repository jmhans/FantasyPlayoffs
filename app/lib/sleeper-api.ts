/**
 * Sleeper API integration for fetching player projections
 * API Documentation: https://docs.sleeper.com/
 */

interface SleeperPlayer {
  player_id: string;
  espn_id?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  position: string;
  team: string | null;
  status: string;
  fantasy_positions?: string[];
}

interface SleeperProjections {
  [playerId: string]: {
    pts_half_ppr?: number;
    pts_ppr?: number;
    pts_std?: number;
  };
}

/**
 * Fetch all NFL players from Sleeper
 * This returns a map of player_id to player data
 */
export async function fetchSleeperPlayers(): Promise<Map<string, SleeperPlayer>> {
  try {
    const response = await fetch('https://api.sleeper.app/v1/players/nfl', {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });
    
    if (!response.ok) {
      throw new Error(`Sleeper API error: ${response.status}`);
    }
    
    const data = await response.json();
    return new Map(Object.entries(data));
  } catch (error) {
    console.error('Error fetching Sleeper players:', error);
    throw error;
  }
}

/**
 * Fetch projections for a specific NFL week
 * Note: Sleeper primarily provides regular season projections
 * Playoff projections may be limited or unavailable
 * 
 * @param season - NFL season year (e.g., 2024)
 * @param week - NFL week number (1-18 for regular season, 19+ for playoffs)
 */
export async function fetchSleeperProjections(
  season: number,
  week: number
): Promise<SleeperProjections> {
  try {
    // Sleeper's projections endpoint
    const response = await fetch(
      `https://api.sleeper.app/projections/nfl/${season}/${week}?season_type=regular`,
      { cache: 'no-store' } // Don't cache projections
    );
    
    if (!response.ok) {
      // Sleeper may not have projections for this week
      console.warn(`No Sleeper projections available for ${season} week ${week}`);
      return {};
    }
    
    const data = await response.json();
    return data || {};
  } catch (error) {
    console.error('Error fetching Sleeper projections:', error);
    return {};
  }
}

/**
 * Match Sleeper player to ESPN ID
 * Sleeper includes ESPN IDs in their player data
 */
export function findPlayerByEspnId(
  players: Map<string, SleeperPlayer>,
  espnId: string
): SleeperPlayer | null {
  for (const [sleeperId, player] of players.entries()) {
    if (player.espn_id && player.espn_id.toString() === espnId) {
      return player;
    }
  }
  return null;
}

/**
 * Get projection for a specific player
 * Returns Half PPR projection (matches our scoring)
 */
export function getPlayerProjection(
  projections: SleeperProjections,
  sleeperId: string
): number {
  const playerProj = projections[sleeperId];
  if (!playerProj) return 0;
  
  // Use Half PPR since that matches our scoring system (0.5 per reception)
  return Math.round(playerProj.pts_half_ppr || 0);
}
