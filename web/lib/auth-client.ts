import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"
import { apiKeyClient } from "@better-auth/api-key/client"

export interface SessionUser {
  id: string
  email: string
  name: string
  image?: string | null
  emailVerified: boolean
}

export interface SessionData {
  user: SessionUser
  session: {
    id: string
    createdAt: Date
    expiresAt: Date
  }
}

export const authClient = createAuthClient({
  // NEXT_PUBLIC_* is inlined at build time; a redacted/absent value must not
  // crash module evaluation. Fall back to localhost rather than `undefined` —
  // better-auth then reads process.env.BETTER_AUTH_URL, which is also garbage
  // in redacted env files.
  baseURL: (() => {
    const base = process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? ""
    try {
      new URL(base)
      return base
    } catch {
      return "http://localhost:3000"
    }
  })(),
  plugins: [adminClient(), apiKeyClient()],
})
