CREATE TABLE "fantasy_playoffs"."draft_order" (
	"id" serial PRIMARY KEY NOT NULL,
	"draft_id" integer NOT NULL,
	"participant_id" integer NOT NULL,
	"pick_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fantasy_playoffs"."draft_picks" (
	"id" serial PRIMARY KEY NOT NULL,
	"draft_id" integer NOT NULL,
	"participant_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"round" integer NOT NULL,
	"pick_number" integer NOT NULL,
	"picked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fantasy_playoffs"."drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_year" integer NOT NULL,
	"total_rounds" integer NOT NULL,
	"current_round" integer DEFAULT 1 NOT NULL,
	"current_pick" integer DEFAULT 1 NOT NULL,
	"is_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fantasy_playoffs"."draft_order" ADD CONSTRAINT "draft_order_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "fantasy_playoffs"."drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_playoffs"."draft_order" ADD CONSTRAINT "draft_order_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "fantasy_playoffs"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_playoffs"."draft_picks" ADD CONSTRAINT "draft_picks_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "fantasy_playoffs"."drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_playoffs"."draft_picks" ADD CONSTRAINT "draft_picks_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "fantasy_playoffs"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_playoffs"."draft_picks" ADD CONSTRAINT "draft_picks_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "fantasy_playoffs"."players"("id") ON DELETE cascade ON UPDATE no action;