import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { makeTestDb, resetDb, seedUser } from "./db";
import {
  createOrg,
  getOrgBySlug,
  listOrgsForUser,
  getMembership,
  requireRole,
  listMembers,
  inviteMember,
  listInvites,
  getInviteByToken,
  acceptInvite,
  revokeInvite,
  updateMemberRole,
  removeMember,
  renameOrg,
  ownerSeatLimit,
  seatUsage,
} from "../../lib/orgs";

let ctx: Awaited<ReturnType<typeof makeTestDb>>;
beforeAll(async () => { ctx = await makeTestDb(); });
afterAll(async () => { await ctx.client.close(); });
beforeEach(async () => { await resetDb(ctx.db); });

describe("createOrg", () => {
  it("creates an org and seats the creator as owner", async () => {
    const u = await seedUser(ctx.db, { plan: "pro" });
    const org = await createOrg(u, "Acme Design");
    expect(org.slug).toMatch(/^acme-design-/);
    expect(org.ownerId).toBe(u);
    expect(await getMembership(org.id, u)).toBe("owner");
    expect(await getOrgBySlug(org.slug)).not.toBeNull();
    const mine = await listOrgsForUser(u);
    expect(mine).toHaveLength(1);
    expect(mine[0].role).toBe("owner");
    expect(mine[0].memberCount).toBe(1);
  });
  it("rejects too-short names", async () => {
    const u = await seedUser(ctx.db, { plan: "pro" });
    await expect(createOrg(u, "A")).rejects.toThrow();
  });
});

describe("invites", () => {
  it("invites by email and seats the user on accept", async () => {
    const owner = await seedUser(ctx.db, { plan: "pro" });
    const invitee = await seedUser(ctx.db, { email: "joiner@test.dev" });
    const org = await createOrg(owner, "Acme");
    const invite = await inviteMember(org.id, owner, "joiner@test.dev", "admin");
    expect(invite.role).toBe("admin");
    expect((await listInvites(org.id))).toHaveLength(1);
    expect(await getInviteByToken(invite.token)).not.toBeNull();

    const { orgSlug } = await acceptInvite(invite.token, invitee);
    expect(orgSlug).toBe(org.slug);
    expect(await getMembership(org.id, invitee)).toBe("admin");
    expect(await listMembers(org.id)).toHaveLength(2);
    expect(await listInvites(org.id)).toHaveLength(0); // no longer pending
  });
  it("members cannot invite; admins can", async () => {
    const owner = await seedUser(ctx.db, { plan: "pro" });
    const member = await seedUser(ctx.db);
    const org = await createOrg(owner, "Acme");
    const inv = await inviteMember(org.id, owner, "m@test.dev", "member");
    await acceptInvite(inv.token, member);
    await expect(inviteMember(org.id, member, "x@test.dev")).rejects.toThrow();
  });
  it("a used invite can't be reused; revoked invites can't be accepted", async () => {
    const owner = await seedUser(ctx.db, { plan: "pro" });
    const a = await seedUser(ctx.db);
    const org = await createOrg(owner, "Acme");
    const inv = await inviteMember(org.id, owner, "a@test.dev");
    await acceptInvite(inv.token, a);
    await expect(acceptInvite(inv.token, a)).rejects.toThrow();

    const inv2 = await inviteMember(org.id, owner, "b@test.dev");
    await revokeInvite(org.id, owner, inv2.id);
    const b = await seedUser(ctx.db);
    await expect(acceptInvite(inv2.token, b)).rejects.toThrow();
  });
});

describe("roles & removal", () => {
  it("owner can promote; protects the last owner", async () => {
    const owner = await seedUser(ctx.db, { plan: "pro" });
    const member = await seedUser(ctx.db);
    const org = await createOrg(owner, "Acme");
    const inv = await inviteMember(org.id, owner, "m@test.dev");
    await acceptInvite(inv.token, member);

    await updateMemberRole(org.id, owner, member, "owner");
    expect(await getMembership(org.id, member)).toBe("owner");
    // now demote the original owner -> allowed (two owners)
    await updateMemberRole(org.id, member, owner, "member");
    expect(await getMembership(org.id, owner)).toBe("member");
    // demoting the sole remaining owner is blocked
    await expect(updateMemberRole(org.id, member, member, "member")).rejects.toThrow();
  });
  it("admins can't remove owners; removing the last owner is blocked", async () => {
    const owner = await seedUser(ctx.db, { plan: "pro" });
    const admin = await seedUser(ctx.db);
    const org = await createOrg(owner, "Acme");
    const inv = await inviteMember(org.id, owner, "a@test.dev", "admin");
    await acceptInvite(inv.token, admin);
    await expect(removeMember(org.id, admin, owner)).rejects.toThrow();
    await expect(removeMember(org.id, owner, owner)).rejects.toThrow(); // last owner
    await removeMember(org.id, owner, admin);
    expect(await getMembership(org.id, admin)).toBeNull();
  });
  it("requireRole enforces the privilege floor", async () => {
    const owner = await seedUser(ctx.db, { plan: "pro" });
    const org = await createOrg(owner, "Acme");
    await expect(requireRole(org.id, owner, "owner")).resolves.toBe("owner");
    const stranger = await seedUser(ctx.db);
    await expect(requireRole(org.id, stranger, "member")).rejects.toThrow();
  });
  it("renames the org with admin rights", async () => {
    const owner = await seedUser(ctx.db, { plan: "pro" });
    const org = await createOrg(owner, "Acme");
    await renameOrg(org.id, owner, "Acme Studio");
    expect((await getOrgBySlug(org.slug))!.name).toBe("Acme Studio");
  });
});


describe("plan gating & seats", () => {
  it("a free user cannot create a team", async () => {
    const free = await seedUser(ctx.db); // defaults to free
    await expect(createOrg(free, "Freebie")).rejects.toThrow();
  });
  it("derives the seat cap from the owner's plan and blocks over-invite", async () => {
    const owner = await seedUser(ctx.db, { plan: "pro" }); // 5 seats
    const org = await createOrg(owner, "Acme");
    expect(await ownerSeatLimit(org.id)).toBe(5);
    expect(await seatUsage(org.id)).toBe(1); // the owner
    // fill the remaining 4 seats with pending invites
    for (let i = 0; i < 4; i++) await inviteMember(org.id, owner, `seat${i}@test.dev`);
    expect(await seatUsage(org.id)).toBe(5);
    await expect(inviteMember(org.id, owner, "one-too-many@test.dev")).rejects.toThrow(/seat limit/);
  });
  it("studio owners get more seats", async () => {
    const owner = await seedUser(ctx.db, { plan: "studio" });
    const org = await createOrg(owner, "BigCo");
    expect(await ownerSeatLimit(org.id)).toBe(25);
  });
});
