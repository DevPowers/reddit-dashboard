CREATE TABLE "cron_subreddit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"cron_log_id" integer NOT NULL,
	"subreddit_id" integer NOT NULL,
	"status" varchar(50) NOT NULL,
	"error_message" varchar(1000),
	"http_code" integer,
	"used_premium" boolean DEFAULT false NOT NULL,
	"duration_ms" integer NOT NULL,
	"ran_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cron_subreddit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cron_subreddit_logs" ADD CONSTRAINT "cron_subreddit_logs_cron_log_id_cron_logs_id_fk" FOREIGN KEY ("cron_log_id") REFERENCES "public"."cron_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cron_subreddit_logs" ADD CONSTRAINT "cron_subreddit_logs_subreddit_id_subreddits_id_fk" FOREIGN KEY ("subreddit_id") REFERENCES "public"."subreddits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cron_log_id_idx" ON "cron_subreddit_logs" USING btree ("cron_log_id");--> statement-breakpoint
CREATE INDEX "csl_subreddit_id_idx" ON "cron_subreddit_logs" USING btree ("subreddit_id");--> statement-breakpoint
ALTER TABLE "metrics_history" DROP COLUMN "used_premium";