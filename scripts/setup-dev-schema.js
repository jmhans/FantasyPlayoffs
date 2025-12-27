const { config } = require('dotenv');
const { sql } = require('@vercel/postgres');

// Load .env.local
config({ path: '.env.local' });

async function setupSchema() {
  try {
    console.log('Creating fantasy_playoffs schema on dev branch...');
    console.log('Using database:', process.env.POSTGRES_URL?.substring(0, 50) + '...');
    
    // Create the schema
    await sql`CREATE SCHEMA IF NOT EXISTS fantasy_playoffs`;
    console.log('✓ Schema created');
    
    // Set search path as default for the database
    await sql`ALTER DATABASE verceldb SET search_path TO fantasy_playoffs, public`;
    console.log('✓ Default search path set for database');
    
    console.log('\n✓ Dev branch is ready!');
    console.log('Now run: npm run db:push');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupSchema();
