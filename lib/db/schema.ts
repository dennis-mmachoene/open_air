import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  uniqueIndex,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";
import type { Palette, Roles, Swatch, Why } from "../palettes/types";

/** Postgres full-text search vector. */
const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return "tsvector";
  },
});

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

// ---------------------------------------------------------------------------
// Catalog (source of truth; statically snapshotted for public read paths)
// ---------------------------------------------------------------------------

export const palettes = pgTable(
  "palettes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    tagline: text("tagline").notNull(),
    story: text("story").notNull(),
    harmony: text("harmony").notNull(),
    isPremium: boolean("is_premium").notNull().default(false),
    popularity: integer("popularity").notNull().default(0),
    /** Full role token sets (light/dark) + computed "why", as JSONB. */
    roles: jsonb("roles").$type<Palette["roles"]>().notNull(),
    why: jsonb("why").$type<Palette["why"]>().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    searchVector: tsvector("search_vector").generatedAlwaysAs(
      sql`to_tsvector('english', coalesce("name", '') || ' ' || coalesce("tagline", '') || ' ' || coalesce("story", ''))`,
    ),
  },
  (t) => [
    index("palettes_popularity_idx").on(t.popularity),
    index("palettes_search_idx").using("gin", t.searchVector),
    index("palettes_name_trgm_idx").using("gin", sql`${t.name} gin_trgm_ops`),
  ],
);

export const paletteColors = pgTable(
  "palette_colors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    paletteId: uuid("palette_id")
      .notNull()
      .references(() => palettes.id, { onDelete: "cascade" }),
    hex: text("hex").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    role: text("role"),
  },
  (t) => [index("palette_colors_palette_idx").on(t.paletteId)],
);

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  /** mood | family | industry | style | season */
  kind: text("kind").notNull(),
});

export const paletteCategories = pgTable(
  "palette_categories",
  {
    paletteId: uuid("palette_id")
      .notNull()
      .references(() => palettes.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.paletteId, t.categoryId] })],
);

export const collections = pgTable("collections", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  heroPaletteId: uuid("hero_palette_id").references(() => palettes.id, {
    onDelete: "set null",
  }),
});

export const collectionItems = pgTable(
  "collection_items",
  {
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    paletteId: uuid("palette_id")
      .notNull()
      .references(() => palettes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (t) => [primaryKey({ columns: [t.collectionId, t.paletteId] })],
);

// ---------------------------------------------------------------------------
// Accounts & user data (resolved at request time)
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  stripeCustomerId: text("stripe_customer_id"),
  plan: text("plan").notNull().default("free"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  // Creator profile (Wave 5)
  handle: text("handle").unique(),
  bio: text("bio"),
  website: text("website"),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Community publishing (Wave 5)
// ---------------------------------------------------------------------------

export const publishedPalettes = pgTable(
  "published_palettes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    rationale: text("rationale"),
    hexes: jsonb("hexes").$type<string[]>().notNull(),
    harmony: text("harmony"),
    a11yScore: integer("a11y_score").notNull().default(0),
    license: text("license").notNull().default("all-rights-reserved"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    visibility: text("visibility").notNull().default("public"),
    featured: boolean("featured").notNull().default(false),
    likeCount: integer("like_count").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("published_user_idx").on(t.userId),
    index("published_visibility_idx").on(t.visibility),
  ],
);

export const paletteLikes = pgTable(
  "palette_likes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    publishedId: uuid("published_id")
      .notNull()
      .references(() => publishedPalettes.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.publishedId] })],
);

export const follows = pgTable(
  "follows",
  {
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.followerId, t.followingId] })],
);

export const bookmarks = pgTable(
  "bookmarks",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    publishedId: uuid("published_id")
      .notNull()
      .references(() => publishedPalettes.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.publishedId] })],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    publishedId: uuid("published_id")
      .notNull()
      .references(() => publishedPalettes.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("comments_published_idx").on(t.publishedId)],
);

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  publishedId: uuid("published_id")
    .notNull()
    .references(() => publishedPalettes.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: createdAt(),
});

export const savedPalettes = pgTable(
  "saved_palettes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    paletteId: uuid("palette_id")
      .notNull()
      .references(() => palettes.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.paletteId] })],
);

export const userCollections = pgTable("user_collections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const userCollectionItems = pgTable(
  "user_collection_items",
  {
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => userCollections.id, { onDelete: "cascade" }),
    paletteId: uuid("palette_id")
      .notNull()
      .references(() => palettes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (t) => [primaryKey({ columns: [t.collectionId, t.paletteId] })],
);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  status: text("status").notNull(),
  priceId: text("price_id"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
});

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  hashedKey: text("hashed_key").notNull().unique(),
  label: text("label"),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Auth.js (Drizzle adapter) — accounts, sessions, verification tokens
