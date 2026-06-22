CREATE TABLE "brand_kit_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kit_id" uuid NOT NULL,
	"proposed_by" uuid NOT NULL,
	"type" text NOT NULL,
	"target_asset_id" uuid,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"note" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"review_note" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_kit_proposals" ADD CONSTRAINT "brand_kit_proposals_kit_id_brand_kits_id_fk" FOREIGN KEY ("kit_id") REFERENCES "public"."brand_kits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_kit_proposals" ADD CONSTRAINT "brand_kit_proposals_proposed_by_users_id_fk" FOREIGN KEY ("proposed_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_kit_proposals" ADD CONSTRAINT "brand_kit_proposals_target_asset_id_brand_kit_assets_id_fk" FOREIGN KEY ("target_asset_id") REFERENCES "public"."brand_kit_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_kit_proposals" ADD CONSTRAINT "brand_kit_proposals_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brand_kit_proposals_kit_idx" ON "brand_kit_proposals" USING btree ("kit_id");--> statement-breakpoint
CREATE INDEX "brand_kit_proposals_status_idx" ON "brand_kit_proposals" USING btree ("status");