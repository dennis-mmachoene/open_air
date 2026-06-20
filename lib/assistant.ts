import { ALL_PALETTES } from "./palettes/snapshot";
import { env } from "./env";

export interface AssistantResult {
  reply: string;
  slugs: string[];
}

export interface AssistantTurn {
  role: "user" | "aura";
  text: string;
}

export interface AssistantContext {
  name?: string | null;
  authenticated: boolean;
  plan?: string | null;
  history?: AssistantTurn[];
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

function firstName(name?: string | null): string | null {
  return name?.trim().split(/\s+/)[0] ?? null;
}

/** Build Aura's persona + context, tailored to who's asking. */
function systemPrompt(ctx: AssistantContext): string {
  const fn = firstName(ctx.name);
  const paid = ctx.plan && ctx.plan !== "free";

  const who = fn
    ? `You're talking with ${fn}. Use their first name occasionally and naturally — not in every message.`
    : `The person isn't signed in yet, so you don't know their name.`;

  const access = ctx.authenticated
    ? `They have an account${paid ? ` on the ${ctx.plan} plan` : ""}, so they can open, save, and organise any palette you suggest.`
    : `They're browsing as a guest. They can explore everything; when it's genuinely relevant you can mention that signing in lets them save palettes — but keep it light and never pushy.`;

  return [
    `You are Aura, the colour concierge for Open Air — a curated gallery of accessible colour palettes.`,
    `You are warm, knowledgeable, and genuinely conversational, like a thoughtful design friend. You can chat about colour, harmony, mood, accessibility and contrast, and how to use colour in real products. Keep replies natural and human — sometimes a single sentence, sometimes a short paragraph. Vary your wording; never sound scripted or repeat stock phrases.`,
    who,
    access,
    `When the conversation calls for specific palettes, recommend 1–4 from the catalogue below by their EXACT slug. You can also simply answer a question or chat without recommending anything — in that case leave slugs empty. Never invent slugs or palettes that aren't in the catalogue. Don't dump the whole list; choose thoughtfully and say why in a few words.`,
    `Catalogue (slug | name | harmony | tags):\n${catalog()}`,
    `Always respond as STRICT JSON only: {"reply": string, "slugs": string[]}. "reply" is your natural message to the person. "slugs" is 0–4 exact catalogue slugs (empty when you're just chatting or answering a question).`,
  ].join("\n\n");
}

/** Ask the AI colour concierge. Conversational, auth-aware, with memory. */
export async function askAssistant(
  message: string,
  ctx: AssistantContext,
): Promise<AssistantResult> {
  const fn = firstName(ctx.name);
  const fallback = (): AssistantResult => {
    const slugs = localMatch(message);
    const hi = fn ? `${fn}, ` : "";
    return {
      reply: slugs.length
        ? `${hi ? hi.charAt(0).toUpperCase() + hi.slice(1) : ""}here are a few palettes that fit what you described — open one to see how it works across a real UI.`.trim()
        : `I couldn't quite pin that down${fn ? `, ${fn}` : ""} — try a mood (calm, bold, warm), a use-case (fintech, wellness, editorial), or a colour family and I'll find something.`,
      slugs,
    };
  };

  if (!env.GEMINI_API_KEY) return fallback();

  const model = env.GEMINI_MODEL ?? "gemini-1.5-flash";

  // Recent turns become multi-turn context so the conversation flows.
  const history = (ctx.history ?? []).slice(-10).map((t) => ({
    role: t.role === "aura" ? "model" : "user",
    parts: [{ text: t.text }],
  }));

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt(ctx) }] },
          contents: [...history, { role: "user", parts: [{ text: message }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.85,
            maxOutputTokens: 600,
          },
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
    const reply = typeof parsed.reply === "string" && parsed.reply.trim()
      ? parsed.reply.trim()
      : fallback().reply;
    return { reply, slugs };
  } catch {
    return fallback();
  }
}
