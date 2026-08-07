import { marked } from "marked"

// Valid page content types. `html` is the default; `markdown` is converted
// to HTML at write time so the stored `html` column always holds rendered
// HTML and the viewer path never changes.
export const POST_TYPES = ["html", "markdown"] as const
export type PostType = (typeof POST_TYPES)[number]

export function isPostType(value: unknown): value is PostType {
  return typeof value === "string" && (POST_TYPES as readonly string[]).includes(value)
}

// Typography shell for markdown-derived pages. Hand-authored HTML posts
// carry their own <style> block; markdown posts get a full document here so
// they render with readable typography instead of the browser's bare
// defaults. Colors follow the app's Catppuccin Mocha palette (light default,
// dark via prefers-color-scheme).
function markdownShell(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Relay</title>
<style>
  :root { color-scheme: light dark; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
    max-width: 42rem;
    margin: 0 auto;
    padding: 2rem 1.25rem;
    line-height: 1.65;
    color: #1e1e2e;
  }
  h1, h2, h3, h4, h5, h6 { line-height: 1.25; margin: 1.5em 0 0.5em; }
  h1 { font-size: 1.9em; } h2 { font-size: 1.5em; } h3 { font-size: 1.25em; }
  p, ul, ol { margin: 0.75em 0; }
  pre { overflow-x: auto; padding: 1rem; border-radius: 6px; background: #eff1f5; }
  code { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: 0.9em; }
  pre code { background: none; padding: 0; }
  blockquote { margin: 1em 0; padding-left: 1em; border-left: 3px solid #ccc; color: #555; }
  img { max-width: 100%; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 0.4em 0.6em; text-align: left; }
  a { color: #8839ef; }
  @media (prefers-color-scheme: dark) {
    body { color: #cdd6f4; }
    pre { background: #181825; }
    blockquote { border-color: #45475a; color: #a6adc8; }
    th, td { border-color: #45475a; }
    a { color: #cba6f7; }
  }
</style>
</head>
<body>
${body}
</body>
</html>`
}

// Convert markdown source to a full HTML page. Non-markdown input passes
// through unchanged. `marked` emits raw HTML as-is — same trust model as
// direct HTML uploads (posts are share-links, arbitrary HTML is the product).
export function renderPageHtml(input: string, type: unknown): string {
  return type === "markdown" ? markdownShell(marked.parse(input, { async: false })) : input
}
