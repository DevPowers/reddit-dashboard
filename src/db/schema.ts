import { relations } from "drizzle-orm";
import {
	integer,
	pgTable,
	real,
	serial,
	timestamp,
	varchar,
	boolean,
	index,
	text,
} from "drizzle-orm/pg-core";

export const subreddits = pgTable("subreddits", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull().unique(),
	isActive: boolean("is_active").default(true).notNull(),
	consecutiveFailures: integer("consecutive_failures").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
}).enableRLS();

export const subredditsRelations = relations(subreddits, ({ many }) => ({
	metrics: many(metricsHistory),
}));

export const metricsHistory = pgTable(
	"metrics_history",
	{
		id: serial("id").primaryKey(),
		subredditId: integer("subreddit_id")
			.references(() => subreddits.id, { onDelete: "cascade" })
			.notNull(),
		weeklyVisitors: integer("weekly_visitors").notNull(),
		recordedAt: timestamp("recorded_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		index("recorded_at_idx").on(t.recordedAt),
		index("subreddit_id_idx").on(t.subredditId),
	],
).enableRLS();

export const metricsHistoryRelations = relations(metricsHistory, ({ one }) => ({
	subreddit: one(subreddits, {
		fields: [metricsHistory.subredditId],
		references: [subreddits.id],
	}),
}));

export const cronLogs = pgTable("cron_logs", {
	id: serial("id").primaryKey(),
	status: varchar("status", { length: 50 }).notNull(),
	errorMessage: varchar("error_message", { length: 1000 }),
	durationMs: integer("duration_ms"),
	ranAt: timestamp("ran_at", { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const scraperKeys = pgTable("scraper_keys", {
	id: serial("id").primaryKey(),
	keyIndex: integer("key_index").notNull().unique(), // e.g. 1, 2, 3
	isActive: boolean("is_active").default(false).notNull(),
	lastStatus: varchar("last_status", { length: 50 }), // 'success' or 'failed'
	lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
	lastErrorAt: timestamp("last_error_at", { withTimezone: true }),
}).enableRLS();

export const platformHistoricalMetrics = pgTable("platform_historical_metrics", {
	id: serial("id").primaryKey(),
	recordedAt: timestamp("recorded_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	// Visitor metrics
	totalWeeklyVisitors: integer("total_weekly_visitors").notNull(),
	visitorGrowthPercent: real("visitor_growth_percent").notNull().default(0),
	netNewWeeklyVisitors: integer("net_new_weekly_visitors").notNull().default(0),
	
	// Statistical metrics
	medianVisitors: integer("median_visitors").notNull().default(0),
	minVisitors: integer("min_visitors").notNull().default(0),
	maxVisitors: integer("max_visitors").notNull().default(0),
	averageVisitors: integer("average_visitors").notNull().default(0),
	top10Concentration: real("top_10_concentration").notNull().default(0),
}).enableRLS();

export const rawScraperResponses = pgTable("raw_scraper_responses", {
	id: serial("id").primaryKey(),
	htmlContent: text("html_content").notNull(),
	urlScraped: varchar("url_scraped", { length: 500 }).notNull(),
	scrapedAt: timestamp("scraped_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
}).enableRLS();

