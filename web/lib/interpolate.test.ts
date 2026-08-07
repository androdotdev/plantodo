import { describe, it, expect } from "vitest"
import { interpolate, escapeHtml } from "./interpolate"

describe("interpolate", () => {
  it("replaces a simple placeholder with an escaped value", () => {
    expect(interpolate("<h1>{{title}}</h1>", { title: "Cardfoi" })).toBe("<h1>Cardfoi</h1>")
  })

  it("HTML-escapes values (XSS-safe)", () => {
    expect(interpolate("<p>{{x}}</p>", { x: "<script>alert(1)</script>" }))
      .toBe("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>")
    expect(interpolate("<p>{{x}}</p>", { x: 'say "hi" & bye' }))
      .toBe("<p>say &quot;hi&quot; &amp; bye</p>")
  })

  it("resolves dot paths into nested data", () => {
    expect(interpolate("{{user.name}}", { user: { name: "Ana" } })).toBe("Ana")
  })

  it("keeps the literal placeholder when the value is missing", () => {
    expect(interpolate("<p>{{nope}}</p>", {})).toBe("<p>{{nope}}</p>")
    expect(interpolate("<p>{{a.b}}</p>", { a: {} })).toBe("<p>{{a.b}}</p>")
  })

  it("does not resolve prototype-pollution paths", () => {
    expect(interpolate("{{__proto__}}", {})).toBe("{{__proto__}}")
    expect(interpolate("{{constructor}}", {})).toBe("{{constructor}}")
    expect(interpolate("{{a.constructor}}", { a: {} })).toBe("{{a.constructor}}")
  })

  it("treats {{this}} as the whole data object as JSON", () => {
    expect(interpolate("{{this}}", { a: 1, s: "x" })).toBe("{&quot;a&quot;:1,&quot;s&quot;:&quot;x&quot;}")
  })

  it("handles whitespace inside braces", () => {
    expect(interpolate("<p>{{ title }}</p>", { title: "x" })).toBe("<p>x</p>")
  })

  it("leaves non-placeholder text untouched", () => {
    expect(interpolate("<p>plain {x} and {{}}</p>", {})).toBe("<p>plain {x} and {{}}</p>")
  })

  it("renders numeric and boolean values as strings", () => {
    expect(interpolate("{{stars}} {{on}}", { stars: 42, on: true })).toBe("42 true")
  })
})

describe("escapeHtml", () => {
  it("escapes the five HTML-sensitive characters", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;")
  })
})
