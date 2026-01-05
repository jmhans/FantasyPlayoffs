'use server';

import { db } from '@/app/lib/db';
import { drafts, draftOrder, draftPicks, rosterEntries, participants, players, seasons } from '@/app/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Get or create a season for a participant
 */
async function getOrCreateSeason(participantId: number, year: number) {
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

export async function createNewDraft(seasonYear: number, totalRounds: number) {
  try {
    // Get all participants
    const allParticipants = await db.select().from(participants);
    
    if (allParticipants.length === 0) {
      return { error: 'No participants found. Add participants first.' };
    }

    // Clear all existing rosters for this season
    const seasonIds = await db
      .select({ id: seasons.id })
      .from(seasons)
      .where(eq(seasons.year, seasonYear));
    
    if (seasonIds.length > 0) {
      // Delete roster entries for ALL seasons for this year
      for (const season of seasonIds) {
        await db.delete(rosterEntries).where(
          eq(rosterEntries.seasonId, season.id)
        );
      }
    }

    // Delete any existing draft for this season
    const existingDrafts = await db
      .select()
      .from(drafts)
      .where(eq(drafts.seasonYear, seasonYear));
    
    if (existingDrafts.length > 0) {
      for (const draft of existingDrafts) {
        await db.delete(draftPicks).where(eq(draftPicks.draftId, draft.id));
        await db.delete(draftOrder).where(eq(draftOrder.draftId, draft.id));
        await db.delete(drafts).where(eq(drafts.id, draft.id));
      }
    }

    // Create new draft
    const [newDraft] = await db
      .insert(drafts)
      .values({
        seasonYear,
        totalRounds,
        currentRound: 1,
        currentPick: 1,
        isComplete: false,
      })
      .returning();

    // Randomize participant order
    const shuffledParticipants = [...allParticipants].sort(() => Math.random() - 0.5);

    // Create draft order
    for (let i = 0; i < shuffledParticipants.length; i++) {
      await db.insert(draftOrder).values({
        draftId: newDraft.id,
        participantId: shuffledParticipants[i].id,
        pickOrder: i + 1,
      });
    }

    revalidatePath('/admin/draft');
    return { success: true, draftId: newDraft.id };
  } catch (error) {
    console.error('Error creating draft:', error);
    return { error: 'Failed to create draft' };
  }
}

export async function deleteDraft(seasonYear: number) {
  try {
    // Get the draft for this season
    const existingDrafts = await db
      .select()
      .from(drafts)
      .where(eq(drafts.seasonYear, seasonYear));
    
    if (existingDrafts.length === 0) {
      return { error: 'No draft found for this season' };
    }

    // Delete all related data
    for (const draft of existingDrafts) {
      await db.delete(draftPicks).where(eq(draftPicks.draftId, draft.id));
      await db.delete(draftOrder).where(eq(draftOrder.draftId, draft.id));
      await db.delete(drafts).where(eq(drafts.id, draft.id));
    }

    // Clear all existing rosters for this season
    const seasonIds = await db
      .select({ id: seasons.id })
      .from(seasons)
      .where(eq(seasons.year, seasonYear));
    
    if (seasonIds.length > 0) {
      // Delete roster entries for ALL seasons for this year
      for (const season of seasonIds) {
        await db.delete(rosterEntries).where(
          eq(rosterEntries.seasonId, season.id)
        );
      }
    }

    revalidatePath('/admin/draft');
    revalidatePath('/draft');
    return { success: true };
  } catch (error) {
    console.error('Error deleting draft:', error);
    return { error: 'Failed to delete draft' };
  }
}

export async function getCurrentDraft(seasonYear: number) {
  try {
    const [draft] = await db
      .select()
      .from(drafts)
      .where(eq(drafts.seasonYear, seasonYear))
      .orderBy(desc(drafts.createdAt))
      .limit(1);

    if (!draft) {
      return null;
    }

    // Get draft order with participant names
    const order = await db
      .select({
        id: draftOrder.id,
        pickOrder: draftOrder.pickOrder,
        participantId: participants.id,
        participantName: participants.name,
        auth0Id: participants.auth0Id,
      })
      .from(draftOrder)
      .innerJoin(participants, eq(draftOrder.participantId, participants.id))
      .where(eq(draftOrder.draftId, draft.id))
      .orderBy(draftOrder.pickOrder);

    return {
      ...draft,
      draftOrder: order,
    };
  } catch (error) {
    console.error('Error fetching draft:', error);
    return null;
  }
}

export async function getDraftPicks(draftId: number) {
  try {
    const picks = await db
      .select({
        id: draftPicks.id,
        round: draftPicks.round,
        pickNumber: draftPicks.pickNumber,
        playerId: draftPicks.playerId, // Add this!
        participantName: participants.name,
        playerName: players.name,
        playerPosition: players.position,
        playerTeam: players.team,
        pickedAt: draftPicks.pickedAt,
      })
      .from(draftPicks)
      .innerJoin(participants, eq(draftPicks.participantId, participants.id))
      .innerJoin(players, eq(draftPicks.playerId, players.id))
      .where(eq(draftPicks.draftId, draftId))
      .orderBy(draftPicks.pickNumber);

    return picks;
  } catch (error) {
    console.error('Error fetching draft picks:', error);
    return [];
  }
}

export async function makeDraftPick(draftId: number, participantId: number, playerId: number, isAdminOverride: boolean = false) {
  try {
    // Get current draft state
    const [draft] = await db
      .select()
      .from(drafts)
      .where(eq(drafts.id, draftId))
      .limit(1);

    if (!draft) {
      return { error: 'Draft not found' };
    }

    if (draft.isComplete) {
      return { error: 'Draft is already complete' };
    }

    // Get draft order
    const order = await db
      .select()
      .from(draftOrder)
      .where(eq(draftOrder.draftId, draftId))
      .orderBy(draftOrder.pickOrder);

    if (order.length === 0) {
      return { error: 'Draft order not found' };
    }

    // Validate turn (skip for admin override)
    if (!isAdminOverride) {
      // Calculate who should be picking (snake draft)
      const totalParticipants = order.length;
      const isOddRound = draft.currentRound % 2 === 1;
      
      let expectedPickerIndex: number;
      if (isOddRound) {
        // Odd rounds go 1, 2, 3, 4...
        expectedPickerIndex = draft.currentPick - 1;
      } else {
        // Even rounds go 4, 3, 2, 1...
        expectedPickerIndex = totalParticipants - draft.currentPick;
      }

      const expectedPicker = order[expectedPickerIndex];
      
      if (expectedPicker.participantId !== participantId) {
        return { error: 'It is not your turn to pick' };
      }
    }

    // Check if player already drafted
    const existingPick = await db
      .select()
      .from(draftPicks)
      .where(
        and(
          eq(draftPicks.draftId, draftId),
          eq(draftPicks.playerId, playerId)
        )
      )
      .limit(1);

    if (existingPick.length > 0) {
      return { error: 'Player already drafted' };
    }

    // Calculate overall pick number
    const totalParticipants = order.length;
    const overallPickNumber = (draft.currentRound - 1) * totalParticipants + draft.currentPick;

    // Make the pick
    await db.insert(draftPicks).values({
      draftId,
      participantId,
      playerId,
      round: draft.currentRound,
      pickNumber: overallPickNumber,
    });

    // Add to roster
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, playerId))
      .limit(1);

    if (player) {
      // Get or create season for participant
      const seasonId = await getOrCreateSeason(participantId, draft.seasonYear);
      
      await db.insert(rosterEntries).values({
        participantId,
        seasonId,
        playerId,
        playerName: player.name,
        position: player.position,
        team: player.team,
      });
    }

    // Update draft state
    let newPick = draft.currentPick + 1;
    let newRound = draft.currentRound;
    let isComplete = false;

    if (newPick > totalParticipants) {
      newPick = 1;
      newRound += 1;
      
      if (newRound > draft.totalRounds) {
        isComplete = true;
      }
    }

    await db
      .update(drafts)
      .set({
        currentPick: newPick,
        currentRound: newRound,
        isComplete,
        updatedAt: new Date(),
      })
      .where(eq(drafts.id, draftId));

    revalidatePath('/draft');
    return { success: true };
  } catch (error) {
    console.error('Error making draft pick:', error);
    return { error: 'Failed to make draft pick' };
  }
}

export async function getCurrentPicker(draftId: number) {
  try {
    const [draft] = await db
      .select()
      .from(drafts)
      .where(eq(drafts.id, draftId))
      .limit(1);

    if (!draft) {
      return null;
    }

    const order = await db
      .select({
        participantId: draftOrder.participantId,
        pickOrder: draftOrder.pickOrder,
        participantName: participants.name,
        auth0Id: participants.auth0Id,
      })
      .from(draftOrder)
      .innerJoin(participants, eq(draftOrder.participantId, participants.id))
      .where(eq(draftOrder.draftId, draftId))
      .orderBy(draftOrder.pickOrder);

    const totalParticipants = order.length;
    const isOddRound = draft.currentRound % 2 === 1;
    
    let pickerIndex: number;
    if (isOddRound) {
      pickerIndex = draft.currentPick - 1;
    } else {
      pickerIndex = totalParticipants - draft.currentPick;
    }

    return order[pickerIndex];
  } catch (error) {
    console.error('Error getting current picker:', error);
    return null;
  }
}
