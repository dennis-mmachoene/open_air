import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { makeTestDb, resetDb, seedUser } from "./db";
import { createOrg, inviteMember, acceptInvite, updateMemberRole, removeMember, renameOrg } from "../../lib/orgs";
import { createKit } from "../../lib/brandkits";
import { proposeChange, approveProposal } from "../../lib/kitproposals";
import { writeOrgAudit, listOrgAudit, orgAuditActions, exportOrgAudit, auditToCSV } from "../../lib/org-audit";

let ctx: Awaited<ReturnType<typeof makeTestDb>>;
beforeAll(async () => { ctx = await makeTestDb(); });
afterAll(async () => { await ctx.client.close(); });
beforeEach(async () => { await resetDb(ctx.db); });

describe("org audit log", () => {
  it("records the membership lifecycle with actor labels", async () => {
    const owner = await seedUser(ctx.db, { plan: "pro", email: "owner@acme.dev" });
    const member = await seedUser(ctx.db, { email: "joiner@acme.dev" });
    const org = await createOrg(owner, "Acme");

    const inv = await inviteMember(org.id, owner, "joiner@acme.dev", "member");
    await acceptInvite(inv.token, member);
    await updateMemberRole(org.id, owner, member, "admin");
    await removeMember(org.id, owner, member);
    await renameOrg(org.id, owner, "Acme Studio");

    const actions = await listOrgAudit(org.id);
    const names = actions.map((a) => a.action);
    expect(names).toContain("member.invited");
    expect(names).toContain("member.joined");
    expect(names).toContain("member.role_changed");
    expect(names).toContain("member.removed");
    expect(names).toContain("org.renamed");
    // newest-first ordering
    expect(names[0]).toBe("org.renamed");
    // actor label is denormalized
    expect(actions.find((a) => a.action === "member.invited")!.actorLabel).toBe("owner@acme.dev");
  });

  it("records kit + proposal governance", async () => {
    const owner = await seedUser(ctx.db, { plan: "pro" });
    const member = await seedUser(ctx.db, { email: "m@acme.dev" });
    const org = await createOrg(owner, "Acme");
    const inv = await inviteMember(org.id, owner, "m@acme.dev");
    await acceptInvite(inv.token, member);
    const kit = await createKit(org.id, owner, "Brand");
    const p = await proposeChange(kit.id, member, { type: "add_asset", name: "Accent", hexes: ["#f59e0b"] });
    await approveProposal(p.id, owner);

    const names = (await listOrgAudit(org.id)).map((a) => a.action);
    expect(names).toContain("kit.created");
    expect(names).toContain("proposal.created");
    expect(names).toContain("proposal.approved");
  });

  it("filters by action and lists distinct actions", async () => {
    const owner = await seedUser(ctx.db, { plan: "pro" });
    const org = await createOrg(owner, "Acme");
    await inviteMember(org.id, owner, "a@x.dev");
    await inviteMember(org.id, owner, "b@x.dev");
    expect(await listOrgAudit(org.id, { action: "member.invited" })).toHaveLength(2);
    expect(await orgAuditActions(org.id)).toContain("member.invited");
  });

  it("is scoped per-org and exports to CSV", async () => {
    const owner = await seedUser(ctx.db, { plan: "pro" });
    const a = await createOrg(owner, "Acme");
    const b = await createOrg(owner, "Beta");
    await writeOrgAudit({ orgId: a.id, actorId: owner, action: "custom.event", metadata: { x: 1 } });
    expect(await listOrgAudit(b.id)).toHaveLength(0);
    const csv = auditToCSV(await exportOrgAudit(a.id));
    expect(csv.split("\n")[0]).toBe("timestamp,actor,action,target_type,target_id,metadata");
    expect(csv).toContain("custom.event");
  });
});
