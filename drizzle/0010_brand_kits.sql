CREATE TABLE "brand_kit_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kit_id" uuid NOT NULL,
	"type" text DEFAULT 'color' NOT NULL,
	"name" text NOT NULL,
	"hexes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_kits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_kit_assets" ADD CONSTRAINT "brand_kit_assets_kit_id_brand_kits_id_fk" FOREIGN KEY ("kit_id") REFERENCES "public"."brand_kits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_kits" ADD CONSTRAINT "brand_kits_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_kits" ADD CONSTRAINT "brand_kits_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brand_kit_assets_kit_idx" ON "brand_kit_assets" USING btree ("kit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "brand_kits_org_slug_idx" ON "brand_kits" USING btree ("org_id","slug");--> statement-breakpoint
CREATE INDEX "brand_kits_org_idx" ON "brand_kits" USING btree ("org_id");