import { marked } from "marked"

// Valid post content types. `html` is the default; `markdown` is converted
// to HTML at write time so the stored `html` column always holds rendered
// HTML and the viewer path never changes.
export const POST_TYPES = ["html", "markdown"] as const
export type PostType = (typeof POST_TYPES)[number]

export function isPostType(value: unknown): value is PostType {
  return typeof value === "string" && (POST_TYPES as readonly string[]).includes(value)
}

// Convert markdown source to HTML. Non-markdown input passes through
// unchanged. `marked` emits raw HTML as-is — same trust model as direct HTML
// uploads (posts are share-links, arbitrary HTML is the product).
export function renderPostHtml(input: string, type: unknown): string {
  return type === "markdown" ? marked.parse(input, { async: false }) : input
}
