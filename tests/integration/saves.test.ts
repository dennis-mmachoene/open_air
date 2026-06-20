import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { makeTestDb, resetDb, seedPalette, seedUser } from "./db";
import { toggleSave, getSavedSlugs } from "../../lib/saves";

let ctx: Awaited<ReturnType<typeof makeTestDb>>;

beforeAll(async () => {
  ctx = await makeTestDb();
});
afterAll(async () => {
  await ctx.client.close();
});
beforeEach(async () => {
  await resetDb(ctx.db);
});

describe("toggleSave — free tier limit", () => {
  it("allows 5 saves then blocks the 6th", async () => {
    const user = await seedUser(ctx.db, { plan: "free" });
    for (let i = 0; i < 6; i++) await seedPalette(ctx.db, `p${i}`);

    for (let i = 0; i < 5; i++) {
      const r = await toggleSave(user, `p${i}`);
      expect(r.saved).toBe(true);
      expect(r.count).toBe(i + 1);
    }
    const blocked = await toggleSave(user, "p5");
    expect(blocked).toEqual({ saved: false, count: 5, limitReached: true });
    expect((await getSavedSlugs(user)).length).toBe(5);
  });

  it("freeing a slot lets a new save through", async () => {
    const user = await seedUser(ctx.db, { plan: "free" });
    for (let i = 0; i < 6; i++) await seedPalette(ctx.db, `p${i}`);
    for (let i = 0; i < 5; i++) await toggleSave(user, `p${i}`);

    const off = await toggleSave(user, "p0"); // unsave
    expect(off.saved).toBe(false);
    expect(off.count).toBe(4);

    const on = await toggleSave(user, "p5"); // now fits
    expect(on.saved).toBe(true);
    expect(on.count).toBe(5);
  });
});

describe("toggleSave — pro tier", () => {
  it("has no save limit", async () => {
    const user = await seedUser(ctx.db, { plan: "pro" });
    for (let i = 0; i < 8; i++) await seedPalette(ctx.db, `q${i}`);
    let last;
    for (let i = 0; i < 8; i++) last = await toggleSave(user, `q${i}`);
    expect(last).toEqual({ saved: true, count: 8 });
    expect((await getSavedSlugs(user)).length).toBe(8);
  });
});

describe("toggleSave — idempotent toggle", () => {
  it("saving twice toggles off", async () => {
    const user = await seedUser(ctx.db, { plan: "free" });
    await seedPalette(ctx.db, "x");
    expect((await toggleSave(user, "x")).saved).toBe(true);
    expect((await toggleSave(user, "x")).saved).toBe(false);
  });
  it("rejects unknown palettes", async () => {
    const user = await seedUser(ctx.db, { plan: "free" });
    await expect(toggleSave(user, "nope")).rejects.toThrow();
  });
});
