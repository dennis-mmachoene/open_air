import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { generateFromSpec, HARMONY_OPTIONS } from "@/lib/user-palettes";
import { PaletteGateError } from "@/lib/palettes/generate";
import type { Harmony } from "@/lib/color/harmony";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const entitlements = await getEntitlements(session.user.id);
  if (!entitlements.generator) {
    return NextResponse.json({ error: "upgrade required" }, { status: 403 });
  }
  const rl = await rateLimit(`generate:${session.user.id}`);
  if (!rl.success) {
    return NextResponse.json({ error: "rate limit exceeded" }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
    baseHue?: unknown;
    harmony?: unknown;
    chroma?: unknown;
  } | null;

  const harmony = HARMONY_OPTIONS.includes(body?.harmony as Harmony)
    ? (body!.harmony as Harmony)
    : "Analogous";

  try {
    const palette = generateFromSpec({
      name: typeof body?.name === "string" ? body.name : "My palette",
      baseHue: typeof body?.baseHue === "number" ? body.baseHue : 220,
      harmony,
      chroma: typeof body?.chroma === "number" ? body.chroma : 0.12,
    });
    return NextResponse.json({ palette });
  } catch (err) {
    if (err instanceof PaletteGateError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json({ error: "generation failed" }, { status: 422 });
  }
}
