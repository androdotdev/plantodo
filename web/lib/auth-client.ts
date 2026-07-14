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
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  plugins: [adminClient(), apiKeyClient()],
})
