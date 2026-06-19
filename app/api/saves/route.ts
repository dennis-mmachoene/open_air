import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSavedSlugs, isSaved, toggleSave } from "@/lib/saves";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ authenticated: false, savedSlugs: [] as string[] });
  }
  const slug = new URL(request.url).searchParams.get("slug");
  if (slug) {
    return NextResponse.json({
      authenticated: true,
      saved: await isSaved(session.user.id, slug),
    });
  }
  return NextResponse.json({
    authenticated: true,
    savedSlugs: await getSavedSlugs(session.user.id),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { slug?: unknown } | null;
  if (!body || typeof body.slug !== "string") {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const result = await toggleSave(session.user.id, body.slug);
  return NextResponse.json(result);
}
