CREATE TABLE "user_palettes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"base_hue" integer NOT NULL,
	"harmony" text NOT NULL,
	"swatches" jsonb NOT NULL,
	"roles" jsonb NOT NULL,
	"why" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_palettes" ADD CONSTRAINT "user_palettes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;