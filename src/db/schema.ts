import { relations } from "drizzle-orm";
import {
	integer,
	pgTable,
	serial,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const subreddits = pgTable("subreddits", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull().unique(),
	category: varchar("category", { length: 50 }).notNull(),
	subCategory: varchar("sub_category", { length: 100 }),
	arpuExpectation: varchar("arpu_expectation", { length: 50 }),
	population: integer("population"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subredditsRelations = relations(subreddits, ({ many }) => ({
	metrics: many(subredditMetrics),
}));

export const subredditMetrics = pgTable("subreddit_metrics", {
	id: serial("id").primaryKey(),
	subredditId: integer("subreddit_id")
		.references(() => subreddits.id)
		.notNull(),
	weeklyVisitors: integer("weekly_visitors").notNull(),
	weeklyContributions: integer("weekly_contributions").notNull(),
	recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const subredditMetricsRelations = relations(
	subredditMetrics,
	({ one }) => ({
		subreddit: one(subreddits, {
			fields: [subredditMetrics.subredditId],
			references: [subreddits.id],
		}),
	}),
);
