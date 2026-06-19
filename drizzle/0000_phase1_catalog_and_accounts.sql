CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"hashed_key" text NOT NULL,
	"label" text,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_hashed_key_unique" UNIQUE("hashed_key")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"kind" text NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "collection_items" (
	"collection_id" uuid NOT NULL,
	"palette_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "collection_items_collection_id_palette_id_pk" PRIMARY KEY("collection_id","palette_id")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"hero_palette_id" uuid,
	CONSTRAINT "collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "palette_categories" (
	"palette_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "palette_categories_palette_id_category_id_pk" PRIMARY KEY("palette_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "palette_colors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"palette_id" uuid NOT NULL,
	"hex" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"role" text
);
--> statement-breakpoint
CREATE TABLE "palettes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text NOT NULL,
	"story" text NOT NULL,
	"harmony" text NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"popularity" integer DEFAULT 0 NOT NULL,
	"roles" jsonb NOT NULL,
	"why" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', coalesce("name", '') || ' ' || coalesce("tagline", '') || ' ' || coalesce("story", ''))) STORED,
	CONSTRAINT "palettes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "saved_palettes" (
	"user_id" uuid NOT NULL,
	"palette_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_palettes_user_id_palette_id_pk" PRIMARY KEY("user_id","palette_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"status" text NOT NULL,
	"price_id" text,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "user_collection_items" (
	"collection_id" uuid NOT NULL,
	"palette_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "user_collection_items_collection_id_palette_id_pk" PRIMARY KEY("collection_id","palette_id")
);
--> statement-breakpoint
CREATE TABLE "user_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image" text,
	"stripe_customer_id" text,
	"plan" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_palette_id_palettes_id_fk" FOREIGN KEY ("palette_id") REFERENCES "public"."palettes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_hero_palette_id_palettes_id_fk" FOREIGN KEY ("hero_palette_id") REFERENCES "public"."palettes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "palette_categories" ADD CONSTRAINT "palette_categories_palette_id_palettes_id_fk" FOREIGN KEY ("palette_id") REFERENCES "public"."palettes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "palette_categories" ADD CONSTRAINT "palette_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "palette_colors" ADD CONSTRAINT "palette_colors_palette_id_palettes_id_fk" FOREIGN KEY ("palette_id") REFERENCES "public"."palettes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_palettes" ADD CONSTRAINT "saved_palettes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_palettes" ADD CONSTRAINT "saved_palettes_palette_id_palettes_id_fk" FOREIGN KEY ("palette_id") REFERENCES "public"."palettes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_collection_items" ADD CONSTRAINT "user_collection_items_collection_id_user_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."user_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_collection_items" ADD CONSTRAINT "user_collection_items_palette_id_palettes_id_fk" FOREIGN KEY ("palette_id") REFERENCES "public"."palettes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_collections" ADD CONSTRAINT "user_collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "palette_colors_palette_idx" ON "palette_colors" USING btree ("palette_id");--> statement-breakpoint
CREATE INDEX "palettes_popularity_idx" ON "palettes" USING btree ("popularity");--> statement-breakpoint
CREATE INDEX "palettes_search_idx" ON "palettes" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "palettes_name_trgm_idx" ON "palettes" USING gin ("name" gin_trgm_ops);