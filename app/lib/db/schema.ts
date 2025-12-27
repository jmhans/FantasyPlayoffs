import { pgTable, text, serial, integer, timestamp, boolean, pgSchema, json } from 'drizzle-orm/pg-core';

// Create a dedicated schema for FantasyPlayoffs
export const fantasyPlayoffsSchema = pgSchema('fantasy_playoffs');

// NFL Players table
export const players = fantasyPlayoffsSchema.table('players', {
  id: serial('id').primaryKey(),
  espnId: text('espn_id').unique(),
  name: text('name').notNull(),
  position: text('position').notNull(), // QB, RB, WR, TE, K, DEF
  team: text('team').notNull(), // Team abbreviation
  jerseyNumber: text('jersey_number'),
  status: text('status'), // ACTIVE, INJURED, etc.
  imageUrl: text('image_url'),
  metadata: json('metadata'), // Store additional ESPN data
  projectedPoints: integer('projected_points'), // Projected fantasy points from Sleeper
  projectionsUpdatedAt: timestamp('projections_updated_at'), // When projections were last synced
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Participants/Users table
export const participants = fantasyPlayoffsSchema.table('participants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  auth0Id: text('auth0_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Seasons table - tracks which participants are active in which season
export const seasons = fantasyPlayoffsSchema.table('seasons', {
  id: serial('id').primaryKey(),
  participantId: integer('participant_id')
    .notNull()
    .references(() => participants.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Roster entries table
export const rosterEntries = fantasyPlayoffsSchema.table('roster_entries', {
  id: serial('id').primaryKey(),
  participantId: integer('participant_id')
    .notNull()
    .references(() => participants.id, { onDelete: 'cascade' }),
  seasonId: integer('season_id')
    .notNull()
    .references(() => seasons.id, { onDelete: 'cascade' }),
  playerId: integer('player_id')
    .references(() => players.id, { onDelete: 'set null' }),
  playerName: text('player_name').notNull(), // Denormalized for display
  position: text('position'),
  team: text('team'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Weekly scores table (4 weeks of playoffs)
export const weeklyScores = fantasyPlayoffsSchema.table('weekly_scores', {
  id: serial('id').primaryKey(),
  rosterEntryId: integer('roster_entry_id')
    .notNull()
    .references(() => rosterEntries.id, { onDelete: 'cascade' }),
  week: integer('week').notNull(), // 1-4 for playoff weeks
  points: integer('points').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Season/playoff configuration
export const seasonConfig = fantasyPlayoffsSchema.table('season_config', {
  id: serial('id').primaryKey(),
  currentWeek: integer('current_week').notNull().default(1),
  seasonYear: integer('season_year').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
});

// Draft configuration and state
export const drafts = fantasyPlayoffsSchema.table('drafts', {
  id: serial('id').primaryKey(),
  seasonYear: integer('season_year').notNull(),
  totalRounds: integer('total_rounds').notNull(),
  currentRound: integer('current_round').notNull().default(1),
  currentPick: integer('current_pick').notNull().default(1),
  isComplete: boolean('is_complete').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Draft order - one entry per participant with their draft position
export const draftOrder = fantasyPlayoffsSchema.table('draft_order', {
  id: serial('id').primaryKey(),
  draftId: integer('draft_id')
    .notNull()
    .references(() => drafts.id, { onDelete: 'cascade' }),
  participantId: integer('participant_id')
    .notNull()
    .references(() => participants.id, { onDelete: 'cascade' }),
  pickOrder: integer('pick_order').notNull(), // 1-based position in draft order
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Draft picks - record of each pick made
export const draftPicks = fantasyPlayoffsSchema.table('draft_picks', {
  id: serial('id').primaryKey(),
  draftId: integer('draft_id')
    .notNull()
    .references(() => drafts.id, { onDelete: 'cascade' }),
  participantId: integer('participant_id')
    .notNull()
    .references(() => participants.id, { onDelete: 'cascade' }),
  playerId: integer('player_id')
    .notNull()
    .references(() => players.id, { onDelete: 'cascade' }),
  round: integer('round').notNull(),
  pickNumber: integer('pick_number').notNull(), // Overall pick number
  pickedAt: timestamp('picked_at').defaultNow().notNull(),
});

export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;

export type Season = typeof seasons.$inferSelect;
export type NewSeason = typeof seasons.$inferInsert;

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;

export type RosterEntry = typeof rosterEntries.$inferSelect;
export type NewRosterEntry = typeof rosterEntries.$inferInsert;

export type WeeklyScore = typeof weeklyScores.$inferSelect;
export type NewWeeklyScore = typeof weeklyScores.$inferInsert;

export type SeasonConfig = typeof seasonConfig.$inferSelect;
export type NewSeasonConfig = typeof seasonConfig.$inferInsert;

export type Draft = typeof drafts.$inferSelect;
export type NewDraft = typeof drafts.$inferInsert;

export type DraftOrder = typeof draftOrder.$inferSelect;
export type NewDraftOrder = typeof draftOrder.$inferInsert;

export type DraftPick = typeof draftPicks.$inferSelect;
export type NewDraftPick = typeof draftPicks.$inferInsert;
