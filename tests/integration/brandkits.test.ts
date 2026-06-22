import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { makeTestDb, resetDb, seedUser } from "./db";
import { createOrg, inviteMember, acceptInvite } from "../../lib/orgs";
import {
  createKit,
  listKits,
  getKit,
  updateKit,
  deleteKit,
  addAsset,
  updateAsset,
  deleteAsset,
} from "../../lib/brandkits";

let ctx: Awaited<ReturnType<typeof makeTestDb>>;
beforeAll(async () => { ctx = await makeTestDb(); });
afterAll(async () => { await ctx.client.close(); });
beforeEach(async () => { await resetDb(ctx.db); });

async function teamWithMember() {
  const owner = await seedUser(ctx.db, { plan: "pro" });
  const member = await seedUser(ctx.db, { email: "m@test.dev" });
  const org = await createOrg(owner, "Acme");
  const inv = await inviteMember(org.id, owner, "m@test.dev");
  await acceptInvite(inv.token, member);
  return { owner, member, org };
}

describe("brand kits", () => {
  it("an admin/owner creates a kit; members can view it", async () => {
    const { owner, member, org } = await teamWithMember();
    const kit = await createKit(org.id, owner, "Core brand", "Our canonical colors");
    expect(kit.slug).toMatch(/^core-brand-/);
    const kits = await listKits(org.id);
    expect(kits).toHaveLength(1);
    expect(kits[0].assetCount).toBe(0);
    expect(await getKit(org.id, kit.slug)).not.toBeNull();
    // a plain member cannot create
    await expect(createKit(org.id, member, "Nope")).rejects.toThrow();
  });

  it("adds color + palette assets and lists them in order", async () => {
    const { owner, org } = await teamWithMember();
    const kit = await createKit(org.id, owner, "Brand");
    const a = await addAsset(kit.id, owner, { name: "Primary", hexes: ["#1d4ed8"] });
    expect(a.type).toBe("color");
    const b = await addAsset(kit.id, owner, { name: "Ramp", hexes: ["#1d4ed8", "#3b82f6", "#93c5fd"] });
    expect(b.type).toBe("palette");
    const full = await getKit(org.id, kit.slug);
    expect(full!.assets.map((x) => x.name)).toEqual(["Primary", "Ramp"]);
    expect(full!.assets[0].position).toBeLessThan(full!.assets[1].position);
  });

  it("rejects assets with no valid hex", async () => {
    const { owner, org } = await teamWithMember();
    const kit = await createKit(org.id, owner, "Brand");
    await expect(addAsset(kit.id, owner, { name: "x", hexes: ["nope"] })).rejects.toThrow();
  });

  it("members cannot edit or delete assets/kits; owners can", async () => {
    const { owner, member, org } = await teamWithMember();
    const kit = await createKit(org.id, owner, "Brand");
    const asset = await addAsset(kit.id, owner, { name: "Primary", hexes: ["#1d4ed8"] });
    await expect(updateAsset(asset.id, member, { name: "Hacked" })).rejects.toThrow();
    await expect(deleteKit(kit.id, member)).rejects.toThrow();

    await updateAsset(asset.id, owner, { name: "Brand blue", hexes: ["#2563eb", "#1e40af"] });
    const full = await getKit(org.id, kit.slug);
    expect(full!.assets[0].name).toBe("Brand blue");
    expect(full!.assets[0].type).toBe("palette");

    await deleteAsset(asset.id, owner);
    expect((await getKit(org.id, kit.slug))!.assets).toHaveLength(0);
  });

  it("renames and deletes a kit (cascading assets)", async () => {
    const { owner, org } = await teamWithMember();
    const kit = await createKit(org.id, owner, "Brand");
    await addAsset(kit.id, owner, { name: "Primary", hexes: ["#1d4ed8"] });
    await updateKit(kit.id, owner, { name: "Brand 2025" });
    expect((await getKit(org.id, kit.slug))!.name).toBe("Brand 2025");
    await deleteKit(kit.id, owner);
    expect(await listKits(org.id)).toHaveLength(0);
  });
});
