'use server';

import { db } from '@/app/lib/db';
import { rosterEntries, players } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function addPlayerToRoster(participantId: number, playerId: number) {
  try {
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
