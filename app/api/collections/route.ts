import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  collectionsForSlug,
  createUserCollection,
  deleteUserCollection,
  listUserCollections,
  toggleCollectionItem,
} from "@/lib/user-collections";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ authenticated: false, collections: [] });
  }
  const slug = new URL(request.url).searchParams.get("slug");
  const collections = slug
    ? await collectionsForSlug(session.user.id, slug)
    : await listUserCollections(session.user.id);
  return NextResponse.json({ authenticated: true, collections });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
  if (!body || typeof body.name !== "string") {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const created = await createUserCollection(session.user.id, body.name);
  return NextResponse.json({ collection: created });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as
    | { collectionId?: unknown; slug?: unknown }
    | null;
  if (!body || typeof body.collectionId !== "string" || typeof body.slug !== "string") {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const result = await toggleCollectionItem(
    session.user.id,
    body.collectionId,
    body.slug,
  );
  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "bad request" }, { status: 400 });
  await deleteUserCollection(session.user.id, id);
  return NextResponse.json({ ok: true });
}
