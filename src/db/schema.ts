import { relations } from "drizzle-orm";
import {
	integer,
	pgTable,
	primaryKey,
	real,
	serial,
	timestamp,
	varchar,
	boolean,
	index,
} from "drizzle-orm/pg-core";

export const subreddits = pgTable("subreddits", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull().unique(),
	consecutiveFailures: integer("consecutive_failures").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
}).enableRLS();

export const subredditsRelations = relations(subreddits, ({ many }) => ({
	metrics: many(metricsHistory),
	groupMembers: many(subredditGroups),
}));

export const trackingGroups = pgTable("tracking_groups", {
	id: serial("id").primaryKey(),
	category: varchar("category", { length: 50 }).notNull(),
	subCategory: varchar("sub_category", { length: 100 }).notNull().unique(),
	monetizationWeight: real("monetization_weight").notNull(),
	arpuExpectation: varchar("arpu_expectation", { length: 50 }),
	arpuMultiplier: real("arpu_multiplier").notNull().default(1.0),
	population: integer("population"),
}).enableRLS();

export const trackingGroupsRelations = relations(
	trackingGroups,
	({ many }) => ({
		members: many(subredditGroups),
	}),
);

export const subredditGroups = pgTable(
	"subreddit_groups",
	{
		subredditId: integer("subreddit_id")
			.references(() => subreddits.id, { onDelete: "cascade" })
			.notNull(),
		groupId: integer("group_id")
			.references(() => trackingGroups.id, { onDelete: "cascade" })
			.notNull(),
	},
	(t) => [
		{
			pk: primaryKey({ columns: [t.subredditId, t.groupId] }),
		},
	],
).enableRLS();

export const subredditGroupsRelations = relations(
	subredditGroups,
	({ one }) => ({
		subreddit: one(subreddits, {
			fields: [subredditGroups.subredditId],
			references: [subreddits.id],
		}),
		group: one(trackingGroups, {
			fields: [subredditGroups.groupId],
			references: [trackingGroups.id],
		}),
	}),
);

export const metricsHistory = pgTable(
	"metrics_history",
	{
		id: serial("id").primaryKey(),
		subredditId: integer("subreddit_id")
			.references(() => subreddits.id, { onDelete: "cascade" })
			.notNull(),
		weeklyVisitors: integer("weekly_visitors").notNull(),
		weeklyContributions: integer("weekly_contributions").notNull(),
		usedPremium: boolean("used_premium").default(false).notNull(),
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
	overallDauEstimate: integer("overall_dau_estimate").notNull(),
	overallDauGrowthPercent: real("overall_dau_growth_percent").notNull().default(0),
	overallNetNewDau: integer("overall_net_new_dau").notNull().default(0),
	velocityIndexScore: real("velocity_index_score").notNull(),
}).enableRLS();
