'use server';

import { db } from '@/app/lib/db';
import { rosterEntries, weeklyActuals, weeklyScores, players, seasons } from '@/app/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface RosterScoringResult {
  success: boolean;
  updated: number;
  skipped: number;
  error?: string;
}

/**
 * Map NFL week to playoff week (1-4)
 * NFL weeks 19, 20, 21, 22 -> Playoff weeks 1, 2, 3, 4
 */
function mapNFLWeekToPlayoffWeek(nflWeek: number): number | null {
  const mapping: Record<number, number> = {
    19: 1,
    20: 2,
    21: 3,
    22: 4,
  };
  return mapping[nflWeek] || null;
}

/**
 * Calculate and store weekly scores for all roster entries for a specific week
 * This takes the player stats from weeklyActuals and associates them with roster entries
 * @param season - The NFL season year
 * @param nflWeek - The NFL week number (e.g., 18 for wild card)
 */
export async function calculateRosterScores(
  season: number,
  nflWeek: number
): Promise<RosterScoringResult> {
  try {
    // Map NFL week to playoff week
    const playoffWeek = mapNFLWeekToPlayoffWeek(nflWeek);
    
    if (!playoffWeek) {
      return {
        success: false,
        updated: 0,
        skipped: 0,
        error: `NFL week ${nflWeek} is not a playoff week. Valid weeks: 19, 20, 21, 22`,
      };
    }
    
    console.log(`[Roster Scoring] Starting calculation for ${season} NFL week ${nflWeek} (playoff week ${playoffWeek})`);
    
    // Get all active roster entries for this season
    const rosters = await db
      .select({
        rosterEntryId: rosterEntries.id,
        playerId: rosterEntries.playerId,
        playerName: rosterEntries.playerName,
        seasonId: rosterEntries.seasonId,
      })
      .from(rosterEntries)
      .innerJoin(seasons, eq(rosterEntries.seasonId, seasons.id))
      .where(and(
        eq(seasons.year, season),
        eq(seasons.isActive, true)
      ));

    console.log(`[Roster Scoring] Found ${rosters.length} roster entries for season ${season}`);

    let updated = 0;
    let skipped = 0;

    // Process each roster entry
    for (const roster of rosters) {
      // Get the player's actual stats for this NFL week
      const actuals = await db
        .select({
          fantasyPoints: weeklyActuals.fantasyPoints,
        })
        .from(weeklyActuals)
        .where(
          and(
            eq(weeklyActuals.playerId, roster.playerId),
            eq(weeklyActuals.season, season),
            eq(weeklyActuals.week, nflWeek)
          )
        );

      if (actuals.length === 0) {
        // No stats for this player this week - store 0 points
        skipped++;
        continue;
      }

      const points = Number(actuals[0].fantasyPoints);

      // Check if weekly score already exists (store as playoff week 1-4)
      const existing = await db
        .select()
        .from(weeklyScores)
        .where(
          and(
            eq(weeklyScores.rosterEntryId, roster.rosterEntryId),
            eq(weeklyScores.week, playoffWeek)
          )
        );

      if (existing.length > 0) {
        // Update existing record
        await db
          .update(weeklyScores)
          .set({
            points,
            updatedAt: new Date(),
          })
          .where(eq(weeklyScores.id, existing[0].id));
      } else {
        // Insert new record (store as playoff week 1-4)
        await db.insert(weeklyScores).values({
          rosterEntryId: roster.rosterEntryId,
          week: playoffWeek,
          points,
        });
      }

      updated++;
      console.log(`[Roster Scoring] Updated ${roster.playerName}: ${points} points (playoff week ${playoffWeek})`);
      
      if (updated % 10 === 0) {
        console.log(`[Roster Scoring] Progress: ${updated} roster entries processed`);
      }
    }

    console.log(`[Roster Scoring] Complete: ${updated} updated, ${skipped} skipped (no stats)`);

    return {
      success: true,
      updated,
      skipped,
    };
  } catch (error) {
    console.error('[Roster Scoring] Error:', error);
    return {
      success: false,
      updated: 0,
      skipped: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculate roster scores for multiple weeks at once
 */
export async function calculateRosterScoresMultiWeek(
  season: number,
  startWeek: number,
  endWeek: number
): Promise<{ success: boolean; summary: string; totalUpdated: number }> {
  const results = [];
  let totalUpdated = 0;

  for (let week = startWeek; week <= endWeek; week++) {
    console.log(`\n[Roster Scoring] ===== Starting week ${week} =====`);
    const result = await calculateRosterScores(season, week);
    
    results.push(`Week ${week}: ${result.updated} updated, ${result.skipped} skipped${result.error ? ` (Error: ${result.error})` : ''}`);
    totalUpdated += result.updated;
  }

  const summary = results.join('\n');
  console.log(`\n[Roster Scoring] ===== Multi-week calculation complete! =====`);
  console.log(summary);

  return {
    success: true,
    summary,
    totalUpdated,
  };
}
