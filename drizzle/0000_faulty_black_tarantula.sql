CREATE TABLE "cron_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" varchar(50) NOT NULL,
	"error_message" varchar(1000),
	"duration_ms" integer,
	"ran_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metrics_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"subreddit_id" integer NOT NULL,
	"weekly_visitors" integer NOT NULL,
	"weekly_contributions" integer NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subreddit_groups" (
	"subreddit_id" integer NOT NULL,
	"group_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subreddits" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subreddits_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tracking_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(50) NOT NULL,
	"sub_category" varchar(100) NOT NULL,
	"monetization_weight" real NOT NULL,
	"arpu_expectation" varchar(50),
	"population" integer,
	CONSTRAINT "tracking_groups_sub_category_unique" UNIQUE("sub_category")
);
--> statement-breakpoint
ALTER TABLE "metrics_history" ADD CONSTRAINT "metrics_history_subreddit_id_subreddits_id_fk" FOREIGN KEY ("subreddit_id") REFERENCES "public"."subreddits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subreddit_groups" ADD CONSTRAINT "subreddit_groups_subreddit_id_subreddits_id_fk" FOREIGN KEY ("subreddit_id") REFERENCES "public"."subreddits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subreddit_groups" ADD CONSTRAINT "subreddit_groups_group_id_tracking_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."tracking_groups"("id") ON DELETE cascade ON UPDATE no action;