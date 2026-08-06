import { createHmac, timingSafeEqual } from "node:crypto"

const TOKEN_EXPIRY_MS = 1_000 * 60 * 60 * 24 * 30 // 30 days

export interface TokenPayload {
  postId: string
  userId: string
  /** token version — bumped when the post's visibility toggles, revoking older tokens */
  v: number
  iat: number
  exp: number
}

function getSecret(): string {
  const secret = process.env.POST_TOKEN_SECRET
  if (!secret) throw new Error("POST_TOKEN_SECRET is not set")
  return secret
}

/**
 * Sign a capability token for viewing a private post.
 * Token is HMAC-SHA256 over a JSON payload, base64url-encoded.
 */
export function signToken(postId: string, userId: string, version = 1): string {
  const secret = getSecret()
  const now = Date.now()
  const payload: TokenPayload = { postId, userId, v: version, iat: now, exp: now + TOKEN_EXPIRY_MS }

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const sig = createHmac("sha256", secret).update(encoded).digest("base64url")

  return `${encoded}.${sig}`
}

/**
 * Verify a capability token. Returns the decoded payload if valid, null otherwise.
 * Uses timing-safe comparison for the HMAC.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const secret = getSecret()
    const parts = token.split(".")

    // Must be exactly 2 parts: payload and signature
    if (parts.length !== 2) {
      return null
    }

    const [encoded, sig] = parts

    // Verify HMAC with timing-safe comparison
    const expectedSig = createHmac("sha256", secret).update(encoded).digest("base64url")
    const sigBuf = Buffer.from(sig, "base64url")
    const expectedBuf = Buffer.from(expectedSig, "base64url")

    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return null
    }

    const payload: TokenPayload = JSON.parse(Buffer.from(encoded, "base64url").toString())

    // Check expiry
    if (Date.now() > payload.exp) {
      return null
    }

    // Tokens signed before versioning (missing v) are treated as version 1 —
    // still valid until the post's visibility is first toggled.
    if (typeof payload.v !== "number") {
      payload.v = 1
    }

    return payload
  } catch {
    return null
  }
}
