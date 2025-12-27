const { config } = require('dotenv');
const { sql } = require('@vercel/postgres');

config({ path: '.env.local' });

async function testQuery() {
  try {
    console.log('Testing participants query...\n');
    console.log('Using connection:', process.env.POSTGRES_URL?.substring(0, 60) + '...\n');
    
    // Test direct query
    const result = await sql`
      SELECT 
        p.id as participant_id,
        p.name as participant_name,
        p.auth0_id,
        COALESCE(SUM(ws.points), 0) as total_points
      FROM fantasy_playoffs.participants p
      LEFT JOIN fantasy_playoffs.roster_entries re ON p.id = re.participant_id
      LEFT JOIN fantasy_playoffs.weekly_scores ws ON re.id = ws.roster_entry_id
      GROUP BY p.id, p.name, p.auth0_id
      ORDER BY COALESCE(SUM(ws.points), 0) DESC
    `;

    console.log('Query result:');
    console.log('Found', result.rows.length, 'participants\n');
    
    result.rows.forEach(p => {
      console.log(`  - ${p.participant_name} (ID: ${p.participant_id}, auth0Id: ${p.auth0_id || 'null'}, points: ${p.total_points})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testQuery();
