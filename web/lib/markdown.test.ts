import { describe, it, expect } from "vitest"
import { renderPostHtml, isPostType, POST_TYPES } from "./markdown"

describe("renderPostHtml", () => {
  it("passes HTML through unchanged", () => {
    const html = "<h1>Hi</h1><p>raw</p>"
    expect(renderPostHtml(html, "html")).toBe(html)
  })

  it("passes HTML through when type is undefined (legacy clients)", () => {
    const html = "<h1>Hi</h1>"
    expect(renderPostHtml(html, undefined)).toBe(html)
  })

  it("converts markdown to HTML", () => {
    const out = renderPostHtml("# Title\n\n**bold** text", "markdown")
    expect(out).toContain("<h1>Title</h1>")
    expect(out).toContain("<strong>bold</strong>")
  })

  it("preserves {{placeholder}} syntax through markdown conversion", () => {
    const out = renderPostHtml("# {{title}}\n\n{{stars}} stars", "markdown")
    expect(out).toContain("<h1>{{title}}</h1>")
    expect(out).toContain("{{stars}} stars")
  })

  it("converts markdown links and lists", () => {
    const out = renderPostHtml("- [a](https://x.com)\n- b", "markdown")
    expect(out).toContain("<a href=\"https://x.com\">a</a>")
    expect(out).toContain("<li>b</li>")
  })

  it("does not convert when type is not markdown", () => {
    expect(renderPostHtml("# not a heading", "html")).toBe("# not a heading")
    expect(renderPostHtml("# not a heading", undefined)).toBe("# not a heading")
  })
})

describe("isPostType", () => {
  it("accepts only the declared types", () => {
    for (const t of POST_TYPES) expect(isPostType(t)).toBe(true)
    expect(isPostType("pdf")).toBe(false)
    expect(isPostType(undefined)).toBe(false)
    expect(isPostType(42)).toBe(false)
    expect(isPostType("")).toBe(false)
  })
})
