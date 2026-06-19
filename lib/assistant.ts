import { ALL_PALETTES } from "./palettes/snapshot";
import { env } from "./env";

export interface AssistantResult {
  reply: string;
  slugs: string[];
}

const KINDS = ["mood", "family", "industry", "style", "season"] as const;

function haystack(slug: string): string {
  const p = ALL_PALETTES.find((x) => x.slug === slug);
  if (!p) return "";
  return [p.name, p.tagline, p.story, p.harmony, ...KINDS.flatMap((k) => p.categories[k])]
    .join(" ")
    .toLowerCase();
}

/** Keyword/tag scoring fallback used when Gemini isn't configured (or errors). */
function localMatch(query: string): string[] {
  const tokens = query.toLowerCase().match(/[a-z]+/g) ?? [];
  if (tokens.length === 0) return ALL_PALETTES.slice(0, 4).map((p) => p.slug);
  return [...ALL_PALETTES]
    .map((p) => {
      const hay = haystack(p.slug);
      const score = tokens.reduce((s, t) => (hay.includes(t) ? s + 1 : s), 0);
      return { slug: p.slug, score, pop: p.popularity };
    })
    .sort((a, b) => b.score - a.score || b.pop - a.pop)
    .slice(0, 4)
    .filter((x) => x.score > 0)
    .map((x) => x.slug);
}

function catalog(): string {
  return ALL_PALETTES.map(
    (p) =>
      `${p.slug} | ${p.name} | ${p.harmony} | ${KINDS.flatMap((k) => p.categories[k]).join(",")}`,
  ).join("\n");
}

/** Ask the AI color concierge for palette recommendations. Auth-aware via name. */
export async function askAssistant(
  message: string,
  userName?: string,
): Promise<AssistantResult> {
  const fallback = (): AssistantResult => {
    const slugs = localMatch(message);
    return {
      reply: slugs.length
        ? "Here are a few palettes that fit what you described."
        : "I couldn't find a close match — try a mood, a use-case, or a colour family.",
      slugs,
    };
  };

  if (!env.GEMINI_API_KEY) return fallback();

  const model = env.GEMINI_MODEL ?? "gemini-1.5-flash";
  const system =
    `You are Aura, the friendly colour concierge for Open Air, a gallery of curated colour palettes. ` +
    `Help the user choose palettes for their project. ` +
    (userName ? `The user's name is ${userName}; greet them warmly by first name when natural. ` : ``) +
    `You may ONLY recommend palettes from this catalog, by their exact slug:\n${catalog()}\n\n` +
    `Reply with STRICT JSON only: {"reply": string (1-2 warm sentences), "slugs": string[] (1-4 exact slugs)}.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `${system}\n\nUser: ${message}` }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
        }),
      },
    );
    if (!res.ok) return fallback();
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const parsed = JSON.parse(text) as { reply?: string; slugs?: unknown };
    const slugs = Array.isArray(parsed.slugs)
      ? parsed.slugs
          .filter((s): s is string => typeof s === "string")
          .filter((s) => ALL_PALETTES.some((p) => p.slug === s))
          .slice(0, 4)
      : [];
    return {
      reply: parsed.reply ?? "Here are some ideas.",
      slugs: slugs.length ? slugs : localMatch(message),
    };
  } catch {
    return fallback();
  }
}
