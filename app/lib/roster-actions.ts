'use server';

import { db } from '@/app/lib/db';
import { rosterEntries, players, seasons } from '@/app/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Get or create a season for a participant
 */
async function getOrCreateSeason(participantId: number, year: number) {
  // Check if season exists
  const existingSeason = await db
    .select()
    .from(seasons)
    .where(and(
      eq(seasons.participantId, participantId),
      eq(seasons.year, year)
    ))
    .limit(1);
  
  if (existingSeason.length > 0) {
    return existingSeason[0].id;
  }
  
  // Create new season
  const newSeason = await db
    .insert(seasons)
    .values({
      participantId,
      year,
      isActive: true,
    })
    .returning();
  
  return newSeason[0].id;
}

export async function addPlayerToRoster(participantId: number, playerId: number) {
  try {
    const currentYear = new Date().getFullYear();
    
    // Get or create season
    const seasonId = await getOrCreateSeason(participantId, currentYear);
    
    // Get player details
    const player = await db
      .select()
      .from(players)
      .where(eq(players.id, playerId))
      .limit(1);
    
    if (player.length === 0) {
      return { error: 'Player not found' };
    }
    
    const playerData = player[0];
    
    // Add to roster
    await db.insert(rosterEntries).values({
      participantId,
      seasonId,
      playerId,
      playerName: playerData.name,
      position: playerData.position,
      team: playerData.team,
    });
    
    revalidatePath(`/roster/${participantId}`);
    return { success: true };
  } catch (error) {
    console.error('Error adding player to roster:', error);
    return { error: 'Failed to add player to roster' };
  }
}

export async function removePlayerFromRoster(rosterEntryId: number, participantId: number) {
  try {
    await db.delete(rosterEntries).where(eq(rosterEntries.id, rosterEntryId));
    
    revalidatePath(`/roster/${participantId}`);
    return { success: true };
  } catch (error) {
    console.error('Error removing player from roster:', error);
    return { error: 'Failed to remove player from roster' };
  }
}
