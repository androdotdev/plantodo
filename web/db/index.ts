import { Pool, neon, neonConfig } from "@neondatabase/serverless"
import { drizzle as drizzleWs, type NeonDatabase } from "drizzle-orm/neon-serverless"
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http"
import { schemaRelations } from "./relations"

// Transport: WebSocket by default — one handshake per warm invocation, then all
// queries share the connection, avoiding the per-query HTTP round trip of
// neon-http on multi-query operations (e.g. replace/update flows). Set
// NEON_TRANSPORT=http to force the per-query HTTP transport (e.g. runtimes
// without a WebSocket global).
const useWebSocket = process.env.NEON_TRANSPORT !== "http"

function getUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")
  return url
}

function buildDb(): NeonDatabase {
  if (useWebSocket) {
    // Node <22 needs an explicit WebSocket constructor; modern runtimes (Node
    // 22+, Bun, Vercel Node) expose it globally.
    if (typeof WebSocket !== "undefined") neonConfig.webSocketConstructor = WebSocket
    const pool = new Pool({ connectionString: getUrl() })
    return drizzleWs({ client: pool, relations: schemaRelations })
  }
  // Both drivers expose the same query-builder surface; the HTTP result is
  // structurally compatible with the WS database type.
  return drizzleHttp({ client: neon(getUrl()), relations: schemaRelations }) as unknown as NeonDatabase
}

/**
 * Lazy drizzle instance: built on first query, not at import. Lets modules be
 * evaluated without a reachable DATABASE_URL (local dev, CI builds, prerender),
 * and surfaces a clear error if a query actually runs without one.
 */
let instance: NeonDatabase | null = null

export const db = new Proxy({} as NeonDatabase, {
  get(_target, prop) {
    if (!instance) instance = buildDb()
    return Reflect.get(instance, prop)
  },
})
