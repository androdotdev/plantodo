import { describe, it, expect } from "vitest";
import { extractTitle } from "./title.js";

describe("extractTitle", () => {
  it("extracts title from a simple HTML document", () => {
    const html = '<!DOCTYPE html><html><head><title>My Dashboard</title></head><body></body></html>';
    const result = extractTitle(html, "/tmp/test.html");
    expect(result).toBe("My Dashboard");
  });

  it("falls back to filename when no <title> exists", () => {
    const html = '<!DOCTYPE html><html><body><h1>Hello</h1></body></html>';
    const result = extractTitle(html, "/tmp/my-page.html");
    expect(result).toBe("my-page.html");
  });

  it("ignores <title> inside <script> or <style> blocks", () => {
    const html = `<!DOCTYPE html><html><head><script>const x = "<title>fake</title>";</script><style>.foo::before { content: '<title>also-fake</title>'; }</style><title>Real Title</title></head><body></body></html>`;
    const result = extractTitle(html, "/tmp/test.html");
    expect(result).toBe("Real Title");
  });

  it("keeps internal whitespace (no dasherization)", () => {
    const html = '<html><head><title>  My   Cool   Page  </title></head><body></body></html>';
    const result = extractTitle(html, "/tmp/test.html");
    expect(result).toBe("My   Cool   Page");
  });

  it("does not dasherize a markdown heading", () => {
    const md = "# My Title\n\nSome body text.";
    const result = extractTitle(md, "/tmp/README.md");
    expect(result).toBe("My Title");
  });

  it("handles empty HTML gracefully", () => {
    const result = extractTitle("", "/tmp/empty.html");
    expect(result).toBe("empty.html");
  });

  it("handles HTML with no head section", () => {
    const html = '<!DOCTYPE html><html><body>no head</body></html>';
    const result = extractTitle(html, "/tmp/plain.html");
    expect(result).toBe("plain.html");
  });

  it("trims trailing and leading whitespace from title", () => {
    const html = '<html><head><title>   Spaces   </title></head><body></body></html>';
    const result = extractTitle(html, "/tmp/test.html");
    expect(result).toBe("Spaces");
  });
});
