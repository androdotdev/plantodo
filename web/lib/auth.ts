import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { apiKey } from "@better-auth/api-key"
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  // Fall back to localhost so the module can be evaluated without a valid
  // env (local dev, CI builds). betterAuth throws on an unparseable URL.
  baseURL: (() => {
    const url = process.env.BETTER_AUTH_URL ?? ""
    try {
      new URL(url)
      return url
    } catch {
      return "http://localhost:3000"
    }
  })(),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }
  },
  plugins: [
    apiKey({
      rateLimit: {
        enabled: true,
        timeWindow: 86_400_000,  // 24h in ms
        maxRequests: 1000,
      },
      keyExpiration: {
        defaultExpiresIn: null,
      },
      // Better Auth's default generator concatenates the prefix with no
      // separator (`postAbC…`), contradicting the documented `post_`/`mcp_`
      // prefixes. Emit the separator ourselves; the stored `prefix` column
      // stays bare (`post`/`mcp`) so lookups like `k.prefix === "mcp"`
      // keep working, and the full key is what gets verified anyway.
      customKeyGenerator: ({ length, prefix }) => {
        const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
        const body = Array.from(
          crypto.getRandomValues(new Uint32Array(length)),
          v => alphabet[v % alphabet.length],
        ).join("")
        return `${prefix ? `${prefix}_` : ""}${body}`
      },
    })
  ]
});
