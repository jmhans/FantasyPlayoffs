CREATE SCHEMA "fantasy_playoffs";
--> statement-breakpoint
CREATE TABLE "fantasy_playoffs"."participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"auth0_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "participants_email_unique" UNIQUE("email"),
	CONSTRAINT "participants_auth0_id_unique" UNIQUE("auth0_id")
);
--> statement-breakpoint
CREATE TABLE "fantasy_playoffs"."roster_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant_id" integer NOT NULL,
	"player_name" text NOT NULL,
	"position" text,
	"team" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fantasy_playoffs"."season_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"current_week" integer DEFAULT 1 NOT NULL,
	"season_year" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fantasy_playoffs"."weekly_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"roster_entry_id" integer NOT NULL,
	"week" integer NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fantasy_playoffs"."roster_entries" ADD CONSTRAINT "roster_entries_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "fantasy_playoffs"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_playoffs"."weekly_scores" ADD CONSTRAINT "weekly_scores_roster_entry_id_roster_entries_id_fk" FOREIGN KEY ("roster_entry_id") REFERENCES "fantasy_playoffs"."roster_entries"("id") ON DELETE cascade ON UPDATE no action;