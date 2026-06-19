import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPalette } from "@/lib/palettes/snapshot";

const COOKIE = "oa_recent";
const MAX = 12;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { slug?: unknown } | null;
  if (!body || typeof body.slug !== "string" || !getPalette(body.slug)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const jar = await cookies();
  const existing = (jar.get(COOKIE)?.value ?? "").split(",").filter(Boolean);
  const next = [body.slug, ...existing.filter((s) => s !== body.slug)].slice(0, MAX);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, next.join(","), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
