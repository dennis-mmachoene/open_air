import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateProfile } from "@/lib/publish";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const update: { handle?: string; bio?: string; website?: string } = {};
  if (typeof body.handle === "string") update.handle = body.handle;
  if (typeof body.bio === "string") update.bio = body.bio;
  if (typeof body.website === "string") update.website = body.website;
  try {
    const profile = await updateProfile(session.user.id, update);
    return NextResponse.json({ profile });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
