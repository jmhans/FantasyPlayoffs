const { Client } = require('pg');

// Main branch connection
const MAIN_BRANCH_URL = 'postgres://default:IJ9XlAmzg6Gh@ep-autumn-wave-a4waqqpj-pooler.us-east-1.aws.neon.tech/verceldb?sslmode=require';

async function checkMainBranch() {
  const client = new Client({ connectionString: MAIN_BRANCH_URL });

  try {
    console.log('Checking main branch (ep-autumn-wave-a4waqqpj)...\n');
    await client.connect();

    // Check if fantasy_playoffs schema exists
    const schemaCheck = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'fantasy_playoffs'
    `);

    if (schemaCheck.rows.length === 0) {
      console.log('❌ fantasy_playoffs schema does NOT exist on main branch!');
      console.log('   You may need to run migrations on the main branch.');
      process.exit(0);
    }

    console.log('✓ fantasy_playoffs schema exists\n');

    // Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'fantasy_playoffs'
      ORDER BY table_name
    `);

    console.log(`Found ${tables.rows.length} tables in fantasy_playoffs schema:`);
    for (const table of tables.rows) {
      const count = await client.query(`SELECT COUNT(*) FROM fantasy_playoffs.${table.table_name}`);
      console.log(`  - ${table.table_name}: ${count.rows[0].count} rows`);
    }

    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
    await client.end();
    process.exit(1);
  }
}

checkMainBranch();
