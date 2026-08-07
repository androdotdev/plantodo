import { parseHTML } from "linkedom";
import { basename } from "node:path";

/**
 * Extract the <title> from an HTML string.
 * Strips script/style blocks first to prevent their content from overriding <title>.
 * For Markdown source, the first `# heading` is the natural title.
 * Falls back to the file's basename if no title is found.
 * Titles are trimmed; internal whitespace is preserved (no dasherization).
 */
export function extractTitle(html: string, filePath: string): string {
  const mdHeading = html.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (mdHeading) return mdHeading;
  const cleaned = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  const { document } = parseHTML(cleaned);
  const title = document.querySelector("title")?.textContent?.trim();
  return title || basename(filePath);
}
