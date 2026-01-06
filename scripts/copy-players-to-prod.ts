/**
 * Copy Players from Dev Database to Production
 * 
 * This script copies all players from your dev database to production.
 * It runs locally so it's not subject to Vercel's timeout limits.
 * 
 * Usage:
 *   npx tsx scripts/copy-players-to-prod.ts
 * 
 * Prerequisites:
 *   - POSTGRES_URL in .env.local (dev database)
 *   - POSTGRES_URL_PROD in .env.local (prod database)
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { players } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DEV_DATABASE_URL = process.env.POSTGRES_URL;
const PROD_DATABASE_URL = process.env.POSTGRES_URL_PROD;

if (!DEV_DATABASE_URL) {
  console.error('❌ Error: POSTGRES_URL environment variable is not set');
  process.exit(1);
}

if (!PROD_DATABASE_URL) {
  console.error('❌ Error: POSTGRES_URL_PROD environment variable is not set');
  process.exit(1);
}

async function copyPlayers() {
  console.log('🔄 Copying Players from Dev to Production');
  console.log('==========================================');
  console.log('');
  console.log('Source (Dev):', DEV_DATABASE_URL!.replace(/:[^:@]+@/, ':****@'));
  console.log('Target (Prod):', PROD_DATABASE_URL!.replace(/:[^:@]+@/, ':****@'));
  console.log('');

  try {
    // Connect to both databases
    console.log('📡 Connecting to databases...');
    const devSql = neon(DEV_DATABASE_URL!);
    const devDb = drizzle(devSql);
    
    const prodSql = neon(PROD_DATABASE_URL!);
    const prodDb = drizzle(prodSql);
    
    // Fetch all players from dev
    console.log('📥 Fetching players from dev database...');
    const devPlayers = await devDb.select().from(players);
    console.log(`Found ${devPlayers.length} players in dev database`);
    
    if (devPlayers.length === 0) {
      console.log('⚠️  No players to copy. Dev database is empty.');
      return;
    }
    
    console.log('');
    console.log('📤 Copying players to production...');
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    
    for (const player of devPlayers) {
      try {
        // Check if player exists in prod (using espnId if available, otherwise name+position)
        let existing: typeof devPlayers = [];
        if (player.espnId) {
          existing = await prodDb
            .select()
            .from(players)
            .where(eq(players.espnId, player.espnId))
            .limit(1);
        }
        
        const playerData = {
          espnId: player.espnId,
          name: player.name,
          position: player.position,
          team: player.team,
          jerseyNumber: player.jerseyNumber,
          status: player.status,
          imageUrl: player.imageUrl,
          isDraftEligible: player.isDraftEligible,
          metadata: player.metadata,
          updatedAt: new Date(),
        };
        
        if (existing.length > 0) {
          // Update existing player
          await prodDb
            .update(players)
            .set(playerData)
            .where(eq(players.id, existing[0].id));
          updated++;
        } else {
          // Insert new player
          await prodDb.insert(players).values(playerData);
          inserted++;
        }
        
        if ((inserted + updated) % 50 === 0) {
          console.log(`Progress: ${inserted + updated}/${devPlayers.length} players processed...`);
        }
      } catch (error) {
        console.error(`Error copying ${player.name}:`, error);
        errors++;
      }
    }
    
    console.log('');
    console.log('✅ Copy Complete!');
    console.log('==========================================');
    console.log(`New players inserted: ${inserted}`);
    console.log(`Existing players updated: ${updated}`);
    console.log(`Errors: ${errors}`);
    console.log(`Total processed: ${inserted + updated}`);
    
  } catch (error) {
    console.error('');
    console.error('❌ Fatal Error:', error);
    process.exit(1);
  }
}

// Run the copy
copyPlayers()
  .then(() => {
    console.log('');
    console.log('Done! You can now use these players in production.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
