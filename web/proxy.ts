import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

async function getUserId(request: NextRequest): Promise<string | null> {
  const apiKey = request.headers.get("x-api-key")
  if (apiKey) {
    const result = await auth.api.verifyApiKey({ body: { key: apiKey } })
    if (result.valid && result.key) return result.key.referenceId
    return null
  }

  const session = await auth.api.getSession({ headers: request.headers })
  return session?.user?.id ?? null
}

export async function proxy(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) return NextResponse.next()

  const headers = new Headers(request.headers)
  headers.set("x-user-id", userId)
  return NextResponse.next({ request: { headers } })
}

export const config = { matcher: "/api/plans/:path*" }
