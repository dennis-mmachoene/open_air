import { NextResponse } from "next/server";
import { queryPalettes, type PaletteFilter } from "@/lib/palettes/query";
import { rateLimit } from "@/lib/rate-limit";

/** Public catalog read used by the gallery's infinite scroll. Rate-limited by
 *  IP as defense-in-depth (no-op without Upstash). */
export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = await rateLimit(`palettes:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "rate limit exceeded" }, { status: 429 });
  }

  const sp = new URL(request.url).searchParams;
  const filter: PaletteFilter = {
    mood: sp.get("mood") ?? undefined,
    family: sp.get("family") ?? undefined,
    industry: sp.get("industry") ?? undefined,
    style: sp.get("style") ?? undefined,
    season: sp.get("season") ?? undefined,
    harmony: sp.get("harmony") ?? undefined,
    collection: sp.get("collection") ?? undefined,
    dark: sp.has("dark") ? sp.get("dark") === "true" : undefined,
    q: sp.get("q") ?? undefined,
  };
  const limit = Number(sp.get("limit") ?? 24);
  const cursor = sp.get("cursor");

  return NextResponse.json(queryPalettes(filter, { limit, cursor }));
}
