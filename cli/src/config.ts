import { homedir } from "node:os";
import { writeFileSync, readFileSync, mkdirSync, existsSync, statSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { saveToKeyring, readFromKeyring, deleteFromKeyring } from "./keyring.js";

// Config file lives at $XDG_CONFIG_HOME/.relay/config.json (0600), falling
// back to ~/.config/.relay/config.json when XDG_CONFIG_HOME is unset. On
// machines with an OS keyring, the API key is stored there instead and the
// file keeps only the non-secret options. Paths are resolved per call so
// tests can swap HOME / XDG_CONFIG_HOME.

export interface PtdConfig {
  api_key?: string;
  url?: string;
}

function configPaths() {
  const base = process.env.XDG_CONFIG_HOME || resolve(homedir(), ".config");
  const dir = resolve(base, ".relay");
  return { dir, file: resolve(dir, "config.json") };
}

/** Absolute path to the config file — used for user-facing messages. */
export function configFilePath(): string {
  return configPaths().file;
}

// One-time move from the pre-XDG location (~/.post/config.json). Runs only
// when the XDG file doesn't exist yet; copies then removes the old file.
function migrateLegacyConfig(): void {
  const { dir, file } = configPaths();
  if (existsSync(file)) return;
  const legacy = resolve(homedir(), ".post", "config.json");
  if (!existsSync(legacy)) return;
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(file, readFileSync(legacy, "utf-8"), { mode: 0o600 });
  rmSync(legacy, { force: true });
}

function readFileConfig(): PtdConfig | null {
  migrateLegacyConfig();
  const { file } = configPaths();
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf-8")) as PtdConfig;
  } catch {
    return null;
  }
}

function writeFileConfig(config: PtdConfig): void {
  const { dir, file } = configPaths();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(file, JSON.stringify(config, null, 2), { mode: 0o600 });
}

/** Key resolution: OS keyring first, then the config file, then "". */
export async function loadConfig(): Promise<PtdConfig> {
  const file = readFileConfig();
  const fromKeyring = await readFromKeyring();
  return {
    api_key: fromKeyring ?? file?.api_key,
    url: file?.url,
  };
}

/**
 * Persist config. The API key goes to the OS keyring when available (keeping
 * the plaintext off disk); otherwise the whole config is written to the file
 * with 0600 permissions. A stale keyring entry is cleared when falling back
 * so an old key can't shadow the newly saved one.
 * Returns where the key ended up so callers can report it accurately.
 */
export async function saveConfig(config: PtdConfig): Promise<"keyring" | "file"> {
  if (config.api_key && (await saveToKeyring(config.api_key))) {
    writeFileConfig({ url: config.url });
    return "keyring";
  }
  await deleteFromKeyring();
  writeFileConfig(config);
  return "file";
}

/** Config file permission check — 0600 as written, loosened only by umask. */
export function configFileMode(): number | null {
  const { file } = configPaths();
  if (!existsSync(file)) return null;
  return statSync(file).mode & 0o777;
}
