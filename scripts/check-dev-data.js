const { sql } = require('@vercel/postgres');
const { config } = require('dotenv');

config({ path: '.env.local' });

(async () => {
  try {
    console.log('Checking connection and data...\n');
    console.log('Connected to:', process.env.POSTGRES_URL?.substring(0, 60) + '...\n');
    
    // Check if we're connected to the right database
    const dbInfo = await sql`SELECT current_database(), current_schema()`;
    console.log('Current database:', dbInfo.rows[0].current_database);
    console.log('Current schema:', dbInfo.rows[0].current_schema);
    console.log();
    
    // Check participants in fantasy_playoffs schema
    const participants = await sql`SELECT * FROM fantasy_playoffs.participants`;
    console.log(`Participants in fantasy_playoffs schema: ${participants.rows.length}`);
    if (participants.rows.length > 0) {
      console.log('Sample:', participants.rows.slice(0, 3).map(p => `${p.id}: ${p.name}`));
    }
    console.log();
    
    // Check players
    const players = await sql`SELECT COUNT(*) as count FROM fantasy_playoffs.players`;
    console.log(`Players in fantasy_playoffs schema: ${players.rows[0].count}`);
    console.log();
    
    // Check roster entries
    const roster = await sql`SELECT COUNT(*) as count FROM fantasy_playoffs.roster_entries`;
    console.log(`Roster entries in fantasy_playoffs schema: ${roster.rows[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
