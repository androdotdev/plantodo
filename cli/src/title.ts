import { parseHTML } from "linkedom";
import { basename } from "node:path";

/**
 * Extract the <title> from an HTML string.
 * Strips script/style blocks first to prevent their content from overriding <title>.
 * Falls back to the file's basename if no <title> is found.
 */
export function extractTitle(html: string, filePath: string): string {
  const cleaned = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  const { document } = parseHTML(cleaned);
  const title = document.querySelector("title")?.textContent?.trim();
  return (title || basename(filePath)).replace(/\s+/g, "-");
}
