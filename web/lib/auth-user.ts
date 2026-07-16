import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

/**
 * Get the authenticated user ID by directly checking API key or session.
 *
 * This does NOT trust the x-user-id header — it re-verifies auth independently
 * using the original credentials (x-api-key or session cookie). Use on sensitive
 * mutating routes (POST, DELETE, PATCH) for defense-in-depth.
 *
 * Read-only routes (GET) can trust the proxy-set x-user-id header instead —
 * the proxy strips client-supplied x-user-id before forwarding, so the header
 * is always either the verified value or absent entirely.
 */
export async function getAuthenticatedUserId(
  request: NextRequest,
): Promise<string | null> {
  const apiKey = request.headers.get("x-api-key")
  if (apiKey) {
    const result = await auth.api.verifyApiKey({ body: { key: apiKey } })
    if (result.valid && result.key) return result.key.referenceId
    return null
  }

  const session = await auth.api.getSession({ headers: request.headers })
  return session?.user?.id ?? null
}
