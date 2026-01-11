'use server';

import { db } from './db';
import { participants, rosterEntries, weeklyScores } from './db/schema';
import { eq, sql } from 'drizzle-orm';

// Participant actions
export async function getParticipants() {
  try {
    return await db.select().from(participants).orderBy(participants.name);
  } catch (error) {
    console.error('Failed to fetch participants:', error);
    throw new Error('Failed to fetch participants');
  }
}

export async function getParticipantById(id: number) {
  try {
    const result = await db.select().from(participants).where(eq(participants.id, id));
    return result[0];
  } catch (error) {
    console.error('Failed to fetch participant:', error);
    throw new Error('Failed to fetch participant');
  }
}

// Roster actions
export async function getRosterByParticipantId(participantId: number) {
  try {
    return await db
      .select()
      .from(rosterEntries)
      .where(eq(rosterEntries.participantId, participantId));
  } catch (error) {
    console.error('Failed to fetch roster:', error);
    throw new Error('Failed to fetch roster');
  }
}

// Scoring actions
export async function getWeeklyScoresForRosterEntry(rosterEntryId: number) {
  try {
    return await db
      .select()
      .from(weeklyScores)
      .where(eq(weeklyScores.rosterEntryId, rosterEntryId))
      .orderBy(weeklyScores.week);
  } catch (error) {
    console.error('Failed to fetch weekly scores:', error);
    throw new Error('Failed to fetch weekly scores');
  }
}

// Map NFL week to playoff week (19->1, 20->2, 21->3, 22->4)
function mapNFLWeekToPlayoffWeek(nflWeek: number): number | null {
  if (nflWeek >= 19 && nflWeek <= 22) {
    return nflWeek - 18;
  }
  return null;
}

// Get complete roster with scores for a participant
export async function getRosterWithScores(participantId: number) {
  try {
    const roster = await db
      .select({
        id: rosterEntries.id,
        playerName: rosterEntries.playerName,
        position: rosterEntries.position,
        team: rosterEntries.team,
        week: weeklyScores.week,
        points: weeklyScores.points,
      })
      .from(rosterEntries)
      .leftJoin(weeklyScores, eq(rosterEntries.id, weeklyScores.rosterEntryId))
      .where(eq(rosterEntries.participantId, participantId));

    // Organize data by roster entry with weekly scores
    const rosterMap = new Map();
    
    roster.forEach((row) => {
      if (!rosterMap.has(row.id)) {
        rosterMap.set(row.id, {
          id: row.id,
          playerName: row.playerName,
          position: row.position,
          team: row.team,
          weeklyScores: {},
          totalPoints: 0,
        });
      }
      
      if (row.week !== null) {
        const entry = rosterMap.get(row.id);
        // Map NFL playoff weeks (19-22) to playoff weeks (1-4) for display
        const playoffWeek = mapNFLWeekToPlayoffWeek(row.week);
        if (playoffWeek) {
          entry.weeklyScores[playoffWeek] = row.points || 0;
          entry.totalPoints += row.points || 0;
        }
        // Note: Regular season weeks are ignored for playoff fantasy league
      }
    });

    return Array.from(rosterMap.values());
  } catch (error) {
    console.error('Failed to fetch roster with scores:', error);
    throw new Error('Failed to fetch roster with scores');
  }
}

// Get participant standings
export async function getStandings() {
  try {
    console.log('[getStandings] Starting query...');
    const result = await db
      .select({
        participantId: participants.id,
        participantName: participants.name,
        auth0Id: participants.auth0Id,
        // Only sum playoff weeks (NFL weeks 19-22)
        totalPoints: sql<number>`COALESCE(SUM(CASE WHEN ${weeklyScores.week} >= 19 AND ${weeklyScores.week} <= 22 THEN ${weeklyScores.points} ELSE 0 END), 0)`,
      })
      .from(participants)
      .leftJoin(rosterEntries, eq(participants.id, rosterEntries.participantId))
      .leftJoin(weeklyScores, eq(rosterEntries.id, weeklyScores.rosterEntryId))
      .groupBy(participants.id, participants.name, participants.auth0Id)
      .orderBy(sql`COALESCE(SUM(${weeklyScores.points}), 0) DESC`);

    console.log('[getStandings] Found', result.length, 'participants');
    console.log('[getStandings] Sample:', result.slice(0, 2));

    // Convert totalPoints to number (it comes as string from SQL aggregate)
    return result.map(row => ({
      ...row,
      totalPoints: Number(row.totalPoints) || 0,
    }));
  } catch (error) {
    console.error('Failed to fetch standings:', error);
    throw new Error('Failed to fetch standings');
  }
}

export async function claimParticipantAccount(participantId: number, auth0Id: string) {
  try {
    // Check if this auth0Id is already claimed
    const existing = await db
      .select()
      .from(participants)
      .where(eq(participants.auth0Id, auth0Id))
      .limit(1);
    
    if (existing.length > 0) {
      return { error: 'You have already claimed an account' };
    }
    
    // Check if the participant exists and is unclaimed
    const participant = await db
      .select()
      .from(participants)
      .where(eq(participants.id, participantId))
      .limit(1);
    
    if (participant.length === 0) {
      return { error: 'Participant not found' };
    }
    
    if (participant[0].auth0Id) {
      return { error: 'This participant has already been claimed' };
    }
    
    // Claim the account
    await db
      .update(participants)
      .set({ auth0Id })
      .where(eq(participants.id, participantId));
    
    return { success: true };
  } catch (error) {
    console.error('Failed to claim participant account:', error);
    return { error: 'Failed to claim account' };
  }
}

export async function getParticipantsByAuth0Id(auth0Id: string) {
  try {
    const userParticipants = await db
      .select({
        id: participants.id,
        name: participants.name,
      })
      .from(participants)
      .where(eq(participants.auth0Id, auth0Id));
    
    return userParticipants;
  } catch (error) {
    console.error('Failed to get participants by auth0Id:', error);
    return [];
  }
}
