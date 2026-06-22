ALTER TABLE "brand_kits" ADD COLUMN "sync_token" text;--> statement-breakpoint
ALTER TABLE "brand_kits" ADD COLUMN "sync_webhook_url" text;--> statement-breakpoint
ALTER TABLE "brand_kits" ADD CONSTRAINT "brand_kits_sync_token_unique" UNIQUE("sync_token");