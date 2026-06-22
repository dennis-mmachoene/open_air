import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { makeTestDb, resetDb, seedUser } from "./db";
import { createOrg, inviteMember, acceptInvite } from "../../lib/orgs";
import { createKit, addAsset } from "../../lib/brandkits";
import { rotateSyncToken, revokeSyncToken, kitTokensBySyncToken, kitTokens, setWebhookUrl, getSyncConfig } from "../../lib/sync/kit-sync";

let ctx: Awaited<ReturnType<typeof makeTestDb>>;
beforeAll(async () => { ctx = await makeTestDb(); });
afterAll(async () => { await ctx.client.close(); });
beforeEach(async () => { await resetDb(ctx.db); });

async function kitWithColors() {
  const owner = await seedUser(ctx.db, { plan: "pro" });
  const member = await seedUser(ctx.db, { email: "m@test.dev" });
  const org = await createOrg(owner, "Acme");
  const inv = await inviteMember(org.id, owner, "m@test.dev");
  await acceptInvite(inv.token, member);
  const kit = await createKit(org.id, owner, "Brand");
  await addAsset(kit.id, owner, { name: "Primary", hexes: ["#1d4ed8"] });
  await addAsset(kit.id, owner, { name: "Ramp", hexes: ["#1d4ed8", "#3b82f6", "#93c5fd"] });
  return { owner, member, org, kit };
}

describe("kit token flattening", () => {
  it("expands palettes into indexed tokens", async () => {
    const { kit } = await kitWithColors();
    const t = await kitTokens(kit.id);
    expect(t!.tokens.map((x) => x.name)).toEqual(["Primary", "Ramp-1", "Ramp-2", "Ramp-3"]);
  });
});

describe("sync token", () => {
  it("only admins can rotate; a valid token resolves the kit's tokens", async () => {
    const { owner, member, kit } = await kitWithColors();
    await expect(rotateSyncToken(kit.id, member)).rejects.toThrow();
    const token = await rotateSyncToken(kit.id, owner);
    expect(token).toMatch(/^oak_/);
    const resolved = await kitTokensBySyncToken(token);
    expect(resolved!.kitId).toBe(kit.id);
    expect(resolved!.tokens).toHaveLength(4);
  });
  it("rotating invalidates the old token; revoke disables sync", async () => {
    const { owner, kit } = await kitWithColors();
    const t1 = await rotateSyncToken(kit.id, owner);
    const t2 = await rotateSyncToken(kit.id, owner);
    expect(t2).not.toBe(t1);
    expect(await kitTokensBySyncToken(t1)).toBeNull();
    expect(await kitTokensBySyncToken(t2)).not.toBeNull();
    await revokeSyncToken(kit.id, owner);
    expect(await kitTokensBySyncToken(t2)).toBeNull();
  });
  it("an unknown token resolves to null", async () => {
    expect(await kitTokensBySyncToken("oak_nope")).toBeNull();
  });
});

describe("webhook config", () => {
  it("stores an https url and rejects non-https; members can't set it", async () => {
    const { owner, member, kit } = await kitWithColors();
    await expect(setWebhookUrl(kit.id, member, "https://x.dev/hook")).rejects.toThrow();
    await expect(setWebhookUrl(kit.id, owner, "http://insecure.dev")).rejects.toThrow();
    await setWebhookUrl(kit.id, owner, "https://ci.example.com/hook");
    expect((await getSyncConfig(kit.id)).webhookUrl).toBe("https://ci.example.com/hook");
  });
});
