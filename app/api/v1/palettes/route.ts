import { NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/api-keys";
import { rateLimit } from "@/lib/rate-limit";
import { queryPalettes, type PaletteFilter } from "@/lib/palettes/query";

/** Public API (Studio plan): GET /api/v1/palettes with a Bearer API key. */
export async function GET(request: Request) {
  const authz = request.headers.get("authorization") ?? "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "missing api key" }, { status: 401 });
  }

  const principal = await verifyApiKey(token);
  if (!principal) {
    return NextResponse.json({ error: "invalid api key" }, { status: 401 });
  }
  if (principal.plan !== "studio") {
    return NextResponse.json({ error: "studio plan required" }, { status: 403 });
  }

  const rl = await rateLimit(principal.userId);
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
    q: sp.get("q") ?? undefined,
  };
  const result = queryPalettes(filter, {
    limit: Number(sp.get("limit") ?? 50),
    cursor: sp.get("cursor"),
  });

  return NextResponse.json(result, {
    headers: {
      "X-RateLimit-Remaining": Number.isFinite(rl.remaining)
        ? String(rl.remaining)
        : "unlimited",
    },
  });
}
