CREATE TABLE "platform_historical_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"overall_dau_estimate" integer NOT NULL,
	"overall_dau_growth_percent" real DEFAULT 0 NOT NULL,
	"overall_net_new_dau" integer DEFAULT 0 NOT NULL,
	"velocity_index_score" real NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tracking_groups" ADD COLUMN "arpu_multiplier" real DEFAULT 1 NOT NULL;