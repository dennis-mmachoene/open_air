CREATE TABLE "org_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"verification_token" text NOT NULL,
	"auto_join" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "org_domains_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
ALTER TABLE "org_domains" ADD CONSTRAINT "org_domains_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "org_domains_org_idx" ON "org_domains" USING btree ("org_id");