import { NextResponse } from "next/server";
import { queryPalettes, type PaletteFilter } from "@/lib/palettes/query";

export const dynamic = "force-static";

export function GET(request: Request) {
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

  const result = queryPalettes(filter, { limit, cursor });
  return NextResponse.json(result);
}
