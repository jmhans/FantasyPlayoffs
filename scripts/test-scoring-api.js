const https = require('https');

// Test fetching a recent game
const gameId = '401671809'; // A recent game

console.log(`Fetching game ${gameId}...`);

https.get(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      
      console.log('\n=== GAME INFO ===');
      console.log('Status:', json.header?.competitions?.[0]?.status?.type?.state);
      console.log('Teams:', json.header?.competitions?.[0]?.competitors?.map(c => c.team.abbreviation).join(' vs '));
      
      if (json.boxscore?.players) {
        console.log('\n=== PLAYER STATS ===');
        
        for (const teamStats of json.boxscore.players) {
          console.log(`\n${teamStats.team.displayName}:`);
          
          for (const statCategory of teamStats.statistics) {
            console.log(`\n  ${statCategory.name.toUpperCase()}:`);
            console.log(`  Labels: ${statCategory.labels.join(', ')}`);
            
            if (statCategory.athletes && statCategory.athletes.length > 0) {
              const player = statCategory.athletes[0];
              console.log(`  Sample player: ${player.athlete.displayName}`);
              console.log(`  ESPN ID: ${player.athlete.id}`);
              console.log(`  Stats: ${player.stats.join(', ')}`);
            }
          }
        }
      } else {
        console.log('\nNo boxscore data available');
      }
    } catch (err) {
      console.error('Error parsing JSON:', err.message);
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
