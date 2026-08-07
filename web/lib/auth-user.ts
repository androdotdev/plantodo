import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

/**
 * Get the authenticated user ID by directly checking API key or session.
 *
 * Every route calls this — GET and mutating alike — and it NEVER trusts the
 * x-user-id header (the proxy strips any client-supplied value). Because the
 * proxy no longer re-verifies auth, each request consumes an API key's
 * rate-limit/remaining counters exactly once.
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
