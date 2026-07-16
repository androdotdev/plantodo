import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

/**
 * Parse the --data / --data-file options shared by `upload` and `replace`.
 * Returns null if neither was passed. Exits with an error on invalid JSON.
 */
function parseDataOption(options: { data?: string; dataFile?: string }): Record<string, unknown> | null {
  if (options.dataFile) {
    const content = readFileSync(resolve(options.dataFile), "utf-8");
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        console.error(red(`✗ File "${options.dataFile}" must contain a JSON object`));
        process.exit(1);
      }
      return parsed;
    } catch {
      console.error(red(`✗ File "${options.dataFile}" is not valid JSON`));
      process.exit(1);
    }
  }
  if (options.data) {
    try {
      const parsed = JSON.parse(options.data);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        console.error(red("✗ --data must be a JSON object"));
        process.exit(1);
      }
      return parsed;
    } catch {
      console.error(red("✗ --data must be valid JSON"));
      process.exit(1);
    }
  }
  return null;
}

const program = new Command()
  .name("ptd")
  .description("PostHTML CLI — upload, list, delete, and replace plans")
  .version(version);

program
  .command("upload <file>")
  .description("Upload an HTML plan file")
  .option("-d, --data <json>", "JSON data to attach (merged into plan.data)")
  .option("--data-file <path>", "JSON file to merge into plan.data")
  .action(async (file: string, options: { data?: string; dataFile?: string }) => {
    const html = readFileSync(resolve(file), "utf-8");
    const data = parseDataOption(options);

    process.stdout.write(`${dim("→ Validating HTML structure...")}\n`);
    const isValid = /<!DOCTYPE html>/i.test(html);
    process.stdout.write(isValid ? `${green("✓ Valid markup")}\n\n` : `${yellow("⚠ No DOCTYPE found — continuing")}\n\n`);

    process.stdout.write(`${dim("→ Uploading to PostHTML...")}\n`);
    const result = await api("/api/plans", {
      method: "POST",
      body: JSON.stringify({ html, title: extractTitle(html, file) }),
    });

    if (data) {
      process.stdout.write(`${dim("→ Attaching data...")}\n`);
      await api(`/api/plans/${result.id}/data`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      process.stdout.write(`${green("✓ Data attached")}\n`);
    }

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

// ── data ────────────────────────────────────────────────────────────────────
const dataCmd = program
  .command("data")
  .description("Manage plan JSON data");

dataCmd
  .command("get <id>")
  .description("Get plan data")
  .action(async (id: string) => {
    process.stdout.write(`${dim("→ Fetching plan data...")}\n`);
    const data = await api(`/api/plans/${id}/data`);
    console.log(JSON.stringify(data, null, 2));
  });

dataCmd
  .command("set <id>")
  .description("Merge data into a plan")
  .option("-k, --key <key>", "JSON key to set")
  .option("-v, --value <value>", 'JSON value (required with --key, e.g. \'[{"repo":"cardfoi"}]\')')
  .option("-f, --file <path>", "JSON file to merge (whole object)")
  .action(async (id: string, options: { key?: string; value?: string; file?: string }) => {
    let body: Record<string, unknown>;

    if (options.file) {
      const content = readFileSync(resolve(options.file), "utf-8");
      try {
        body = JSON.parse(content);
      } catch {
        console.error(red(`✗ File "${options.file}" is not valid JSON`));
        process.exit(1);
      }
      if (typeof body !== "object" || Array.isArray(body)) {
        console.error(red('✗ File must contain a JSON object, not an array or primitive'));
        process.exit(1);
      }
    } else if (options.key) {
      if (options.value === undefined) {
        console.error(red("✗ --value is required with --key"));
        process.exit(1);
      }
      try {
        body = { [options.key]: JSON.parse(options.value) };
      } catch {
        console.error(red("✗ --value must be valid JSON"));
        process.exit(1);
      }
    } else {
      console.error(red("✗ Provide either --key/--value or --file"));
      process.exit(1);
    }

    process.stdout.write(`${dim("→ Merging data into plan...")}\n`);
    const result = await api(`/api/plans/${id}/data`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    console.log(JSON.stringify(result, null, 2));
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
