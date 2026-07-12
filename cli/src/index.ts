import { readFileSync, resolve } from "node:fs";
import { Command } from "commander";
import chalk from "chalk";

import { loadConfig, saveConfig } from "./config.js";
import { extractTitle } from "./title.js";
import { version } from "../package.json";

const dim = chalk.dim;
const green = chalk.green;
const red = chalk.red;
const cyan = chalk.cyan;
const yellow = chalk.yellow;

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
    console.error(red.bold(`✗ Error ${res.status}:`), body.error ?? body.message ?? JSON.stringify(body));
    process.exit(1);
  }
  return body;
}

function printUploadOutput(url: string) {
  console.log(`\n${dim("Plan URL:")} ${cyan(url)}`);
  console.log(`${dim("Shareable:")} ${green("[public]")}`);
}

const program = new Command()
  .name("ptd")
  .description("PostHTML CLI — upload, list, delete, and replace plans")
  .version(version);

program
  .command("upload <file>")
  .description("Upload an HTML plan file")
  .action(async (file: string) => {
    const html = readFileSync(resolve(file), "utf-8");

    process.stdout.write(`${dim("→ Validating HTML structure...")}\n`);
    const isValid = /<!DOCTYPE html>/i.test(html);
    process.stdout.write(isValid ? `${green("✓ Valid markup")}\n\n` : `${yellow("⚠ No DOCTYPE found — continuing")}\n\n`);

    process.stdout.write(`${dim("→ Uploading to PostHTML...")}\n`);
    const result = await api("/api/plans", {
      method: "POST",
      body: JSON.stringify({ html, title: extractTitle(html, file) }),
    });
    process.stdout.write(`${green("✓ Upload complete")}\n`);
    printUploadOutput(result.url);
  });

program
  .command("list")
  .alias("ls")
  .description("List your plans")
  .action(async () => {
    process.stdout.write(`${dim("→ Fetching your plans...")}\n`);
    const plans = await api("/api/plans");
    if (plans.length === 0) {
      process.stdout.write(`${dim("No plans found.")}\n`);
      return;
    }
    process.stdout.write(`${green(`✓ ${plans.length} plan${plans.length === 1 ? "" : "s"} loaded`)}\n\n`);
    const header = `${dim("Plan ID")}          ${dim("Title")}                  ${dim("Created")}`;
    const sep = dim("─".repeat(60));
    console.log(`\n${header}\n${sep}`);
    for (const p of plans) {
      const title = p.title || dim("(untitled)");
      const created = dim(new Date(p.createdAt).toLocaleDateString());
      console.log(`${cyan(p.id)}  ${title}  ${created}`);
    }
    console.log();
  });

program
  .command("delete <id>")
  .description("Delete a plan")
  .action(async (id: string) => {
    process.stdout.write(`${dim("→ Deleting plan...")}\n`);
    await api(`/api/plans/${id}`, { method: "DELETE" });
    process.stdout.write(`${green(`✓ Plan ${id} deleted`)}\n`);
  });

program
  .command("replace <id> <file>")
  .description("Replace a plan with a new HTML file (preserves ID)")
  .action(async (id: string, file: string) => {
    const html = readFileSync(resolve(file), "utf-8");

    process.stdout.write(`${dim("→ Validating HTML structure...")}\n`);
    const isValid = /<!DOCTYPE html>/i.test(html);
    process.stdout.write(isValid ? `${green("✓ Valid markup")}\n\n` : `${yellow("⚠ No DOCTYPE found — continuing")}\n\n`);

    process.stdout.write(`${dim(`→ Replacing plan ${id}...`)}\n`);
    const result = await api(`/api/plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ html, title: extractTitle(html, file) }),
    });
    process.stdout.write(`${green("✓ Replacement complete")}\n`);
    printUploadOutput(result.url);
  });

program
  .command("setup")
  .description("Save API key to ~/.ptd/config.json")
  .option("-k, --key <key>", "API key (prompts if omitted)")
  .action(async () => {
    let key = program.opts().key as string | undefined;
    if (!key) {
      console.log(dim(`Get your API key from: ${BASE_URL}/dashboard`));
      const buf = await new Promise<string>((resolve) => {
        process.stdout.write("Enter your API key: ");
        process.stdin.setEncoding("utf-8");
        process.stdin.once("data", (d: string) => resolve(d.trim()));
      });
      key = buf;
    }
    if (!key) {
      console.error(red("No API key provided"));
      process.exit(1);
    }
    saveConfig({ api_key: key });
    console.log(`${green("✓")} ${dim("saved to ~/.ptd/config.json")}`);
  });

async function main() {
  if (!API_KEY) {
    console.error(red.bold("✗ No API key configured."));
    console.error(dim("Set PTD_API_KEY or run 'ptd setup' to configure your API key."));
    process.exit(1);
  }
  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error(red(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
