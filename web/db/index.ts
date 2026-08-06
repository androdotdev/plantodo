import { drizzle } from "drizzle-orm/neon-http"
import { neon, type NeonQueryFunction } from "@neondatabase/serverless"
import { schemaRelations } from "./relations"

let client: NeonQueryFunction<false, false> | null = null

function getClient(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error("DATABASE_URL is not set")
    client = neon(url)
  }
  return client
}

/**
 * Lazy neon client: constructed on first query, not at import. Lets modules be
 * evaluated without a reachable DATABASE_URL (local dev, CI builds, prerender),
 * and surfaces a clear error if a query actually runs without one.
 */
const lazyClient = new Proxy(function () {} as unknown as NeonQueryFunction<false, false>, {
  apply(_target, _thisArg, args: unknown[]) {
    return Reflect.apply(getClient() as unknown as (...a: unknown[]) => unknown, null, args)
  },
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver)
  },
})

export const db = drizzle({ client: lazyClient, relations: schemaRelations })
