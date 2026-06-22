import { describe, expect, it } from "vitest";
import { base32Encode, base32Decode, totpCode, verifyTotp, generateTotpSecret, generateBackupCodes } from "../lib/platform/totp";

// RFC 6238 SHA1 test seed ("12345678901234567890") in base32.
const SEED = base32Encode(Buffer.from("12345678901234567890"));

describe("base32", () => {
  it("round-trips bytes", () => {
    expect(base32Encode(Buffer.from("12345678901234567890"))).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    expect(base32Decode(SEED).toString()).toBe("12345678901234567890");
  });
});

describe("TOTP (RFC 6238 vectors)", () => {
  const vectors: [number, string][] = [
    [59, "287082"],
    [1111111109, "081804"],
    [1111111111, "050471"],
    [1234567890, "005924"],
    [2000000000, "279037"],
  ];
  for (const [t, code] of vectors) {
    it(`T=${t} → ${code}`, () => {
      expect(totpCode(SEED, t * 1000)).toBe(code);
    });
  }
});

describe("verifyTotp", () => {
  it("accepts the current code and rejects a wrong one", () => {
    const now = 1234567890 * 1000;
    expect(verifyTotp(SEED, "005924", now)).toBe(true);
    expect(verifyTotp(SEED, "000000", now)).toBe(false);
    expect(verifyTotp(SEED, "abc", now)).toBe(false);
  });
  it("tolerates ±1 step of drift", () => {
    const base = 1234567890 * 1000;
    expect(verifyTotp(SEED, totpCode(SEED, base - 30000), base, 1)).toBe(true);
    expect(verifyTotp(SEED, totpCode(SEED, base + 30000), base, 1)).toBe(true);
    expect(verifyTotp(SEED, totpCode(SEED, base + 90000), base, 1)).toBe(false);
  });
});

describe("generators", () => {
  it("makes a decodable secret and unique backup codes", () => {
    const secret = generateTotpSecret();
    expect(secret.length).toBeGreaterThanOrEqual(32);
    expect(base32Decode(secret).length).toBe(20);
    const codes = generateBackupCodes(10);
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    expect(codes[0]).toMatch(/^[0-9a-f]{4}-[0-9a-f]{4}$/);
  });
});
