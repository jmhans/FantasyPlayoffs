// Test script to check ESPN API response
const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

async function testAPI() {
  console.log('Testing Buffalo Bills roster...\n');
  
  const response = await fetch(`${ESPN_API_BASE}/teams/buf/roster`);
  const data = await response.json();
  
  console.log('Athletes structure:', data.athletes ? data.athletes.length + ' groups' : 'No athletes');
  
  if (data.athletes) {
    for (const group of data.athletes) {
      console.log(`\n${group.position}: ${group.items?.length || 0} players`);
      if (group.items) {
        const sample = group.items.slice(0, 3);
        for (const player of sample) {
          console.log(`  - ${player.displayName} (#${player.jersey || 'N/A'}) - ${player.position?.abbreviation || 'N/A'}`);
        }
      }
    }
  }
  
  // Check if Josh Allen is in there
  console.log('\n\nSearching for Josh Allen...');
  if (data.athletes) {
    for (const group of data.athletes) {
      if (group.items) {
        const joshAllen = group.items.find(p => p.displayName.toLowerCase().includes('josh allen'));
        if (joshAllen) {
          console.log('FOUND:', JSON.stringify(joshAllen, null, 2));
        }
      }
    }
  }
  
  // Try alternate endpoint - scorers/leaders
  console.log('\n\nTrying scorers endpoint...');
  const scorersResponse = await fetch(`${ESPN_API_BASE}/leaders`);
  const scorersData = await scorersResponse.json();
  console.log('Leaders structure:', Object.keys(scorersData));
}

testAPI().catch(console.error);
