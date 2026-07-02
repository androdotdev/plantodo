import { createAuthClient } from "better-auth/react" // make sure to import from better-auth/react
import { adminClient } from "better-auth/client/plugins"
import { apiKeyClient } from "@better-auth/api-key/client"

export const authClient =  createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  plugins: [
    adminClient(),
    apiKeyClient()
  ]
})
