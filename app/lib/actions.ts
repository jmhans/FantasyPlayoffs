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
        entry.weeklyScores[row.week] = row.points || 0;
        entry.totalPoints += row.points || 0;
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
    const result = await db
      .select({
        participantId: participants.id,
        participantName: participants.name,
        totalPoints: sql<number>`COALESCE(SUM(${weeklyScores.points}), 0)`,
      })
      .from(participants)
      .leftJoin(rosterEntries, eq(participants.id, rosterEntries.participantId))
      .leftJoin(weeklyScores, eq(rosterEntries.id, weeklyScores.rosterEntryId))
      .groupBy(participants.id, participants.name)
      .orderBy(sql`COALESCE(SUM(${weeklyScores.points}), 0) DESC`);

    return result;
  } catch (error) {
    console.error('Failed to fetch standings:', error);
    throw new Error('Failed to fetch standings');
  }
}
