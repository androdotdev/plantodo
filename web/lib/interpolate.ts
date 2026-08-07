// Rendering contract (one source of truth — see SKILL.md "Rendering contract"):
//
//   1. Static fields — `{{path}}` placeholders are resolved SERVER-SIDE with
//      post data. Values are HTML-escaped (safe against XSS). A placeholder
//      with no matching value is left as the literal `{{path}}` text.
//   2. Dynamic content — the raw data object is injected as
//      `window.__PH_DATA` so post authors can read it from their own JS.
//
//   Both are ALWAYS applied to every served post; authors never "pick one".

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Resolve {{path}} placeholders (dot paths, e.g. {{a.b}}) with data values.
 *  `{{this}}` yields the whole data object as JSON. Path segments that are
 *  prototype-pollution keys resolve to undefined (defense in depth — the
 *  data comes from post authors, but a hostile value shouldn't reach Object
 *  prototype properties). Missing values stay as the literal placeholder. */
export function interpolate(
  html: string,
  data: Record<string, unknown>,
): string {
  return html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
    const val =
      path === "this"
        ? JSON.stringify(data)
        : path.split(".").reduce<unknown>((o, k) => {
            if (k === "__proto__" || k === "constructor" || k === "prototype") return undefined
            return o != null && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined
          }, data)
    return val != null ? escapeHtml(String(val)) : "{{" + path + "}}"
  })
}
