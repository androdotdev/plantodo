import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, readFileSync, existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Fake OS keyring with controllable failure — @napi-rs/keyring is an optional
// native module (platform-specific), so tests must cover both branches.
const fake = vi.hoisted(() => {
  const store = new Map<string, string>();
  const fail = { set: false, get: false, delete: false };
  class Entry {
    constructor(
      private service: string,
      private username: string,
    ) {}
    setPassword(pw: string) {
      if (fail.set) throw new Error("no secret service available");
      store.set(`${this.service}/${this.username}`, pw);
    }
    getPassword() {
      if (fail.get) throw new Error("NoEntry");
      return store.get(`${this.service}/${this.username}`);
    }
    deletePassword() {
      if (fail.delete) throw new Error("NoEntry");
      store.delete(`${this.service}/${this.username}`);
    }
  }
  return { store, fail, Entry };
});

vi.mock("@napi-rs/keyring", () => ({ Entry: fake.Entry }));

// Config paths are resolved per call (homedir()), so a temp HOME isolates state.
let home = "";

async function importConfig() {
  vi.resetModules();
  const mod = await import("./config.js");
  return mod;
}

beforeEach(async () => {
  fake.store.clear();
  fake.fail.set = false;
  fake.fail.get = false;
  fake.fail.delete = false;
  home = mkdtempSync(join(tmpdir(), "post-cli-test-"));
  process.env.HOME = home;
  delete process.env.XDG_CONFIG_HOME;
});

afterEach(() => {
  delete process.env.HOME;
  delete process.env.XDG_CONFIG_HOME;
});

describe("saveConfig", () => {
  it("stores the key in the keyring and keeps plaintext off disk", async () => {
    const { saveConfig, loadConfig, configFileMode } = await importConfig();
    expect(await saveConfig({ api_key: "post_abc", url: "https://x.example" })).toBe("keyring");

    expect(fake.store.get("relay/api_key")).toBe("post_abc");
    const file = join(home, ".config", ".relay", "config.json");
    expect(existsSync(file)).toBe(true);
    expect(JSON.parse(readFileSync(file, "utf-8"))).toEqual({ url: "https://x.example" });
    expect(await loadConfig()).toEqual({ api_key: "post_abc", url: "https://x.example" });
    expect(configFileMode()).toBe(0o600);
  });

  it("falls back to the config file when the keyring is unavailable", async () => {
    const { saveConfig, loadConfig } = await importConfig();
    fake.fail.set = true;
    expect(await saveConfig({ api_key: "post_abc", url: "https://x.example" })).toBe("file");

    const file = join(home, ".config", ".relay", "config.json");
    expect(JSON.parse(readFileSync(file, "utf-8"))).toEqual({ api_key: "post_abc", url: "https://x.example" });
    expect(await loadConfig()).toEqual({ api_key: "post_abc", url: "https://x.example" });
  });

  it("clears a stale keyring entry when falling back to the file", async () => {
    const { saveConfig, loadConfig } = await importConfig();
    // Old key lives in the keyring; a later setup finds the keyring broken.
    fake.store.set("relay/api_key", "post_stale");
    fake.fail.set = true;

    expect(await saveConfig({ api_key: "post_fresh" })).toBe("file");
    expect(fake.store.has("relay/api_key")).toBe(false);
    expect((await loadConfig()).api_key).toBe("post_fresh");
  });

  it("writes a url-only config without touching the keyring", async () => {
    const { saveConfig } = await importConfig();
    expect(await saveConfig({ url: "https://y.example" })).toBe("file");
    expect(fake.store.has("relay/api_key")).toBe(false);
  });
});

describe("loadConfig", () => {
  it("returns an empty config when nothing is stored", async () => {
    const { loadConfig } = await importConfig();
    expect(await loadConfig()).toEqual({ api_key: undefined, url: undefined });
  });

  it("prefers the keyring over a file key", async () => {
    const { loadConfig } = await importConfig();
    fake.store.set("relay/api_key", "post_keyring");
    const dir = join(home, ".config", ".relay");
    const { mkdirSync, writeFileSync } = await import("node:fs");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "config.json"), JSON.stringify({ api_key: "post_file" }));

    expect((await loadConfig()).api_key).toBe("post_keyring");
  });

  it("honors XDG_CONFIG_HOME when set", async () => {
    const { loadConfig } = await importConfig();
    const xdg = mkdtempSync(join(tmpdir(), "post-cli-xdg-"));
    process.env.XDG_CONFIG_HOME = xdg;
    const { mkdirSync, writeFileSync } = await import("node:fs");
    mkdirSync(join(xdg, ".relay"), { recursive: true });
    writeFileSync(join(xdg, ".relay", "config.json"), JSON.stringify({ api_key: "post_xdg" }));

    expect((await loadConfig()).api_key).toBe("post_xdg");
  });

  it("migrates a legacy ~/.post/config.json on first read", async () => {
    const { loadConfig } = await importConfig();
    const { mkdirSync, writeFileSync } = await import("node:fs");
    mkdirSync(join(home, ".post"), { recursive: true });
    writeFileSync(join(home, ".post", "config.json"), JSON.stringify({ api_key: "post_old", url: "https://z.example" }));

    expect(await loadConfig()).toEqual({ api_key: "post_old", url: "https://z.example" });
    expect(existsSync(join(home, ".post", "config.json"))).toBe(false);
    expect(JSON.parse(readFileSync(join(home, ".config", ".relay", "config.json"), "utf-8"))).toEqual({ api_key: "post_old", url: "https://z.example" });
  });
});
