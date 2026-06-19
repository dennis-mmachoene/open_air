import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { HARMONY_OPTIONS, saveUserPalette } from "@/lib/user-palettes";
import type { Harmony } from "@/lib/color/harmony";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const entitlements = await getEntitlements(session.user.id);
  if (!entitlements.generator) {
    return NextResponse.json({ error: "upgrade required" }, { status: 403 });
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
    const row = await saveUserPalette(session.user.id, {
      name: typeof body?.name === "string" ? body.name : "My palette",
      baseHue: typeof body?.baseHue === "number" ? body.baseHue : 220,
      harmony,
      chroma: typeof body?.chroma === "number" ? body.chroma : 0.12,
    });
    return NextResponse.json({ id: row?.id });
  } catch {
    return NextResponse.json({ error: "could not save" }, { status: 422 });
  }
}
