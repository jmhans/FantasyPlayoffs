CREATE TABLE "fantasy_playoffs"."seasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant_id" integer NOT NULL,
	"year" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Create seasons for all existing participants for current year
INSERT INTO "fantasy_playoffs"."seasons" ("participant_id", "year", "is_active")
SELECT DISTINCT "participant_id", 2025, true
FROM "fantasy_playoffs"."roster_entries";
--> statement-breakpoint
-- Add season_id column as nullable first
ALTER TABLE "fantasy_playoffs"."roster_entries" ADD COLUMN "season_id" integer;
--> statement-breakpoint
-- Update existing roster_entries to link to their participant's season
UPDATE "fantasy_playoffs"."roster_entries" re
SET "season_id" = s.id
FROM "fantasy_playoffs"."seasons" s
WHERE re."participant_id" = s."participant_id" AND s."year" = 2025;
--> statement-breakpoint
-- Now make season_id NOT NULL
ALTER TABLE "fantasy_playoffs"."roster_entries" ALTER COLUMN "season_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "fantasy_playoffs"."seasons" ADD CONSTRAINT "seasons_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "fantasy_playoffs"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_playoffs"."roster_entries" ADD CONSTRAINT "roster_entries_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "fantasy_playoffs"."seasons"("id") ON DELETE cascade ON UPDATE no action;