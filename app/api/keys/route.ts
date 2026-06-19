import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { createApiKey, listApiKeys, revokeApiKey } from "@/lib/api-keys";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  return NextResponse.json({ keys: await listApiKeys(session.user.id) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const entitlements = await getEntitlements(session.user.id);
  if (!entitlements.api) {
    return NextResponse.json({ error: "studio plan required" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as { label?: unknown } | null;
  const label = typeof body?.label === "string" ? body.label : "API key";
  const created = await createApiKey(session.user.id, label);
  return NextResponse.json(created);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "bad request" }, { status: 400 });
  await revokeApiKey(session.user.id, id);
  return NextResponse.json({ ok: true });
}
