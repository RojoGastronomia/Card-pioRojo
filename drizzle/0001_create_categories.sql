CREATE TABLE IF NOT EXISTS "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
); 