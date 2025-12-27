const { sql } = require('@vercel/postgres');
const { config } = require('dotenv');

config({ path: '.env.local' });

(async () => {
  try {
    const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'fantasy_playoffs' ORDER BY table_name`;
    console.log('✓ Tables in fantasy_playoffs schema on dev branch:');
    result.rows.forEach(r => console.log('  -', r.table_name));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
