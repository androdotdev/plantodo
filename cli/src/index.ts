import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { Command } from "commander";

import { loadConfig, saveConfig } from "./config.js";

function extractTitle(html: string, filePath: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() || basename(filePath);
}

const config = loadConfig();
const API_KEY = process.env.PTD_API_KEY ?? process.env.PLANTODO_API_KEY ?? config?.api_key ?? "";
const BASE_URL = (process.env.PTD_URL ?? "https://posthtml.vercel.app").replace(/\/+$/, "");

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
  });
  const body = await res.json();
  if (!res.ok) {
    console.error(
      `Error ${res.status}:`,
      body.error ?? body.message ?? JSON.stringify(body),
    );
    process.exit(1);
  }
  return body;
}

const program = new Command()
  .name("ptd")
  .description("PostHTML CLI — upload, list, delete, and replace plans")
  .version("0.1.0");

program
  .command("upload <file>")
  .description("Upload an HTML plan file")
  .action(async (file: string) => {
    const html = readFileSync(resolve(file), "utf-8");
    const result = await api("/api/plans", {
      method: "POST",
      body: JSON.stringify({ html, title: extractTitle(html, file) }),
    });
    console.log(result.url);
  });

program
  .command("list")
  .alias("ls")
  .description("List your plans")
  .action(async () => {
    const plans = await api("/api/plans");
    if (plans.length === 0) {
      console.log("No plans found.");
      return;
    }
    for (const p of plans) {
      const title = p.title || "(untitled)";
      const created = new Date(p.createdAt).toLocaleDateString();
      console.log(`${p.id}  ${title}  ${created}`);
    }
  });

program
  .command("delete <id>")
  .description("Delete a plan")
  .action(async (id: string) => {
    await api(`/api/plans/${id}`, { method: "DELETE" });
    console.log(`Deleted ${id}`);
  });

program
  .command("replace <id> <file>")
  .description("Replace a plan with a new HTML file (preserves ID)")
  .action(async (id: string, file: string) => {
    const html = readFileSync(resolve(file), "utf-8");
    const result = await api(`/api/plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ html, title: extractTitle(html, file) }),
    });
    console.log(result.url);
  });

program
  .command("setup")
  .description("Save API key to ~/.ptd/config.json")
  .option("-k, --key <key>", "API key (prompts if omitted)")
  .action(async () => {
    let key = program.opts().key as string | undefined;
    if (!key) {
      console.log(`Get your API key from: ${BASE_URL}/dashboard`);
      const buf = await new Promise<string>((resolve) => {
        process.stdout.write("Enter your API key: ");
        process.stdin.setEncoding("utf-8");
        process.stdin.once("data", (d) => resolve(d.trim()));
      });
      key = buf;
    }
    if (!key) {
      console.error("No API key provided");
      process.exit(1);
    }
    saveConfig({ api_key: key });
    console.log("✓ saved to ~/.ptd/config.json");
  });

async function main() {
  if (!API_KEY) {
    console.error(
      "Set PTD_API_KEY or run 'ptd setup' to configure your API key.",
    );
    process.exit(1);
  }
  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});