import { describe, expect, it } from "vitest";
import { ACTIVE_STATUSES, effectivePlan } from "../lib/billing";

describe("effectivePlan", () => {
  it("keeps the paid plan for active-like statuses", () => {
    expect(effectivePlan("active", "pro")).toBe("pro");
    expect(effectivePlan("trialing", "studio")).toBe("studio");
    expect(effectivePlan("past_due", "pro")).toBe("pro");
  });
  it("drops to free for terminal/non-active statuses", () => {
    expect(effectivePlan("canceled", "pro")).toBe("free");
    expect(effectivePlan("unpaid", "studio")).toBe("free");
    expect(effectivePlan("incomplete_expired", "pro")).toBe("free");
  });
  it("can never elevate a free price", () => {
    expect(effectivePlan("active", "free")).toBe("free");
  });
  it("exposes the active set used by the webhook", () => {
    expect(ACTIVE_STATUSES.has("active")).toBe(true);
    expect(ACTIVE_STATUSES.has("canceled")).toBe(false);
  });
});
