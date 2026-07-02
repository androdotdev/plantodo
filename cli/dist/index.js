#!/usr/bin/env node

// src/index.ts
import { readFileSync as readFileSync2 } from "fs";
import { resolve as resolve2 } from "path";
import { Command } from "commander";

// src/config.ts
import { homedir } from "os";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
var CONFIG_DIR = resolve(homedir(), ".ptd");
var CONFIG_FILE = resolve(CONFIG_DIR, "config.json");
function loadConfig() {
  if (!existsSync(CONFIG_FILE)) return null;
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return null;
  }
}
function saveConfig(config2) {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config2, null, 2));
}

// src/index.ts
var config = loadConfig();
var API_KEY = process.env.PTD_API_KEY ?? process.env.PLANTODO_API_KEY ?? config?.api_key ?? "";
var BASE_URL = (process.env.PTD_URL ?? "http://localhost:3000").replace(/\/+$/, "");
async function api(path, init) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      "x-api-key": API_KEY,
      "Content-Type": "application/json"
    }
  });
  const body = await res.json();
  if (!res.ok) {
    console.error(
      `Error ${res.status}:`,
      body.error ?? body.message ?? JSON.stringify(body)
    );
    process.exit(1);
  }
  return body;
}
var program = new Command().name("ptd").description("planToDO CLI \u2014 upload, list, delete, and replace plans").version("0.1.0");
program.command("upload <file>").description("Upload an HTML plan file").action(async (file) => {
  const html = readFileSync2(resolve2(file), "utf-8");
  const result = await api("/api/plans", {
    method: "POST",
    body: JSON.stringify({ html, title: file })
  });
  console.log(result.url);
});
program.command("list").alias("ls").description("List your plans").action(async () => {
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
program.command("delete <id>").description("Delete a plan").action(async (id) => {
  await api(`/api/plans/${id}`, { method: "DELETE" });
  console.log(`Deleted ${id}`);
});
program.command("replace <id> <file>").description("Replace a plan with a new HTML file (preserves ID)").action(async (id, file) => {
  const html = readFileSync2(resolve2(file), "utf-8");
  const result = await api(`/api/plans/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ html })
  });
  console.log(result.url);
});
program.command("setup").description("Save API key to ~/.ptd/config.json").option("-k, --key <key>", "API key (prompts if omitted)").action(async () => {
  let key = program.opts().key;
  if (!key) {
    console.log(`Get your API key from: ${BASE_URL}/dashboard`);
    const buf = await new Promise((resolve3) => {
      process.stdout.write("Enter your API key: ");
      process.stdin.setEncoding("utf-8");
      process.stdin.once("data", (d) => resolve3(d.trim()));
    });
    key = buf;
  }
  if (!key) {
    console.error("No API key provided");
    process.exit(1);
  }
  saveConfig({ api_key: key });
  console.log("\u2713 saved to ~/.ptd/config.json");
});
async function main() {
  if (!API_KEY) {
    console.error(
      "Set PTD_API_KEY or run 'ptd setup' to configure your API key."
    );
    process.exit(1);
  }
  await program.parseAsync(process.argv);
}
main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
