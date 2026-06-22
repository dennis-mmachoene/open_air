import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { makeTestDb, resetDb, seedUser } from "./db";
import { createOrg } from "../../lib/orgs";
import {
  addDomain, listDomains, verifyDomain, setDomainAutoJoin, removeDomain,
  provisionMembershipsForEmail, isClaimableDomain, emailDomain, normalizeDomain,
} from "../../lib/org-domains";
import { getMembership } from "../../lib/orgs";
import { listOrgAudit } from "../../lib/org-audit";

let ctx: Awaited<ReturnType<typeof makeTestDb>>;
beforeAll(async () => { ctx = await makeTestDb(); });
afterAll(async () => { await ctx.client.close(); });
beforeEach(async () => { await resetDb(ctx.db); });

describe("domain helpers", () => {
  it("normalizes and validates domains", () => {
    expect(normalizeDomain("@Acme.COM")).toBe("acme.com");
    expect(normalizeDomain("https://acme.com/x")).toBe("acme.com");
    expect(emailDomain("jo@acme.com")).toBe("acme.com");
    expect(isClaimableDomain("acme.com")).toBe(true);
    expect(isClaimableDomain("gmail.com")).toBe(false); // public provider
    expect(isClaimableDomain("notadomain")).toBe(false);
  });
});

describe("claiming & verifying", () => {
  it("admins can claim a domain; members can't; duplicates rejected", async () => {
    const owner = await seedUser(ctx.db, { plan: "pro" });
    const org = await createOrg(owner, "Acme");
    const d = await addDomain(org.id, owner, "@Acme.com");
    expect(d.domain).toBe("acme.com");
    expect(d.verified).toBe(false);
    expect(d.verificationToken).toMatch(/^open-air-verify=/);
    expect(await listDomains(org.id)).toHaveLength(1);
    await expect(addDomain(org.id, owner, "acme.com")).rejects.toThrow(); // dup
    await expect(addDomain(org.id, owner, "gmail.com")).rejects.toThrow(); // public

    const other = await createOrg(await seedUser(ctx.db, { plan: "pro" }), "Beta");
    await expect(addDomain(other.id, (await seedUser(ctx.db, { plan: "pro" })), "acme.com")).rejects.toThrow(); // claimed elsewhere + not a member
  });
});

describe("JIT provisioning", () => {
  it("auto-joins users with a matching verified, auto-join domain", async () => {
    const owner = await seedUser(ctx.db, { plan: "pro" });
    const org = await createOrg(owner, "Acme");
    const d = await addDomain(org.id, owner, "acme.com");

    const newcomer = await seedUser(ctx.db, { email: "rookie@acme.com" });
    // Not verified yet → no join
    expect(await provisionMembershipsForEmail(newcomer, "rookie@acme.com")).toEqual([]);
    expect(await getMembership(org.id, newcomer)).toBeNull();

    await verifyDomain(d.id, owner);
    const joined = await provisionMembershipsForEmail(newcomer, "rookie@acme.com");
    expect(joined).toEqual([org.slug]);
    expect(await getMembership(org.id, newcomer)).toBe("member");
    // idempotent
    expect(await provisionMembershipsForEmail(newcomer, "rookie@acme.com")).toEqual([]);
    // audit recorded a domain join
    const names = (await listOrgAudit(org.id)).map((a) => a.action);
    expect(names).toContain("member.joined");
    expect(names).toContain("domain.verified");
  });

  it("ignores non-matching domains, public emails, and auto-join-off domains", async () => {
    const owner = await seedUser(ctx.db, { plan: "pro" });
    const org = await createOrg(owner, "Acme");
    const d = await addDomain(org.id, owner, "acme.com");
    await verifyDomain(d.id, owner);

    const stranger = await seedUser(ctx.db, { email: "x@other.com" });
    expect(await provisionMembershipsForEmail(stranger, "x@other.com")).toEqual([]);
    const gmailer = await seedUser(ctx.db, { email: "y@gmail.com" });
    expect(await provisionMembershipsForEmail(gmailer, "y@gmail.com")).toEqual([]);

    await setDomainAutoJoin(d.id, owner, false);
    const blocked = await seedUser(ctx.db, { email: "z@acme.com" });
    expect(await provisionMembershipsForEmail(blocked, "z@acme.com")).toEqual([]);
    expect(await getMembership(org.id, blocked)).toBeNull();
  });

  it("removing a domain stops provisioning", async () => {
    const owner = await seedUser(ctx.db, { plan: "pro" });
    const org = await createOrg(owner, "Acme");
    const d = await addDomain(org.id, owner, "acme.com");
    await verifyDomain(d.id, owner);
    await removeDomain(d.id, owner);
    const u = await seedUser(ctx.db, { email: "a@acme.com" });
    expect(await provisionMembershipsForEmail(u, "a@acme.com")).toEqual([]);
  });
});
