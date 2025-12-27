const { Client } = require('pg');

// Main branch connection
const MAIN_BRANCH_URL = 'postgres://default:IJ9XlAmzg6Gh@ep-autumn-wave-a4waqqpj-pooler.us-east-1.aws.neon.tech/verceldb?sslmode=require';

async function clearMainBranchData() {
  const client = new Client({ connectionString: MAIN_BRANCH_URL });

  try {
    console.log('⚠️  WARNING: This will DELETE ALL data from fantasy_playoffs schema on MAIN branch!');
    console.log('Main branch endpoint: ep-autumn-wave-a4waqqpj');
    console.log('\nConnecting to main branch...');
    await client.connect();
    console.log('✓ Connected\n');

    // Set schema
    await client.query('SET search_path TO fantasy_playoffs, public');

    // Tables in reverse dependency order (children first, parents last)
    const tables = [
      'draft_picks',
      'draft_order',
      'drafts',
      'weekly_scores',
      'roster_entries',
      'season_config',
      'seasons',
      'players',
      'participants',
    ];

    console.log('Clearing data from fantasy_playoffs schema...\n');

    for (const table of tables) {
      const countResult = await client.query(`SELECT COUNT(*) FROM fantasy_playoffs.${table}`);
      const rowCount = parseInt(countResult.rows[0].count);
      
      if (rowCount > 0) {
        await client.query(`DELETE FROM fantasy_playoffs.${table}`);
        console.log(`✓ Cleared ${rowCount} rows from ${table}`);
      } else {
        console.log(`  ${table} was already empty`);
      }
    }

    console.log('\n✅ Main branch fantasy_playoffs schema cleared successfully!');
    console.log('Your production database is now empty and ready for fresh data.');

  } catch (error) {
    console.error('❌ Failed to clear data:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

clearMainBranchData();
