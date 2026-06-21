import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { makeTestDb, resetDb, seedUser } from "./db";
import {
  publishPalette,
  getPublishedBySlug,
  listFeed,
  listByAuthor,
  toggleLike,
  hasLiked,
  updateProfile,
  getProfileByHandle,
  isValidHandle,
} from "../../lib/publish";

let ctx: Awaited<ReturnType<typeof makeTestDb>>;
beforeAll(async () => { ctx = await makeTestDb(); });
afterAll(async () => { await ctx.client.close(); });
beforeEach(async () => { await resetDb(ctx.db); });

const PAL = { name: "Tidewater", hexes: ["#0ea5e9", "#0369a1", "#082f49"], a11yScore: 88, harmony: "Analogous" };

describe("publishPalette", () => {
  it("publishes with a unique slug and sane defaults", async () => {
    const u = await seedUser(ctx.db, { plan: "pro" });
    const row = await publishPalette(u, PAL);
    expect(row.slug).toMatch(/^tidewater-/);
    expect(row.visibility).toBe("public");
    expect(row.license).toBe("all-rights-reserved");
    expect(row.likeCount).toBe(0);
  });
  it("rejects palettes with fewer than two valid colors", async () => {
    const u = await seedUser(ctx.db, { plan: "pro" });
    await expect(publishPalette(u, { name: "x", hexes: ["#000000"] })).rejects.toThrow();
  });
});

describe("feed & visibility", () => {
  it("the public feed shows public palettes but not unlisted/private", async () => {
    const u = await seedUser(ctx.db, { plan: "pro" });
    await publishPalette(u, { ...PAL, name: "Public one", visibility: "public" });
    await publishPalette(u, { ...PAL, name: "Unlisted one", visibility: "unlisted" });
    await publishPalette(u, { ...PAL, name: "Private one", visibility: "private" });
    const feed = await listFeed("new");
    const names = feed.map((f) => f.name);
    expect(names).toContain("Public one");
    expect(names).not.toContain("Unlisted one");
    expect(names).not.toContain("Private one");
  });
  it("unlisted is reachable by slug; author sees all their own", async () => {
    const u = await seedUser(ctx.db, { plan: "pro" });
    const unlisted = await publishPalette(u, { ...PAL, name: "Hidden", visibility: "unlisted" });
    expect(await getPublishedBySlug(unlisted.slug)).not.toBeNull();
    expect((await listByAuthor(u, u)).length).toBe(1);
    expect((await listByAuthor(u)).length).toBe(0); // others see only public
  });
});

describe("likes", () => {
  it("toggles a like and keeps the count in sync", async () => {
    const author = await seedUser(ctx.db, { plan: "pro" });
    const liker = await seedUser(ctx.db, { plan: "free" });
    const p = await publishPalette(author, PAL);
    const on = await toggleLike(liker, p.id);
    expect(on).toEqual({ liked: true, likeCount: 1 });
    expect(await hasLiked(liker, p.id)).toBe(true);
    const off = await toggleLike(liker, p.id);
    expect(off).toEqual({ liked: false, likeCount: 0 });
    const feedRow = (await getPublishedBySlug(p.slug))!;
    expect(feedRow.likeCount).toBe(0);
  });
});

describe("profiles", () => {
  it("validates handles", () => {
    expect(isValidHandle("dennis")).toBe(true);
    expect(isValidHandle("ab")).toBe(false); // min 3
    expect(isValidHandle("a")).toBe(false);
    expect(isValidHandle("has space")).toBe(false);
    expect(isValidHandle("-bad")).toBe(false);
  });
  it("sets a handle and rejects duplicates", async () => {
    const a = await seedUser(ctx.db, { plan: "pro" });
    const b = await seedUser(ctx.db, { plan: "pro" });
    await updateProfile(a, { handle: "studioa", bio: "Hi", website: "https://x.com" });
    const prof = await getProfileByHandle("studioa");
    expect(prof?.id).toBe(a);
    expect(prof?.bio).toBe("Hi");
    await expect(updateProfile(b, { handle: "studioa" })).rejects.toThrow(/taken/);
  });
});
