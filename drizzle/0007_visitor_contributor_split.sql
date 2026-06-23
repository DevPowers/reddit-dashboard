ALTER TABLE "platform_historical_metrics" RENAME COLUMN "overall_dau_estimate" TO "total_weekly_visitors";--> statement-breakpoint
ALTER TABLE "platform_historical_metrics" RENAME COLUMN "overall_dau_growth_percent" TO "visitor_growth_percent";--> statement-breakpoint
ALTER TABLE "platform_historical_metrics" RENAME COLUMN "overall_net_new_dau" TO "net_new_weekly_visitors";--> statement-breakpoint
ALTER TABLE "platform_historical_metrics" ADD COLUMN "total_weekly_contributions" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_historical_metrics" ADD COLUMN "contribution_growth_percent" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_historical_metrics" ADD COLUMN "net_new_weekly_contributions" integer DEFAULT 0 NOT NULL;
