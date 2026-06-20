import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { makeTestDb, resetDb, seedUser } from "./db";
import { getEntitlements } from "../../lib/entitlements";

let ctx: Awaited<ReturnType<typeof makeTestDb>>;
beforeAll(async () => { ctx = await makeTestDb(); });
afterAll(async () => { await ctx.client.close(); });
beforeEach(async () => { await resetDb(ctx.db); });

describe("getEntitlements (server-derived from users.plan)", () => {
  it("free is limited and locked out of Pro features + API", async () => {
    const id = await seedUser(ctx.db, { plan: "free" });
    const e = await getEntitlements(id);
    expect(e.plan).toBe("free");
    expect(e.savedLimit).toBe(5);
    expect(e.fullShowroom).toBe(false);
    expect(e.api).toBe(false);
  });

  it("pro unlocks the tools and the API", async () => {
    const id = await seedUser(ctx.db, { plan: "pro" });
    const e = await getEntitlements(id);
    expect(e.plan).toBe("pro");
    expect(e.savedLimit).toBeNull();
    expect(e.fullShowroom).toBe(true);
    expect(e.allExports).toBe(true);
    expect(e.api).toBe(true);
  });
});
