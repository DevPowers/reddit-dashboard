import { pgTable, serial, varchar, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const subreddits = pgTable('subreddits', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subredditsRelations = relations(subreddits, ({ many }) => ({
  metrics: many(subredditMetrics),
}));

export const subredditMetrics = pgTable('subreddit_metrics', {
  id: serial('id').primaryKey(),
  subredditId: integer('subreddit_id').references(() => subreddits.id).notNull(),
  weeklyVisitors: integer('weekly_visitors').notNull(),
  weeklyContributions: integer('weekly_contributions').notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

export const subredditMetricsRelations = relations(subredditMetrics, ({ one }) => ({
  subreddit: one(subreddits, {
    fields: [subredditMetrics.subredditId],
    references: [subreddits.id],
  }),
}));
