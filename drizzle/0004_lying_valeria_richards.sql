ALTER TABLE "cron_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "metrics_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "platform_historical_metrics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "scraper_keys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subreddit_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subreddits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tracking_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "metrics_history" ADD COLUMN "used_premium" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "subreddits" ADD COLUMN "consecutive_failures" integer DEFAULT 0 NOT NULL;