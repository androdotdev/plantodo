import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAuthenticatedUserId } from "@/lib/auth-user"

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") || ""
  const isPostsDomain = host === (process.env.POSTS_DOMAIN ?? false)
  const path = request.nextUrl.pathname

  // Posts domain: only /p/:id may resolve — everything else 404
  if (isPostsDomain) {
    if (!path.startsWith("/p/")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.next()
  }

  // API auth — only for /api/posts/* on the main domain
  if (!path.startsWith("/api/posts")) {
    return NextResponse.next()
  }

  const userId = await getAuthenticatedUserId(request)
  const headers = new Headers(request.headers)
  headers.delete("x-user-id")
  if (userId) headers.set("x-user-id", userId)
  return NextResponse.next({ request: { headers } })
}

export const config = { matcher: ["/api/posts/:path*", "/p/:path*"] }
