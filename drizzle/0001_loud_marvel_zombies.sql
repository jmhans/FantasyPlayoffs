ALTER TABLE "fantasy_playoffs"."participants" DROP CONSTRAINT "participants_email_unique";--> statement-breakpoint
ALTER TABLE "fantasy_playoffs"."participants" DROP CONSTRAINT "participants_auth0_id_unique";--> statement-breakpoint
ALTER TABLE "fantasy_playoffs"."participants" ALTER COLUMN "email" DROP NOT NULL;