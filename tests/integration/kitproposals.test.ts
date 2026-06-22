import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { makeTestDb, resetDb, seedUser } from "./db";
import { createOrg, inviteMember, acceptInvite } from "../../lib/orgs";
import { createKit, getKit, addAsset } from "../../lib/brandkits";
import {
  proposeChange,
  listProposals,
  approveProposal,
  rejectProposal,
  pendingCountByKit,
} from "../../lib/kitproposals";

let ctx: Awaited<ReturnType<typeof makeTestDb>>;
beforeAll(async () => { ctx = await makeTestDb(); });
afterAll(async () => { await ctx.client.close(); });
beforeEach(async () => { await resetDb(ctx.db); });

async function team() {
  const owner = await seedUser(ctx.db, { plan: "pro" });
  const member = await seedUser(ctx.db);
  const org = await createOrg(owner, "Acme");
  const inv = await inviteMember(org.id, owner, "m@test.dev");
  await acceptInvite(inv.token, member);
  const kit = await createKit(org.id, owner, "Brand");
  return { owner, member, org, kit };
}

describe("propose → approve", () => {
  it("a member proposes an addition; approval applies it to the kit", async () => {
    const { owner, member, org, kit } = await team();
    const p = await proposeChange(kit.id, member, { type: "add_asset", name: "Accent", hexes: ["#f59e0b"], note: "brand pop" });
    expect(p.status).toBe("pending");
    expect((await getKit(org.id, kit.slug))!.assets).toHaveLength(0); // not applied yet
    expect(await pendingCountByKit([kit.id])).toEqual({ [kit.id]: 1 });

    await approveProposal(p.id, owner);
    const kitNow = await getKit(org.id, kit.slug);
    expect(kitNow!.assets.map((a) => a.name)).toEqual(["Accent"]);
    expect((await listProposals(kit.id, "approved"))).toHaveLength(1);
    expect(await pendingCountByKit([kit.id])).toEqual({});
  });

  it("approves an update and a delete proposal", async () => {
    const { owner, member, org, kit } = await team();
    const asset = await addAsset(kit.id, owner, { name: "Primary", hexes: ["#1d4ed8"] });
    const up = await proposeChange(kit.id, member, { type: "update_asset", targetAssetId: asset.id, name: "Brand blue", hexes: ["#2563eb", "#1e40af"] });
    await approveProposal(up.id, owner);
    let kitNow = await getKit(org.id, kit.slug);
    expect(kitNow!.assets[0].name).toBe("Brand blue");
    expect(kitNow!.assets[0].type).toBe("palette");

    const del = await proposeChange(kit.id, member, { type: "delete_asset", targetAssetId: asset.id });
    await approveProposal(del.id, owner);
    kitNow = await getKit(org.id, kit.slug);
    expect(kitNow!.assets).toHaveLength(0);
  });
});

describe("guards", () => {
  it("rejection records the reviewer and does not apply", async () => {
    const { owner, member, org, kit } = await team();
    const p = await proposeChange(kit.id, member, { type: "add_asset", name: "Accent", hexes: ["#f59e0b"] });
    await rejectProposal(p.id, owner, "off-brand");
    const rejected = (await listProposals(kit.id, "rejected"))[0];
    expect(rejected.reviewedBy).toBe(owner);
    expect(rejected.reviewNote).toBe("off-brand");
    expect((await getKit(org.id, kit.slug))!.assets).toHaveLength(0);
  });

  it("members cannot approve or reject", async () => {
    const { owner, member, kit } = await team();
    const p = await proposeChange(kit.id, member, { type: "add_asset", name: "Accent", hexes: ["#f59e0b"] });
    await expect(approveProposal(p.id, member)).rejects.toThrow();
    await expect(rejectProposal(p.id, member)).rejects.toThrow();
    void owner;
  });

  it("a non-member cannot propose; double review is blocked", async () => {
    const { owner, member, kit } = await team();
    const stranger = await seedUser(ctx.db);
    await expect(proposeChange(kit.id, stranger, { type: "add_asset", name: "x", hexes: ["#000000"] })).rejects.toThrow();
    const p = await proposeChange(kit.id, member, { type: "add_asset", name: "Accent", hexes: ["#f59e0b"] });
    await approveProposal(p.id, owner);
    await expect(approveProposal(p.id, owner)).rejects.toThrow();
    await expect(rejectProposal(p.id, owner)).rejects.toThrow();
  });

  it("validates proposal payloads", async () => {
    const { member, kit } = await team();
    await expect(proposeChange(kit.id, member, { type: "add_asset", name: "", hexes: ["#f59e0b"] })).rejects.toThrow();
    await expect(proposeChange(kit.id, member, { type: "add_asset", name: "x", hexes: ["nope"] })).rejects.toThrow();
    await expect(proposeChange(kit.id, member, { type: "delete_asset" })).rejects.toThrow();
  });
});
