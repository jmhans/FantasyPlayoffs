'use server';

import { db } from '@/app/lib/db';
import { players } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  fetchSleeperPlayers,
  fetchSleeperProjections,
  findPlayerByEspnId,
  getPlayerProjection,
} from '@/app/lib/sleeper-api';

interface SyncResult {
  success: boolean;
  updated: number;
  skipped: number;
  error?: string;
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
    
    let updated = 0;
    let skipped = 0;
    
    // Update projections for each player
    for (const player of ourPlayers) {
      if (!player.espnId) {
        skipped++;
        continue;
      }
      
      // Find matching Sleeper player by ESPN ID
      const sleeperPlayer = findPlayerByEspnId(sleeperPlayers, player.espnId);
      
      if (!sleeperPlayer) {
        console.log(`[Projections Sync] No Sleeper match for ${player.name} (ESPN: ${player.espnId})`);
        skipped++;
        continue;
      }
      
      // Get projection for this player
      const projection = getPlayerProjection(sleeperProjections, sleeperPlayer.player_id);
      
      // Update database
      await db
        .update(players)
        .set({
          projectedPoints: projection,
          projectionsUpdatedAt: new Date(),
        })
        .where(eq(players.id, player.id));
      
      if (projection > 0) {
        console.log(`[Projections Sync] Updated ${player.name}: ${projection} pts`);
        updated++;
      } else {
        skipped++;
      }
    }
    
    console.log(`[Projections Sync] Complete: ${updated} updated, ${skipped} skipped`);
    
    return {
      success: true,
      updated,
      skipped,
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
export function getCurrentNFLWeek(): number {
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st
  const weeksSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(18, weeksSinceStart + 1));
}
