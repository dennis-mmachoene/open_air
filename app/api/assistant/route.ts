import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { askAssistant } from "@/lib/assistant";
import { getPalette } from "@/lib/palettes/snapshot";

export async function POST(request: Request) {
  const session = await auth();
  const body = (await request.json().catch(() => null)) as { message?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const result = await askAssistant(message, session?.user?.name ?? undefined);
  const palettes = result.slugs
    .map(getPalette)
    .filter((p) => p !== undefined)
    .map((p) => ({ slug: p.slug, name: p.name, hexes: p.swatches.map((s) => s.hex) }));

  return NextResponse.json({
    reply: result.reply,
    palettes,
    authenticated: Boolean(session?.user),
  });
}
