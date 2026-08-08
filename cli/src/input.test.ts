import { describe, it, expect } from "vitest";
import { dedupePaste, KEY_SHAPE, escapeStep } from "./input.js";

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
    expect(keepOnly("post_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789ab")).toBe(
      "post_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789ab",
    );
  });
});

describe("dedupePaste", () => {
  it("leaves a normal key untouched", () => {
    const key = "post_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789ab";
    expect(dedupePaste(key)).toBe(key);
  });

  it("collapses a doubled paste", () => {
    const key = "post_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789ab";
    expect(dedupePaste(key + key)).toBe(key);
  });

  it("collapses a tripled paste", () => {
    const key = "post_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789ab";
    expect(dedupePaste(key.repeat(3))).toBe(key);
  });

  it("does not collapse a near-repetition", () => {
    const key = "post_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789ab";
    expect(dedupePaste(key + key.slice(0, -1))).toBe(key + key.slice(0, -1));
  });

  it("leaves short and empty strings alone", () => {
    expect(dedupePaste("")).toBe("");
    expect(dedupePaste("a")).toBe("a");
    expect(dedupePaste("abab")).toBe("ab"); // exact 2-fold repetition of "ab"
  });
});

describe("KEY_SHAPE", () => {
  it("accepts post_, ptd_ and mcp_ keys", () => {
    expect(KEY_SHAPE.test("post_" + "a".repeat(39))).toBe(true);
    expect(KEY_SHAPE.test("ptd_" + "a".repeat(39))).toBe(true);
    expect(KEY_SHAPE.test("mcp_" + "a".repeat(39))).toBe(true);
  });

  it("rejects garbage lengths and prefixes", () => {
    expect(KEY_SHAPE.test("post_ab")).toBe(false);
    expect(KEY_SHAPE.test("key_" + "a".repeat(39))).toBe(false);
    expect(KEY_SHAPE.test("a".repeat(60))).toBe(false);
    expect(KEY_SHAPE.test("")).toBe(false);
  });
});
