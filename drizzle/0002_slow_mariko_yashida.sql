CREATE TABLE "fantasy_playoffs"."players" (
	"id" serial PRIMARY KEY NOT NULL,
	"espn_id" text,
	"name" text NOT NULL,
	"position" text NOT NULL,
	"team" text NOT NULL,
	"jersey_number" text,
	"status" text,
	"image_url" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "players_espn_id_unique" UNIQUE("espn_id")
);
--> statement-breakpoint
ALTER TABLE "fantasy_playoffs"."roster_entries" ADD COLUMN "player_id" integer;--> statement-breakpoint
ALTER TABLE "fantasy_playoffs"."roster_entries" ADD CONSTRAINT "roster_entries_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "fantasy_playoffs"."players"("id") ON DELETE set null ON UPDATE no action;