import { describe, it, expect } from "vitest";
import { dedupePaste, KEY_SHAPE, escapeStep } from "./input.js";

/** A realistic relay key: post_ + 64-char body (verified against prod). */
const key = "post_" + "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abCdEfGhIjKlMnOpQrStUvWxYz0123456789ab";

/** Walk a byte stream through the escape state machine; returns the kept chars. */
function keepOnly(chars: string): string {
  let out = ""
  let inEscape = false
  for (const ch of chars) {
    if (inEscape) {
      inEscape = escapeStep(ch, true)
      continue
    }
    if (ch === "\x1b") {
      inEscape = true
      continue
    }
    out += ch
  }
  return out
}

describe("escapeStep", () => {
  it("swallows arrow-key sequences arriving in one chunk", () => {
    expect(keepOnly("post_AbC\x1b[CdEfG")).toBe("post_AbCdEfG");
  });

  it("swallows sequences split across chunks (ESC | [ | C)", () => {
    expect(keepOnly("post_" + "\x1b" + "[" + "C" + "AbC")).toBe("post_AbC");
  });

  it("swallows Home/End/Delete and function keys", () => {
    expect(keepOnly("\x1b[H\x1b[F\x1b[3~\x1b[5~abc")).toBe("abc");
  });

  it("keeps normal input untouched", () => {
    expect(keepOnly(key)).toBe(key);
  });
});

describe("dedupePaste", () => {
  it("leaves a normal key untouched", () => {
    expect(dedupePaste(key)).toBe(key);
  });

  it("collapses a doubled paste", () => {
    expect(dedupePaste(key + key)).toBe(key);
  });

  it("collapses a tripled paste", () => {
    expect(dedupePaste(key.repeat(3))).toBe(key);
  });

  it("does not collapse a near-repetition", () => {
    expect(dedupePaste(key + key.slice(0, -1))).toBe(key + key.slice(0, -1));
  });

  it("leaves short and empty strings alone", () => {
    expect(dedupePaste("")).toBe("");
    expect(dedupePaste("a")).toBe("a");
    expect(dedupePaste("abab")).toBe("ab"); // exact 2-fold repetition of "ab"
  });
});

describe("KEY_SHAPE", () => {
  it("accepts real post_, ptd_ and mcp_ keys", () => {
    expect(KEY_SHAPE.test("post_" + "a".repeat(64))).toBe(true);
    expect(KEY_SHAPE.test("ptd_" + "a".repeat(64))).toBe(true);
    expect(KEY_SHAPE.test("mcp_" + "a".repeat(64))).toBe(true);
  });

  it("accepts the user's verified prod key", () => {
    expect(KEY_SHAPE.test("post_YNWYSydVvdSSaCzRPxfYePYgQYYikoIOnlnIKVMnLlMzQrnKRRLZlctBcZbXKhLK")).toBe(true);
  });

  it("rejects garbage lengths, prefixes, and doubled pastes", () => {
    expect(KEY_SHAPE.test("post_ab")).toBe(false);
    expect(KEY_SHAPE.test("key_" + "a".repeat(64))).toBe(false);
    expect(KEY_SHAPE.test("a".repeat(60))).toBe(false);
    expect(KEY_SHAPE.test("")).toBe(false);
    expect(KEY_SHAPE.test("post_" + "a".repeat(64) + "post_" + "a".repeat(64))).toBe(false); // doubled paste
  });
});
