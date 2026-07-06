import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

export async function proxy(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key")
  if (!apiKey) return NextResponse.next() // TODO: add session auth for browser dashboard

  const result = await auth.api.verifyApiKey({ body: { key: apiKey } })
  if (!result.valid || !result.key) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const headers = new Headers(request.headers)
  headers.set("x-user-id", result.key.referenceId)
  return NextResponse.next({ request: { headers } })
}

export const config = { matcher: "/api/plans/:path*" }
