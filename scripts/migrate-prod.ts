/**
 * Production Database Migration Script
 * 
 * This script safely applies Drizzle migrations to your production database.
 * It uses the generated SQL migration files in the drizzle/ directory.
 * 
 * Usage:
 *   npm run db:migrate:prod
 * 
 * Prerequisites:
 *   - POSTGRES_URL_PROD must be set in .env.local
 *   - All migrations must be generated (npm run db:generate)
 *   - Code should be tested in dev environment first
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const PROD_DATABASE_URL = process.env.POSTGRES_URL_PROD;

if (!PROD_DATABASE_URL) {
  console.error('❌ Error: POSTGRES_URL_PROD environment variable is not set');
  console.error('');
  console.error('Add this to your .env.local file:');
  console.error('POSTGRES_URL_PROD="postgresql://..."');
  console.error('');
  console.error('You can get this from your Neon dashboard:');
  console.error('1. Go to neon.tech');
  console.error('2. Select your production branch');
  console.error('3. Copy the connection string');
  process.exit(1);
}

async function runMigrations() {
  console.log('🚀 Production Database Migration');
  console.log('================================');
  console.log('');
  console.log('Target:', PROD_DATABASE_URL!.replace(/:[^:@]+@/, ':****@')); // Mask password
  console.log('Migration folder: ./drizzle');
  console.log('');

  try {
    // Create database connection
    const sql = neon(PROD_DATABASE_URL!);
    const db = drizzle(sql);

    console.log('📦 Applying migrations...');
    console.log('');

    // Run migrations
    await migrate(db, { migrationsFolder: './drizzle' });

    console.log('');
    console.log('✅ Migrations applied successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify changes in Neon dashboard');
    console.log('2. Deploy application code to production');
    console.log('3. Test thoroughly in production');
    
  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:');
    console.error(error);
    console.error('');
    console.error('⚠️  Database state may be inconsistent.');
    console.error('Check the Neon dashboard and fix any issues before retrying.');
    process.exit(1);
  }
}

// Confirmation prompt (basic - you can enhance with a proper prompt library)
console.log('');
console.log('⚠️  WARNING: You are about to migrate the PRODUCTION database!');
console.log('');
console.log('This will:');
console.log('- Apply all pending migrations from ./drizzle folder');
console.log('- Modify the production database schema');
console.log('- Cannot be easily reversed');
console.log('');
console.log('Make sure you have:');
console.log('✓ Tested migrations in development');
console.log('✓ Backed up production data (if needed)');
console.log('✓ Reviewed all migration SQL files');
console.log('');

// For PowerShell, we'll just run it - user should use npm script with confirmation
runMigrations();
