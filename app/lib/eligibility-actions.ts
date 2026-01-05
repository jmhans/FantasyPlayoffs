'use server';

import { db } from '@/app/lib/db';
import { players } from '@/app/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Set eligibility for all players from specific NFL teams
 */
export async function setTeamEligibility(teams: string[], isEligible: boolean) {
  try {
    await db
      .update(players)
      .set({ 
        isDraftEligible: isEligible,
        updatedAt: new Date(),
      })
      .where(inArray(players.team, teams));

    revalidatePath('/admin/eligibility');
    revalidatePath('/draft');
    
    return { 
      success: true, 
      message: `Set ${teams.length} team(s) to ${isEligible ? 'eligible' : 'ineligible'}` 
    };
  } catch (error) {
    console.error('Error setting team eligibility:', error);
    return { error: 'Failed to update team eligibility' };
  }
}

/**
 * Set all players to eligible or ineligible
 */
export async function setAllPlayersEligibility(isEligible: boolean) {
  try {
    await db
      .update(players)
      .set({ 
        isDraftEligible: isEligible,
        updatedAt: new Date(),
      });

    revalidatePath('/admin/eligibility');
    revalidatePath('/draft');
    
    return { 
      success: true, 
      message: `Set all players to ${isEligible ? 'eligible' : 'ineligible'}` 
    };
  } catch (error) {
    console.error('Error setting all players eligibility:', error);
    return { error: 'Failed to update all players eligibility' };
  }
}

/**
 * Toggle individual player eligibility
 */
export async function togglePlayerEligibility(playerId: number) {
  try {
    const [player] = await db
      .select({ isDraftEligible: players.isDraftEligible })
      .from(players)
      .where(eq(players.id, playerId))
      .limit(1);

    if (!player) {
      return { error: 'Player not found' };
    }

    await db
      .update(players)
      .set({ 
        isDraftEligible: !player.isDraftEligible,
        updatedAt: new Date(),
      })
      .where(eq(players.id, playerId));

    revalidatePath('/admin/eligibility');
    revalidatePath('/draft');
    
    return { success: true };
  } catch (error) {
    console.error('Error toggling player eligibility:', error);
    return { error: 'Failed to toggle player eligibility' };
  }
}

/**
 * Get eligibility statistics
 */
export async function getEligibilityStats() {
  try {
    const allPlayers = await db.select().from(players);
    
    const eligible = allPlayers.filter(p => p.isDraftEligible).length;
    const ineligible = allPlayers.length - eligible;
    
    // Group by team
    const teamStats = allPlayers.reduce((acc, player) => {
      if (!acc[player.team]) {
        acc[player.team] = { eligible: 0, ineligible: 0, total: 0 };
      }
      acc[player.team].total++;
      if (player.isDraftEligible) {
        acc[player.team].eligible++;
      } else {
        acc[player.team].ineligible++;
      }
      return acc;
    }, {} as Record<string, { eligible: number; ineligible: number; total: number }>);

    return {
      total: allPlayers.length,
      eligible,
      ineligible,
      teamStats,
    };
  } catch (error) {
    console.error('Error getting eligibility stats:', error);
    return null;
  }
}
