CREATE TABLE "palette_likes" (
	"user_id" uuid NOT NULL,
	"published_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "palette_likes_user_id_published_id_pk" PRIMARY KEY("user_id","published_id")
);
--> statement-breakpoint
CREATE TABLE "published_palettes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"rationale" text,
	"hexes" jsonb NOT NULL,
	"harmony" text,
	"a11y_score" integer DEFAULT 0 NOT NULL,
	"license" text DEFAULT 'all-rights-reserved' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "published_palettes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "handle" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "palette_likes" ADD CONSTRAINT "palette_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "palette_likes" ADD CONSTRAINT "palette_likes_published_id_published_palettes_id_fk" FOREIGN KEY ("published_id") REFERENCES "public"."published_palettes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_palettes" ADD CONSTRAINT "published_palettes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "published_user_idx" ON "published_palettes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "published_visibility_idx" ON "published_palettes" USING btree ("visibility");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_handle_unique" UNIQUE("handle");