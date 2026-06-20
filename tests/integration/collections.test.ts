import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { makeTestDb, resetDb, seedPalette, seedUser } from "./db";
import {
  createUserCollection,
  listUserCollections,
  toggleCollectionItem,
  collectionsForSlug,
} from "../../lib/user-collections";

let ctx: Awaited<ReturnType<typeof makeTestDb>>;
beforeAll(async () => { ctx = await makeTestDb(); });
afterAll(async () => { await ctx.client.close(); });
beforeEach(async () => { await resetDb(ctx.db); });

describe("user collections", () => {
  it("creates, adds/removes items, and counts them", async () => {
    const user = await seedUser(ctx.db, { plan: "pro" });
    await seedPalette(ctx.db, "a");
    const col = await createUserCollection(user, "Brand X");

    const added = await toggleCollectionItem(user, col.id, "a");
    expect(added.inCollection).toBe(true);

    let list = await listUserCollections(user);
    expect(list[0].itemCount).toBe(1);
    expect(await collectionsForSlug(user, "a")).toHaveLength(1);

    const removed = await toggleCollectionItem(user, col.id, "a");
    expect(removed.inCollection).toBe(false);
    list = await listUserCollections(user);
    expect(list[0].itemCount).toBe(0);
  });

  it("lists an existing collection as a save target, then accepts the palette", async () => {
    const user = await seedUser(ctx.db, { plan: "pro" });
    await seedPalette(ctx.db, "p1");
    const col = await createUserCollection(user, "Brand");

    let forSlug = await collectionsForSlug(user, "p1");
    expect(forSlug).toHaveLength(1);
    expect(forSlug[0].id).toBe(col.id);
    expect(forSlug[0].inCollection).toBe(false);

    const added = await toggleCollectionItem(user, col.id, "p1");
    expect(added.inCollection).toBe(true);

    forSlug = await collectionsForSlug(user, "p1");
    expect(forSlug[0].inCollection).toBe(true);
    expect((await listUserCollections(user))[0].itemCount).toBe(1);
  });

  it("won't let a user touch a collection they don't own", async () => {
    const owner = await seedUser(ctx.db, { plan: "pro" });
    const intruder = await seedUser(ctx.db, { plan: "pro" });
    await seedPalette(ctx.db, "a");
    const col = await createUserCollection(owner, "Private");
    await expect(toggleCollectionItem(intruder, col.id, "a")).rejects.toThrow();
  });
});
