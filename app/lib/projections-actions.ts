'use server';

import { db } from '@/app/lib/db';
import { players } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  fetchSleeperPlayers,
  fetchSleeperProjections,
  findPlayerByNameAndTeam,
  getPlayerProjection,
} from '@/app/lib/sleeper-api';

interface SyncResult {
  success: boolean;
  updated: number;
  skipped: number;
  noProjection?: number;
  noMatch?: number;
  error?: string;
}

/**
 * Sync projections for multiple weeks at once
 */
export async function syncMultipleWeeks(
  season: number,
  startWeek: number,
  endWeek: number
): Promise<{ success: boolean; results: Array<{ week: number; updated: number; noProjection: number; noMatch: number }> }> {
  const results = [];
  
  for (let week = startWeek; week <= endWeek; week++) {
    console.log(`\n[Projections Sync] ===== Starting week ${week} =====`);
    const result = await syncProjectionsFromSleeper(season, week);
    
    if (result.success) {
      results.push({
        week,
        updated: result.updated || 0,
        noProjection: result.noProjection || 0,
        noMatch: result.noMatch || 0,
      });
    }
  }
  
  console.log(`\n[Projections Sync] ===== Multi-week sync complete! =====`);
  console.log(`Total weeks processed: ${results.length}`);
  const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);
  console.log(`Total players with projections: ${totalUpdated}`);
  
  return { success: true, results };
}

/**
 * Sync projections from Sleeper for all players in our database
 * This should be run once per week (or when matchups change)
 * 
 * @param season - NFL season year
 * @param week - NFL week number
 */
export async function syncProjectionsFromSleeper(
  season: number,
  week: number
): Promise<SyncResult> {
  try {
    console.log(`[Projections Sync] Starting sync for ${season} week ${week}`);
    
    // Fetch Sleeper data
    const sleeperPlayers = await fetchSleeperPlayers();
    const sleeperProjections = await fetchSleeperProjections(season, week);
    
    console.log(`[Projections Sync] Fetched ${sleeperPlayers.size} Sleeper players`);
    console.log(`[Projections Sync] Fetched ${Object.keys(sleeperProjections).length} projections`);
    
    // Get all players from our database
    const ourPlayers = await db.select().from(players);
    console.log(`[Projections Sync] Found ${ourPlayers.length} players in database`);
    
    // Debug: check projection data structure
    const sampleProjectionKeys = Object.keys(sleeperProjections).slice(0, 3);
    console.log(`[Projections Sync] Sample projection keys:`, sampleProjectionKeys);
    if (sampleProjectionKeys.length > 0) {
      console.log(`[Projections Sync] Sample projection data:`, JSON.stringify(sleeperProjections[sampleProjectionKeys[0]]));
    }
    
    let updated = 0;
    let skipped = 0;
    let matched = 0;
    let noMatch = 0;
    let noProjection = 0;
    
    // Update projections for each player
    for (const player of ourPlayers) {
      // Skip if missing required fields
      if (!player.name || !player.team || !player.position) {
        skipped++;
        continue;
      }
      
      // Match by name, team, and position
      const sleeperPlayer = findPlayerByNameAndTeam(
        sleeperPlayers, 
        player.name, 
        player.team, 
        player.position
      );
      
      if (!sleeperPlayer) {
        noMatch++;
        skipped++;
        continue;
      }
      
      matched++;
      
      // Get projection for this player
      const projection = getPlayerProjection(sleeperProjections, sleeperPlayer.player_id);
      
      // Update database (even if projection is 0, so we know we checked)
      await db
        .update(players)
        .set({
          projectedPoints: projection,
          projectionsUpdatedAt: new Date(),
        })
        .where(eq(players.id, player.id));
      
      if (projection > 0) {
        updated++;
      } else {
        noProjection++;
        skipped++;
      }
    }
    
    console.log(`[Projections Sync] Complete: ${updated} with projections, ${noProjection} matched but no projection, ${noMatch} no match, ${skipped} total skipped`);
    
    return {
      success: true,
      updated,
      skipped,
      noProjection,
      noMatch,
    };
  } catch (error) {
    console.error('[Projections Sync] Error:', error);
    return {
      success: false,
      updated: 0,
      skipped: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get current NFL week number
 * This is a simple estimation - you may want to use a more accurate source
 */
export async function getCurrentNFLWeek(): Promise<number> {
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st
  const weeksSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(18, weeksSinceStart + 1));
}
