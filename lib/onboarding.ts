import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "./db/schema";
import { env } from "./env";
import { ALL_PALETTES } from "./palettes/snapshot";
import type { Palette } from "./palettes/types";
import { toggleSave } from "./saves";
import { createUserCollection, toggleCollectionItem } from "./user-collections";

/** First-run "what are you working on" options, mapped to an industry tag. */
export interface UseCase {
  id: string;
  label: string;
  blurb: string;
  industry: string;
}

export const USE_CASES: UseCase[] = [
  { id: "wellness", label: "Wellness & lifestyle", blurb: "Calm, restorative, human.", industry: "Wellness" },
  { id: "saas", label: "Tech & SaaS", blurb: "Crisp, confident, modern.", industry: "Tech & SaaS" },
  { id: "food", label: "Food & hospitality", blurb: "Warm, appetising, inviting.", industry: "Food & Hospitality" },
  { id: "fashion", label: "Fashion & retail", blurb: "Editorial, bold, expressive.", industry: "Fashion" },
  { id: "portfolio", label: "Portfolio & creative", blurb: "Distinctive and personal.", industry: "Portfolio" },
  { id: "finance", label: "Finance & trust", blurb: "Stable, credible, sharp.", industry: "Finance" },
];

export interface OnboardPalette {
  slug: string;
  name: string;
  tagline: string;
  hexes: string[];
}

export interface UseCaseData extends UseCase {
  palettes: OnboardPalette[];
}

function trim(p: Palette): OnboardPalette {
  return { slug: p.slug, name: p.name, tagline: p.tagline, hexes: p.swatches.map((s) => s.hex) };
}

/** Six hand-picked palettes for a use-case, most popular first. */
export function palettesForUseCase(id: string): OnboardPalette[] {
  const uc = USE_CASES.find((u) => u.id === id) ?? USE_CASES[0];
  return ALL_PALETTES
    .filter((p) => p.categories.industry.includes(uc.industry))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 6)
    .map(trim);
}

/** All use-cases with their curated palettes — passed to the client flow. */
export function listUseCases(): UseCaseData[] {
  return USE_CASES.map((uc) => ({ ...uc, palettes: palettesForUseCase(uc.id) }));
}

/** True only for a real, signed-in user who has never finished onboarding. */
export async function needsOnboarding(userId: string): Promise<boolean> {
  if (!env.DATABASE_URL) return false;
  try {
    const db = getDb();
    const [row] = await db
      .select({ onboardedAt: users.onboardedAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return Boolean(row) && row.onboardedAt == null;
  } catch {
    return false;
  }
}

/**
 * Mark onboarding done (once) and seed the dashboard with the user's picks:
 * save up to the free limit and drop them all in a "My picks" collection.
 */
export async function completeOnboarding(userId: string, slugs: string[]): Promise<void> {
  const db = getDb();
  const res = await db
    .update(users)
    .set({ onboardedAt: new Date() })
    .where(and(eq(users.id, userId), isNull(users.onboardedAt)))
    .returning({ id: users.id });

  // Already onboarded (or no row updated) — don't re-seed.
  if (res.length === 0) return;

  const picks = [...new Set(slugs)].filter(Boolean).slice(0, 6);
  if (picks.length === 0) return;

  for (const slug of picks) {
    try { await toggleSave(userId, slug); } catch { /* unknown slug / limit */ }
  }
  try {
    const col = await createUserCollection(userId, "My picks");
    for (const slug of picks) {
      try { await toggleCollectionItem(userId, col.id, slug); } catch { /* ignore */ }
    }
  } catch { /* collection seeding is best-effort */ }
}
