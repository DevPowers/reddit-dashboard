CREATE TABLE "scraper_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"key_index" integer NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"last_status" varchar(50),
	"last_attempt_at" timestamp with time zone,
	"last_error_at" timestamp with time zone,
	CONSTRAINT "scraper_keys_key_index_unique" UNIQUE("key_index")
);
