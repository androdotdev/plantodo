import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAuthenticatedUserId } from "@/lib/auth-user"

export async function proxy(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  const headers = new Headers(request.headers)
  headers.delete("x-user-id")
  if (userId) headers.set("x-user-id", userId)
  return NextResponse.next({ request: { headers } })
}

export const config = { matcher: "/api/plans/:path*" }
