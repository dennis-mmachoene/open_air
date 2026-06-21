import "server-only";
import { env } from "./env";
import { localBriefToBase, type DirectedColor } from "./color/director";

export interface DirectedResult extends DirectedColor {
  source: "ai" | "local";
}

const HEX_RE = /^#[0-9a-f]{6}$/i;

function validHex(s: unknown): string | null {
  return typeof s === "string" && HEX_RE.test(s.trim()) ? s.trim().toLowerCase() : null;
}

/** One structured JSON call to Gemini. Returns null on any failure. */
async function gemini(system: string, user: string): Promise<{ hex?: unknown; rationale?: unknown } | null> {
  const model = env.GEMINI_MODEL ?? "gemini-1.5-flash";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.8, maxOutputTokens: 250 },
        }),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const CREATE_SYSTEM =
  "You are an expert brand color director. Given a brand brief, choose ONE base brand color that captures its personality. " +
  "Pick a color with moderate lightness and chroma that works as a primary brand color — Open Air will build the full, accessible tonal scale and token system around it, so you only choose the seed. " +
  'Respond as STRICT JSON only: {"hex": "#rrggbb", "rationale": "1–2 sentences on why this color suits the brand"}.';

/** Interpret a brief into a base brand color (AI when configured, else local). */
export async function directFromBrief(brief: string): Promise<DirectedResult> {
  const fallback = (): DirectedResult => ({ ...localBriefToBase(brief), source: "local" });
  if (!env.GEMINI_API_KEY) return fallback();
  const data = await gemini(CREATE_SYSTEM, brief);
  const hex = validHex(data?.hex);
  if (!hex) return fallback();
  const rationale = typeof data?.rationale === "string" && data.rationale.trim()
    ? data.rationale.trim()
    : localBriefToBase(brief).rationale;
  return { hex, rationale, source: "ai" };
}

/** Refine an existing base color from a free-text instruction. */
export async function directRefine(base: string, instruction: string): Promise<DirectedResult> {
  if (!env.GEMINI_API_KEY) {
    return { hex: base, rationale: "Free-text refinement needs the AI key — use a quick-adjust chip instead.", source: "local" };
  }
  const system =
    `You are a color director refining a brand color. The current base color is ${base}. ` +
    "Apply the user's instruction and return a new, sensible primary brand color. " +
    'Respond as STRICT JSON only: {"hex": "#rrggbb", "rationale": "what you changed and why, in one sentence"}.';
  const data = await gemini(system, instruction);
  const hex = validHex(data?.hex);
  if (!hex) return { hex: base, rationale: "Couldn't apply that — try a quick-adjust chip.", source: "local" };
  const rationale = typeof data?.rationale === "string" && data.rationale.trim() ? data.rationale.trim() : "Adjusted.";
  return { hex, rationale, source: "ai" };
}
