import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { makeTestDb, resetDb, seedUser } from "./db";
import { createOrg, inviteMember, acceptInvite, deleteOrg, getOrgBySlug } from "../../lib/orgs";
import { createKit, addAsset } from "../../lib/brandkits";
import { addDomain } from "../../lib/org-domains";
import { assembleOrgExport } from "../../lib/org-export";

let ctx: Awaited<ReturnType<typeof makeTestDb>>;
beforeAll(async () => { ctx = await makeTestDb(); });
afterAll(async () => { await ctx.client.close(); });
beforeEach(async () => { await resetDb(ctx.db); });

async function richTeam() {
  const owner = await seedUser(ctx.db, { plan: "pro", email: "owner@acme.dev" });
  const member = await seedUser(ctx.db, { email: "m@acme.dev" });
  const org = await createOrg(owner, "Acme");
  const inv = await inviteMember(org.id, owner, "m@acme.dev");
  await acceptInvite(inv.token, member);
  await inviteMember(org.id, owner, "pending@acme.dev");
  await addDomain(org.id, owner, "acme.com");
  const kit = await createKit(org.id, owner, "Brand");
  await addAsset(kit.id, owner, { name: "Primary", hexes: ["#1d4ed8"] });
  return { owner, member, org };
}

describe("assembleOrgExport", () => {
  it("captures org, members, invites, domains, kits, and audit", async () => {
    const { org } = await richTeam();
    const exp = (await assembleOrgExport(org.id))!;
    expect(exp.meta.format).toBe("open-air.org-export/v1");
    expect(exp.organization.name).toBe("Acme");
    expect(exp.members.map((m) => m.email).sort()).toEqual(["m@acme.dev", "owner@acme.dev"]);
    expect(exp.pendingInvites.map((i) => i.email)).toEqual(["pending@acme.dev"]);
    expect(exp.domains[0].domain).toBe("acme.com");
    expect(exp.brandKits[0].assets[0].name).toBe("Primary");
    expect(exp.auditLog.length).toBeGreaterThan(0);
  });
  it("returns null for an unknown org", async () => {
    expect(await assembleOrgExport("00000000-0000-0000-0000-000000000000")).toBeNull();
  });
});

describe("deleteOrg", () => {
  it("only the owner can delete; it cascades everything", async () => {
    const { owner, member, org } = await richTeam();
    await expect(deleteOrg(org.id, member)).rejects.toThrow();
    await deleteOrg(org.id, owner);
    expect(await getOrgBySlug(org.slug)).toBeNull();
    expect(await assembleOrgExport(org.id)).toBeNull();
  });
});
