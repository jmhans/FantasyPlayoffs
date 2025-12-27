const { Client } = require('pg');
const { config } = require('dotenv');

// Load environment
config({ path: '.env.local' });

// Main branch connection (you'll need to provide this)
const MAIN_BRANCH_URL = 'postgres://default:IJ9XlAmzg6Gh@ep-autumn-wave-a4waqqpj-pooler.us-east-1.aws.neon.tech/verceldb?sslmode=require';

// Dev branch connection (from .env.local)
const DEV_BRANCH_URL = process.env.POSTGRES_URL;

async function migrateData() {
  const sourceClient = new Client({ connectionString: MAIN_BRANCH_URL });
  const destClient = new Client({ connectionString: DEV_BRANCH_URL });

  try {
    console.log('Connecting to databases...');
    await sourceClient.connect();
    await destClient.connect();
    console.log('✓ Connected to both branches\n');

    // Set schema for both connections
    await sourceClient.query('SET search_path TO fantasy_playoffs, public');
    await destClient.query('SET search_path TO fantasy_playoffs, public');

    // Tables in order of dependencies (parent tables first)
    const tables = [
      'participants',
      'players',
      'seasons',
      'season_config',
      'roster_entries',
      'weekly_scores',
      'drafts',
      'draft_order',
      'draft_picks',
    ];

    console.log('Starting data migration...\n');

    for (const table of tables) {
      console.log(`Migrating ${table}...`);
      
      // Get data from source
      const sourceData = await sourceClient.query(`SELECT * FROM fantasy_playoffs.${table}`);
      const rowCount = sourceData.rows.length;
      
      if (rowCount === 0) {
        console.log(`  ↳ No data to migrate\n`);
        continue;
      }

      // Get column names
      const columns = Object.keys(sourceData.rows[0]);
      const columnList = columns.join(', ');
      
      // Clear existing data in destination (optional - comment out if you want to keep existing data)
      await destClient.query(`DELETE FROM fantasy_playoffs.${table}`);
      
      // Insert data row by row
      for (const row of sourceData.rows) {
        const values = columns.map(col => row[col]);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        await destClient.query(
          `INSERT INTO fantasy_playoffs.${table} (${columnList}) VALUES (${placeholders})`,
          values
        );
      }
      
      // Reset sequence if table has an id column
      if (columns.includes('id')) {
        await destClient.query(`
          SELECT setval(
            pg_get_serial_sequence('fantasy_playoffs.${table}', 'id'),
            COALESCE((SELECT MAX(id) FROM fantasy_playoffs.${table}), 1),
            true
          )
        `);
      }
      
      console.log(`  ✓ Migrated ${rowCount} rows\n`);
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sourceClient.end();
    await destClient.end();
  }
}

migrateData();
