import { homedir } from "node:os";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const CONFIG_DIR = resolve(homedir(), ".ptd");
const CONFIG_FILE = resolve(CONFIG_DIR, "config.json");

export interface PtdConfig {
  api_key: string;
}

export function loadConfig(): PtdConfig | null {
  if (!existsSync(CONFIG_FILE)) return null;
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8")) as PtdConfig;
  } catch {
    return null;
  }
}

export function saveConfig(config: PtdConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}
