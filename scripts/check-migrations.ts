/**
 * Check Migration Status
 * 
 * This script shows you what migrations exist and helps you verify
 * what will be applied to production.
 * 
 * Usage:
 *   npm run db:check-migrations
 */

import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_FOLDER = './drizzle';

console.log('📋 Checking Migration Status');
console.log('============================');
console.log('');

try {
  // Read migrations folder
  const files = fs.readdirSync(MIGRATIONS_FOLDER);
  
  // Filter for SQL migration files
  const sqlFiles = files
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  if (sqlFiles.length === 0) {
    console.log('ℹ️  No migrations found in', MIGRATIONS_FOLDER);
    console.log('');
    console.log('Generate migrations with: npm run db:generate');
    process.exit(0);
  }

  console.log(`Found ${sqlFiles.length} migration(s):\n`);
  
  sqlFiles.forEach((file, index) => {
    const filePath = path.join(MIGRATIONS_FOLDER, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    
    console.log(`${index + 1}. ${file}`);
    console.log(`   Size: ${(content.length / 1024).toFixed(2)} KB`);
    console.log(`   Lines: ${lines.length}`);
    
    // Show first few non-comment lines as preview
    const preview = lines
      .filter(l => !l.startsWith('--'))
      .slice(0, 3)
      .map(l => '   ' + (l.length > 60 ? l.substring(0, 60) + '...' : l))
      .join('\n');
    
    if (preview) {
      console.log('   Preview:');
      console.log(preview);
    }
    console.log('');
  });

  // Check journal
  const journalPath = path.join(MIGRATIONS_FOLDER, 'meta', '_journal.json');
  if (fs.existsSync(journalPath)) {
    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
    console.log('📚 Migration Journal:');
    console.log(`   Version: ${journal.version}`);
    console.log(`   Dialect: ${journal.dialect}`);
    console.log(`   Entries: ${journal.entries?.length || 0}`);
    console.log('');
  }

  console.log('✅ To apply these migrations to production:');
  console.log('   npm run db:migrate:prod');
  console.log('');
  console.log('⚠️  Make sure to test in dev first:');
  console.log('   npm run db:push (dev environment)');
  
} catch (error) {
  console.error('❌ Error checking migrations:', error);
  process.exit(1);
}
