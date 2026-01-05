/**
 * Sleeper API integration for fetching player projections
 * API Documentation: https://docs.sleeper.com/
 */

interface SleeperPlayer {
  player_id: string;
  espn_id?: number;
  first_name: string;
  last_name: string;
  full_name: string;
  position: string;
  team: string | null;
  team_abbr: string | null;
  active: boolean;
  status: string;
  fantasy_positions?: string[];
}

interface SleeperProjection {
  player_id: string;
  stats: {
    pts_half_ppr?: number;
    pts_ppr?: number;
    pts_std?: number;
  };
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
    
    const data: SleeperProjection[] = await response.json();
    
    // Convert array to keyed object by player_id
    const projections: SleeperProjections = {};
    for (const proj of data) {
      if (proj.player_id && proj.stats) {
        projections[proj.player_id] = proj.stats;
      }
    }
    
    return projections;
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

// Team abbreviation mapping (ESPN -> Sleeper)
const TEAM_MAPPING: Record<string, string> = {
  'JAX': 'JAC',  // Jacksonville
  'WSH': 'WAS',  // Washington
};

function normalizeTeam(team: string): string {
  const upper = team.toUpperCase();
  return TEAM_MAPPING[upper] || upper;
}

/**
 * Match Sleeper player by name and team (fallback method)
 * Use this when ESPN ID matching fails
 */
export function findPlayerByNameAndTeam(
  players: Map<string, SleeperPlayer>,
  name: string,
  team: string,
  position: string
): SleeperPlayer | null {
  const normalizedTeam = normalizeTeam(team);
  const normalizedPosition = position.toUpperCase();
  
  // Helper to clean names (remove suffixes like Jr., Sr., II, III, etc.)
  const cleanName = (n: string) => n
    .toLowerCase()
    .replace(/\s+(jr\.?|sr\.?|ii|iii|iv|v)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const cleanedSearchName = cleanName(name);
  const searchLastName = cleanedSearchName.split(' ').pop() || '';
  
  for (const player of players.values()) {
    // Skip inactive players
    if (!player.active) continue;
    
    const playerFullName = player.full_name || '';
    const playerLastName = player.last_name || '';
    const playerTeam = player.team_abbr || '';
    const playerPos = player.position || '';
    
    // Must match position
    if (playerPos.toUpperCase() !== normalizedPosition) continue;
    
    // Must match team (if player has team data)
    if (playerTeam && playerTeam.toUpperCase() !== normalizedTeam) continue;
    
    const cleanedPlayerName = cleanName(playerFullName);
    
    // Try exact name match (after cleaning)
    if (cleanedPlayerName === cleanedSearchName) {
      return player;
    }
    
    // Try last name match
    if (playerLastName.toLowerCase() === searchLastName) {
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
