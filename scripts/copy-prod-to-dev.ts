/**
 * Copy Data from Production Database to Dev
 * 
 * This script copies all data from production to dev database.
 * WARNING: This will DELETE all existing data in dev first!
 * 
 * Usage:
 *   npm run db:copy-from-prod
 * 
 * Prerequisites:
 *   - POSTGRES_URL in .env.local (dev database)
 *   - POSTGRES_URL_PROD in .env.local (prod database)
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { 
  players, 
  participants, 
  seasons, 
  rosterEntries, 
  weeklyScores,
  weeklyActuals,
  seasonConfig,
  drafts,
  draftOrder,
  draftPicks
} from '@/app/lib/db/schema';
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

async function copyProdToDev() {
  console.log('🔄 Copying Data from Production to Dev');
  console.log('==========================================');
  console.log('⚠️  WARNING: This will DELETE all existing dev data!');
  console.log('');
  console.log('Source (Prod):', PROD_DATABASE_URL!.replace(/:[^:@]+@/, ':****@'));
  console.log('Target (Dev):', DEV_DATABASE_URL!.replace(/:[^:@]+@/, ':****@'));
  console.log('');

  // Wait 3 seconds to allow cancel
  console.log('Starting in 3 seconds... Press Ctrl+C to cancel');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Connect to both databases
    console.log('📡 Connecting to databases...');
    const prodSql = neon(PROD_DATABASE_URL!);
    const prodDb = drizzle(prodSql);

    const devSql = neon(DEV_DATABASE_URL!);
    const devDb = drizzle(devSql);
    
    console.log('');
    console.log('🗑️  Clearing dev database...');
    await devDb.delete(draftPicks);
    console.log('  ✓ Cleared draft_picks');
    await devDb.delete(draftOrder);
    console.log('  ✓ Cleared draft_order');
    await devDb.delete(drafts);
    console.log('  ✓ Cleared drafts');
    await devDb.delete(weeklyScores);
    console.log('  ✓ Cleared weekly_scores');
    await devDb.delete(weeklyActuals);
    console.log('  ✓ Cleared weekly_actuals');
    await devDb.delete(rosterEntries);
    console.log('  ✓ Cleared roster_entries');
    await devDb.delete(seasons);
    console.log('  ✓ Cleared seasons');
    await devDb.delete(participants);
    console.log('  ✓ Cleared participants');
    await devDb.delete(seasonConfig);
    console.log('  ✓ Cleared season_config');
    await devDb.delete(players);
    console.log('  ✓ Cleared players');

    // Copy data from prod to dev
    console.log('');
    console.log('📤 Copying data from production...');
    
    // 1. Players
    const prodPlayers = await prodDb.select().from(players);
    if (prodPlayers.length > 0) {
      await devDb.insert(players).values(prodPlayers);
      console.log(`  ✓ Copied ${prodPlayers.length} players`);
    } else {
      console.log('  ⚠️  No players to copy');
    }

    // 2. Season Config
    const prodSeasonConfig = await prodDb.select().from(seasonConfig);
    if (prodSeasonConfig.length > 0) {
      await devDb.insert(seasonConfig).values(prodSeasonConfig);
      console.log(`  ✓ Copied ${prodSeasonConfig.length} season configs`);
    } else {
      console.log('  ⚠️  No season config to copy');
    }

    // 3. Participants
    const prodParticipants = await prodDb.select().from(participants);
    if (prodParticipants.length > 0) {
      await devDb.insert(participants).values(prodParticipants);
      console.log(`  ✓ Copied ${prodParticipants.length} participants`);
    } else {
      console.log('  ⚠️  No participants to copy');
    }

    // 4. Seasons
    const prodSeasons = await prodDb.select().from(seasons);
    if (prodSeasons.length > 0) {
      await devDb.insert(seasons).values(prodSeasons);
      console.log(`  ✓ Copied ${prodSeasons.length} seasons`);
    } else {
      console.log('  ⚠️  No seasons to copy');
    }

    // 5. Roster Entries
    const prodRosterEntries = await prodDb.select().from(rosterEntries);
    if (prodRosterEntries.length > 0) {
      await devDb.insert(rosterEntries).values(prodRosterEntries);
      console.log(`  ✓ Copied ${prodRosterEntries.length} roster entries`);
    } else {
      console.log('  ⚠️  No roster entries to copy');
    }

    // 6. Weekly Actuals
    const prodWeeklyActuals = await prodDb.select().from(weeklyActuals);
    if (prodWeeklyActuals.length > 0) {
      await devDb.insert(weeklyActuals).values(prodWeeklyActuals);
      console.log(`  ✓ Copied ${prodWeeklyActuals.length} weekly actuals`);
    } else {
      console.log('  ⚠️  No weekly actuals to copy');
    }

    // 7. Weekly Scores
    const prodWeeklyScores = await prodDb.select().from(weeklyScores);
    if (prodWeeklyScores.length > 0) {
      await devDb.insert(weeklyScores).values(prodWeeklyScores);
      console.log(`  ✓ Copied ${prodWeeklyScores.length} weekly scores`);
    } else {
      console.log('  ⚠️  No weekly scores to copy');
    }

    // 8. Drafts
    const prodDrafts = await prodDb.select().from(drafts);
    if (prodDrafts.length > 0) {
      await devDb.insert(drafts).values(prodDrafts);
      console.log(`  ✓ Copied ${prodDrafts.length} drafts`);
    } else {
      console.log('  ⚠️  No drafts to copy');
    }

    // 9. Draft Order
    const prodDraftOrder = await prodDb.select().from(draftOrder);
    if (prodDraftOrder.length > 0) {
      await devDb.insert(draftOrder).values(prodDraftOrder);
      console.log(`  ✓ Copied ${prodDraftOrder.length} draft order entries`);
    } else {
      console.log('  ⚠️  No draft order to copy');
    }

    // 10. Draft Picks
    const prodDraftPicks = await prodDb.select().from(draftPicks);
    if (prodDraftPicks.length > 0) {
      await devDb.insert(draftPicks).values(prodDraftPicks);
      console.log(`  ✓ Copied ${prodDraftPicks.length} draft picks`);
    } else {
      console.log('  ⚠️  No draft picks to copy');
    }

    console.log('');
    console.log('✅ Copy Complete!');
    console.log('==========================================');
    console.log('Dev database now has all production data');
    
  } catch (error) {
    console.error('');
    console.error('❌ Fatal Error:', error);
    process.exit(1);
  }
}

// Run the copy
copyProdToDev()
  .then(() => {
    console.log('');
    console.log('Done! Your dev database now mirrors production.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
