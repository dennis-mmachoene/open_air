import "server-only";
import { count, desc, eq, ilike, isNotNull, or } from "drizzle-orm";
import { getDb } from "./db";
import {
  palettes,
  savedPalettes,
  userCollections,
  userPalettes,
  users,
} from "./db/schema";
import { env } from "./env";
import { getPalette } from "./palettes/snapshot";
import { normalizePlan, type Plan } from "./plans";

function dbReady(): boolean {
  return Boolean(env.DATABASE_URL);
}

export interface AdminOverview {
  totalUsers: number;
  byPlan: Record<Plan, number>;
  onboarded: number;
  totalSaves: number;
  totalGenerated: number;
  totalCollections: number;
  recent: Array<{
    id: string;
    email: string;
    name: string | null;
    plan: Plan;
    createdAt: Date;
    onboarded: boolean;
  }>;
}

const EMPTY_OVERVIEW: AdminOverview = {
  totalUsers: 0,
  byPlan: { free: 0, pro: 0, studio: 0 },
  onboarded: 0,
  totalSaves: 0,
  totalGenerated: 0,
  totalCollections: 0,
  recent: [],
};

export async function adminOverview(): Promise<AdminOverview> {
  if (!dbReady()) return EMPTY_OVERVIEW;
  try {
    const db = getDb();
    const [
      [usersRow],
      planRows,
      [onboardedRow],
      [savesRow],
      [genRow],
      [colRow],
      recent,
    ] = await Promise.all([
      db.select({ n: count() }).from(users),
      db.select({ plan: users.plan, n: count() }).from(users).groupBy(users.plan),
      db.select({ n: count() }).from(users).where(isNotNull(users.onboardedAt)),
      db.select({ n: count() }).from(savedPalettes),
      db.select({ n: count() }).from(userPalettes),
      db.select({ n: count() }).from(userCollections),
      db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          plan: users.plan,
          createdAt: users.createdAt,
          onboardedAt: users.onboardedAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(8),
    ]);

    const byPlan: Record<Plan, number> = { free: 0, pro: 0, studio: 0 };
    for (const r of planRows) byPlan[normalizePlan(r.plan)] = Number(r.n);

    return {
      totalUsers: Number(usersRow?.n ?? 0),
      byPlan,
      onboarded: Number(onboardedRow?.n ?? 0),
      totalSaves: Number(savesRow?.n ?? 0),
      totalGenerated: Number(genRow?.n ?? 0),
      totalCollections: Number(colRow?.n ?? 0),
      recent: recent.map((r) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        plan: normalizePlan(r.plan),
        createdAt: r.createdAt,
        onboarded: r.onboardedAt != null,
      })),
    };
  } catch {
    return EMPTY_OVERVIEW;
  }
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  plan: Plan;
  saves: number;
  createdAt: Date;
  onboarded: boolean;
}

export async function adminUsers(
  q: string,
  limit = 50,
): Promise<AdminUserRow[]> {
  if (!dbReady()) return [];
  try {
    const db = getDb();
    const term = q.trim();
    const where = term
      ? or(ilike(users.email, `%${term}%`), ilike(users.name, `%${term}%`))
      : undefined;

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        plan: users.plan,
        createdAt: users.createdAt,
        onboardedAt: users.onboardedAt,
        saves: count(savedPalettes.paletteId),
      })
      .from(users)
      .leftJoin(savedPalettes, eq(savedPalettes.userId, users.id))
      .where(where)
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      plan: normalizePlan(r.plan),
      saves: Number(r.saves),
      createdAt: r.createdAt,
      onboarded: r.onboardedAt != null,
    }));
  } catch {
    return [];
  }
}

export interface ContentInsights {
  topSaved: Array<{ slug: string; name: string; hexes: string[]; saves: number }>;
  byHarmony: Array<{ harmony: string; n: number }>;
  byIndustry: Array<{ label: string; weight: number }>;
}

const EMPTY_INSIGHTS: ContentInsights = { topSaved: [], byHarmony: [], byIndustry: [] };

export async function contentInsights(): Promise<ContentInsights> {
  if (!dbReady()) return EMPTY_INSIGHTS;
  try {
    const db = getDb();

    const savedRows = await db
      .select({ slug: palettes.slug, saves: count(savedPalettes.userId) })
      .from(savedPalettes)
      .innerJoin(palettes, eq(savedPalettes.paletteId, palettes.id))
      .groupBy(palettes.slug)
      .orderBy(desc(count(savedPalettes.userId)));

    const topSaved = savedRows.slice(0, 10).flatMap((r) => {
      const p = getPalette(r.slug);
      if (!p) return [];
      return [{
        slug: p.slug,
        name: p.name,
        hexes: p.swatches.map((s) => s.hex),
        saves: Number(r.saves),
      }];
    });

    // Weight industries by how often their palettes were saved.
    const industry = new Map<string, number>();
    for (const r of savedRows) {
      const p = getPalette(r.slug);
      if (!p) continue;
      for (const ind of p.categories.industry) {
        industry.set(ind, (industry.get(ind) ?? 0) + Number(r.saves));
      }
    }
    const byIndustry = [...industry.entries()]
      .map(([label, weight]) => ({ label, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 8);

    const harmonyRows = await db
      .select({ harmony: userPalettes.harmony, n: count() })
      .from(userPalettes)
      .groupBy(userPalettes.harmony)
      .orderBy(desc(count()));

    return {
      topSaved,
      byHarmony: harmonyRows.map((r) => ({ harmony: r.harmony, n: Number(r.n) })),
      byIndustry,
    };
  } catch {
    return EMPTY_INSIGHTS;
  }
}
