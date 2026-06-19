import { desc, eq } from "drizzle-orm";
import type { Harmony } from "./color/harmony";
import { getDb } from "./db";
import { userPalettes } from "./db/schema";
import { generatePalette } from "./palettes/generate";

export interface GenerateSpec {
  name: string;
  baseHue: number;
  harmony: Harmony;
  chroma?: number;
}

const EMPTY_CATEGORIES = {
  mood: [],
  family: [],
  industry: [],
  style: [],
  season: [],
};

export const HARMONY_OPTIONS: Harmony[] = [
  "Monochromatic",
  "Analogous",
  "Complementary",
  "Split-complementary",
  "Triadic",
  "Tetradic",
];

/** Run the §4.3 engine from a user spec (always AA-gated). */
export function generateFromSpec(spec: GenerateSpec) {
  return generatePalette(
    {
      name: spec.name.trim() || "My palette",
      story: "A palette generated in the Open Air studio.",
      baseHue: ((spec.baseHue % 360) + 360) % 360,
      harmony: spec.harmony,
      chroma: spec.chroma,
    },
    EMPTY_CATEGORIES,
  );
}

export async function saveUserPalette(userId: string, spec: GenerateSpec) {
  const palette = generateFromSpec(spec);
  const db = getDb();
  const [row] = await db
    .insert(userPalettes)
    .values({
      userId,
      name: palette.name,
      baseHue: spec.baseHue,
      harmony: palette.harmony,
      swatches: palette.swatches,
      roles: palette.roles,
      why: palette.why,
    })
    .returning({ id: userPalettes.id });
  return row;
}

export async function listUserPalettes(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(userPalettes)
    .where(eq(userPalettes.userId, userId))
    .orderBy(desc(userPalettes.createdAt));
}

export async function deleteUserPalette(userId: string, id: string) {
  const db = getDb();
  await db
    .delete(userPalettes)
    .where(eq(userPalettes.id, id) && eq(userPalettes.userId, userId));
}
