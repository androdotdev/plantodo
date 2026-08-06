import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  clean: true,
  // Optional native module — loaded lazily at runtime with a config-file
  // fallback; must never be bundled or required at module load.
  external: ["@napi-rs/keyring"],
  banner: {
    js: "#!/usr/bin/env node",
  },
});
