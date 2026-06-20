import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
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
