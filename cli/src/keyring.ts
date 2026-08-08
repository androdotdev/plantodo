import type { Entry as KeyringEntry } from "@napi-rs/keyring";

// OS credential-store wrapper. Every call is a safe no-op on failure: a
// machine without a keyring (headless CI, WSL without a Secret Service)
// must never break the CLI — callers fall back to the config file.
// The dependency is optional (see package.json) and imported lazily so a
// missing/unloadable native module degrades to the same fallback.

const SERVICE = "relay";
const USERNAME = "api_key";

async function keyringEntry(): Promise<KeyringEntry | null> {
  try {
    const { Entry } = await import("@napi-rs/keyring");
    return new Entry(SERVICE, USERNAME);
  } catch {
    return null;
  }
}

/** Store the key. Returns true only if the OS store accepted it. */
export async function saveToKeyring(key: string): Promise<boolean> {
  const entry = await keyringEntry();
  if (!entry) return false;
  try {
    entry.setPassword(key);
    return true;
  } catch {
    return false;
  }
}

/** Read the key back, or null when unavailable. */
export async function readFromKeyring(): Promise<string | null> {
  const entry = await keyringEntry();
  if (!entry) return null;
  try {
    return entry.getPassword() ?? null;
  } catch {
    return null; // NoEntry and other platform errors
  }
}

/** Remove the stored key. Swallows NoEntry. */
export async function deleteFromKeyring(): Promise<void> {
  const entry = await keyringEntry();
  if (!entry) return;
  try {
    entry.deletePassword();
  } catch {
    // NoEntry etc — nothing to delete
  }
}
