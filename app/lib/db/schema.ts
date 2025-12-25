import { pgTable, text, serial, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

// Participants/Users table
export const participants = pgTable('participants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  auth0Id: text('auth0_id').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Roster entries table
export const rosterEntries = pgTable('roster_entries', {
  id: serial('id').primaryKey(),
  participantId: integer('participant_id')
    .notNull()
    .references(() => participants.id, { onDelete: 'cascade' }),
  playerName: text('player_name').notNull(),
  position: text('position'),
  team: text('team'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Weekly scores table (4 weeks of playoffs)
export const weeklyScores = pgTable('weekly_scores', {
  id: serial('id').primaryKey(),
  rosterEntryId: integer('roster_entry_id')
    .notNull()
    .references(() => rosterEntries.id, { onDelete: 'cascade' }),
  week: integer('week').notNull(), // 1-4 for playoff weeks
  points: integer('points').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Season/playoff configuration
export const seasonConfig = pgTable('season_config', {
  id: serial('id').primaryKey(),
  currentWeek: integer('current_week').notNull().default(1),
  seasonYear: integer('season_year').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
});

export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;

export type RosterEntry = typeof rosterEntries.$inferSelect;
export type NewRosterEntry = typeof rosterEntries.$inferInsert;

export type WeeklyScore = typeof weeklyScores.$inferSelect;
export type NewWeeklyScore = typeof weeklyScores.$inferInsert;

export type SeasonConfig = typeof seasonConfig.$inferSelect;
export type NewSeasonConfig = typeof seasonConfig.$inferInsert;
