CREATE INDEX "recorded_at_idx" ON "metrics_history" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "subreddit_id_idx" ON "metrics_history" USING btree ("subreddit_id");