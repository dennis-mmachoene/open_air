import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOrg } from "@/lib/orgs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { name?: unknown };
  if (typeof body.name !== "string") return NextResponse.json({ error: "name required" }, { status: 400 });
  try {
    const org = await createOrg(session.user.id, body.name);
    return NextResponse.json({ org });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
