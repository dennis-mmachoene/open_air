import { describe, expect, it } from "vitest";

// Mirrors the route's payload caps. If these change, update the route too.
const MAX_MESSAGE_CHARS = 2000;
const MAX_TURN_CHARS = 1000;

function capMessage(s: string): string {
  return s.trim().slice(0, MAX_MESSAGE_CHARS);
}
function capHistory(turns: { role: string; text: string }[]) {
  return turns.slice(-10).map((t) => ({ role: t.role, text: t.text.slice(0, MAX_TURN_CHARS) }));
}

describe("assistant payload caps", () => {
  it("truncates an oversized message", () => {
    expect(capMessage("x".repeat(5000)).length).toBe(MAX_MESSAGE_CHARS);
  });
  it("keeps a normal message intact", () => {
    expect(capMessage("  calm fintech  ")).toBe("calm fintech");
  });
  it("limits history to last 10 turns and caps each turn", () => {
    const turns = Array.from({ length: 20 }, (_, i) => ({ role: "user", text: "y".repeat(3000) + i }));
    const capped = capHistory(turns);
    expect(capped.length).toBe(10);
    expect(capped[0].text.length).toBe(MAX_TURN_CHARS);
  });
});
