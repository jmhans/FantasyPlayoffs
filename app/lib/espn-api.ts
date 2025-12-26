// ESPN API integration for NFL player data

const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

export interface ESPNPlayer {
  id: string;
  displayName: string;
  position: {
    abbreviation: string;
  };
  team: {
    abbreviation: string;
  };
  jersey?: string;
  status?: {
    type: string;
  };
  headshot?: {
    href: string;
  };
}

export async function fetchNFLPlayers(): Promise<ESPNPlayer[]> {
  try {
    // Fetch teams
    const teamsResponse = await fetch(`${ESPN_API_BASE}/teams?limit=32`);
    const teamsData = await teamsResponse.json();
    
    const allPlayers: ESPNPlayer[] = [];
    const allowedPositions = ['QB', 'WR', 'RB', 'TE'];
    
    // For each team, fetch roster
    for (const team of teamsData.sports[0].leagues[0].teams) {
      try {
        const teamId = team.team.id;
        const teamAbbreviation = team.team.abbreviation;
        const rosterResponse = await fetch(
          `${ESPN_API_BASE}/teams/${teamId}/roster`
        );
        const rosterData = await rosterResponse.json();
        
        if (rosterData.athletes) {
          // Only process offense group (skip defense, special teams, practice squad, injured reserve)
          const offenseGroup = rosterData.athletes.find((group: any) => group.position === 'offense');
          
          if (offenseGroup && offenseGroup.items) {
            // Filter for fantasy-relevant positions and add team info
            const playersWithTeam = offenseGroup.items
              .filter((player: ESPNPlayer) => 
                allowedPositions.includes(player.position?.abbreviation)
              )
              .map((player: ESPNPlayer) => ({
                ...player,
                team: {
                  abbreviation: teamAbbreviation
                }
              }));
            allPlayers.push(...playersWithTeam);
          }
        }
      } catch (error) {
        console.error(`Error fetching roster for team ${team.team.id}:`, error);
      }
    }
    
    return allPlayers;
  } catch (error) {
    console.error('Error fetching NFL players:', error);
    throw error;
  }
}

export async function searchNFLPlayers(query: string): Promise<ESPNPlayer[]> {
  try {
    // ESPN doesn't have a direct search endpoint, so we'll filter locally
    const allPlayers = await fetchNFLPlayers();
    const lowerQuery = query.toLowerCase();
    
    return allPlayers.filter(player => 
      player.displayName.toLowerCase().includes(lowerQuery) ||
      player.team?.abbreviation?.toLowerCase().includes(lowerQuery) ||
      player.position?.abbreviation?.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Error searching NFL players:', error);
    throw error;
  }
}

export async function getPlayerStats(playerId: string, week: number): Promise<any> {
  try {
    const response = await fetch(
      `${ESPN_API_BASE}/athletes/${playerId}/statistics?season=2025&week=${week}`
    );
    return await response.json();
  } catch (error) {
    console.error(`Error fetching stats for player ${playerId}:`, error);
    throw error;
  }
}
