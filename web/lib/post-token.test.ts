import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { signToken, verifyToken } from "@/lib/post-token";

describe("post-token", () => {
  beforeEach(() => {
    process.env.POST_TOKEN_SECRET = "test-secret-that-is-at-least-32-chars!!";
  });

  afterEach(() => {
    delete process.env.POST_TOKEN_SECRET;
  });

  it("signs and verifies a valid token", () => {
    const token = signToken("post-123", "user-456");
    expect(token).toBeTruthy();
    expect(token).toContain(".");

    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.postId).toBe("post-123");
    expect(payload!.userId).toBe("user-456");
    expect(payload!.iat).toBeGreaterThan(0);
    expect(payload!.exp).toBeGreaterThan(payload!.iat);
  });

  it("returns null for tampered token (payload changed)", () => {
    const token = signToken("post-123", "user-456");
    const parts = token.split(".");

    // Base64url-decode the payload, modify it, re-encode
    const decoded = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    decoded.userId = "user-attacker";
    const tamperedPayload = Buffer.from(JSON.stringify(decoded)).toString("base64url");

    const tamperedToken = `${tamperedPayload}.${parts[1]}`;
    expect(verifyToken(tamperedToken)).toBeNull();
  });

  it("returns null for tampered token (signature changed)", () => {
    const token = signToken("post-123", "user-456");
    const parts = token.split(".");
    const badToken = `${parts[0]}.invalidsignature`;
    expect(verifyToken(badToken)).toBeNull();
  });

  it("returns null for malformed token", () => {
    expect(verifyToken("not-a-dot")).toBeNull();
    expect(verifyToken("")).toBeNull();
    expect(verifyToken("a.b.c")).toBeNull();
  });

  it("rejects expired tokens", async () => {
    // Sign a token, then modify the payload to have an expired timestamp
    const token = signToken("post-123", "user-456");
    const parts = token.split(".");
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    payload.exp = Date.now() - 1000; // expired 1 second ago

    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const { createHmac } = await import("node:crypto");
    const sig = createHmac("sha256", "test-secret-that-is-at-least-32-chars!!")
      .update(encoded)
      .digest("base64url");

    const expiredToken = `${encoded}.${sig}`;
    expect(verifyToken(expiredToken)).toBeNull();
  });
});