// ---------------------------------------------------------------------------

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/** Stripe webhook idempotency — one row per processed event id. */
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Palettes a user generated with the Pro generator. */
export const userPalettes = pgTable("user_palettes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  baseHue: integer("base_hue").notNull(),
  harmony: text("harmony").notNull(),
  swatches: jsonb("swatches").$type<Swatch[]>().notNull(),
  roles: jsonb("roles").$type<{ light: Roles; dark: Roles }>().notNull(),
  why: jsonb("why").$type<Why>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Teams & governance (Wave 6)
// ---------------------------------------------------------------------------

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("team"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const organizationMembers = pgTable(
  "organization_members",
  {
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.orgId, t.userId] }),
    index("org_members_user_idx").on(t.userId),
  ],
);

export const organizationInvites = pgTable(
  "organization_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").notNull().default("member"),
    token: text("token").notNull().unique(),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    createdAt: createdAt(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("org_invites_org_idx").on(t.orgId),
    index("org_invites_email_idx").on(t.email),
  ],
);

// ---------------------------------------------------------------------------
// Platform administration — fully isolated from application users.
// These tables back the System Administrator console (/sys) and never join to
// the `users` table: platform authority is a separate authentication domain.
// ---------------------------------------------------------------------------

export const platformAdmins = pgTable(
  "platform_admins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name"),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("super_admin"),
    status: text("status").notNull().default("active"), // active | disabled
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    totpSecret: text("totp_secret"),
    totpEnabled: boolean("totp_enabled").notNull().default(false),
    totpBackupCodes: jsonb("totp_backup_codes").$type<string[]>().notNull().default([]),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("platform_admins_email_idx").on(t.email)],
);

export const platformSessions = pgTable(
  "platform_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tokenHash: text("token_hash").notNull().unique(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => platformAdmins.id, { onDelete: "cascade" }),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [index("platform_sessions_admin_idx").on(t.adminId)],
);

/** Short-lived, single-use handle issued after a correct password when the
 *  admin has 2FA enabled; consumed by the TOTP/backup-code step. */
export const platformLoginChallenges = pgTable(
  "platform_login_challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tokenHash: text("token_hash").notNull().unique(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => platformAdmins.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("platform_login_challenges_admin_idx").on(t.adminId)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorAdminId: uuid("actor_admin_id").references(() => platformAdmins.id, { onDelete: "set null" }),
    actorLabel: text("actor_label"), // denormalized email for display after deletion
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    ip: text("ip"),
    createdAt: createdAt(),
  },
  (t) => [
    index("audit_logs_created_idx").on(t.createdAt),
    index("audit_logs_action_idx").on(t.action),
  ],
);

export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  description: text("description"),
  rolloutPercent: integer("rollout_percent").notNull().default(100),
  updatedBy: text("updated_by"),
  updatedAt: updatedAt(),
});

export const platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>(),
  description: text("description"),
  updatedBy: text("updated_by"),
  updatedAt: updatedAt(),
});

// ---------------------------------------------------------------------------
// Shared brand kits (Wave 6 Part 2) — team-owned color assets.
// ---------------------------------------------------------------------------

export const brandKits = pgTable(
  "brand_kits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    syncToken: text("sync_token").unique(),
    syncWebhookUrl: text("sync_webhook_url"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("brand_kits_org_slug_idx").on(t.orgId, t.slug),
    index("brand_kits_org_idx").on(t.orgId),
  ],
);

export const brandKitAssets = pgTable(
  "brand_kit_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kitId: uuid("kit_id")
      .notNull()
      .references(() => brandKits.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("color"), // color | palette
    name: text("name").notNull(),
    hexes: jsonb("hexes").$type<string[]>().notNull().default([]),
    notes: text("notes"),
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("brand_kit_assets_kit_idx").on(t.kitId)],
);

// ---------------------------------------------------------------------------
// Brand-kit governance (Wave 6 Part 3) — propose → review → apply.
// ---------------------------------------------------------------------------

export const brandKitProposals = pgTable(
  "brand_kit_proposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kitId: uuid("kit_id")
      .notNull()
      .references(() => brandKits.id, { onDelete: "cascade" }),
    proposedBy: uuid("proposed_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // add_asset | update_asset | delete_asset
    targetAssetId: uuid("target_asset_id").references(() => brandKitAssets.id, { onDelete: "cascade" }),
    payload: jsonb("payload").$type<{ name?: string; hexes?: string[]; notes?: string }>().notNull().default({}),
    note: text("note"),
    status: text("status").notNull().default("pending"), // pending | approved | rejected
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewNote: text("review_note"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("brand_kit_proposals_kit_idx").on(t.kitId),
    index("brand_kit_proposals_status_idx").on(t.status),
  ],
);

// ---------------------------------------------------------------------------
// Organization audit log (Wave 8) — per-team activity trail for governance.
// ---------------------------------------------------------------------------

export const orgAuditLogs = pgTable(
  "org_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    actorLabel: text("actor_label"),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [
    index("org_audit_org_idx").on(t.orgId),
    index("org_audit_created_idx").on(t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// Enterprise access (Wave 8 Part 2) — verified domains for JIT provisioning.
// ---------------------------------------------------------------------------

export const orgDomains = pgTable(
  "org_domains",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    domain: text("domain").notNull().unique(),
    verified: boolean("verified").notNull().default(false),
    verificationToken: text("verification_token").notNull(),
    autoJoin: boolean("auto_join").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index("org_domains_org_idx").on(t.orgId)],
);
