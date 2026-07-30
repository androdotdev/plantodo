import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAuthenticatedUserId } from "@/lib/auth-user"
import { signToken } from "@/lib/post-token"
import { db } from "@/db"
import { posts } from "@/db/schema"
import { eq } from "drizzle-orm"

const NOT_A_POST_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>PostHTML</title>
<style>body{font-family:ui-monospace,monospace;background:#0a0a0a;color:#e8e8e8;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}main{text-align:center;padding:2rem}svg{opacity:.5}h1{font-size:1.25rem;margin:.75rem 0 .5rem}.msg{color:#888;max-width:22rem;font-size:.85rem}.home{border:1px solid #333;color:#888;padding:.5rem 1rem;border-radius:2px;text-decoration:none;display:inline-block;margin-top:1rem}.home:hover{color:#e8e8e8;border-color:#444}</style>
</head>
<body><main>
<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h10l6 6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M14 4v6h6"/></svg>
<h1>This domain only shows posts</h1>
<p class="msg">postshare.andro42.qzz.io serves individual posts at /p/:id. Looking for the dashboard?</p>
<a class="home" href="__MAIN_URL__">Go to PostHTML</a>
</main></body></html>`;

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") || ""
  const isPostsDomain = host === (process.env.POSTS_DOMAIN ?? false)
  const path = request.nextUrl.pathname

  // Posts domain: only /p/:id may resolve — everything else gets this
  // branded fallback instead of falling through to the real app.
  if (isPostsDomain) {
    if (!path.startsWith("/p/")) {
      const mainUrl = process.env.BETTER_AUTH_URL ?? "https://posthtml.vercel.app"
      const html = NOT_A_POST_HTML.replace("__MAIN_URL__", mainUrl)
      return new NextResponse(html, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } })
    }
    return NextResponse.next()
  }

  // Main domain: redirect /p/:id to the posts domain for origin isolation.
  // If the user is authenticated, include a signed token so they can access private posts.
  if (path.startsWith("/p/")) {
    const postsDomain = process.env.POSTS_DOMAIN
    if (postsDomain) {
      const userId = await getAuthenticatedUserId(request)
      let redirectUrl = `https://${postsDomain}${path}${request.nextUrl.search}`
      if (userId) {
        const postId = path.replace("/p/", "")
        // Only sign a capability token for private posts — public posts don't need one
        const post = await db
          .select({ isPrivate: posts.isPrivate })
          .from(posts)
          .where(eq(posts.id, postId))
          .then(r => r[0])
        if (post?.isPrivate) {
          const token = signToken(postId, userId)
          const separator = request.nextUrl.search ? "&" : "?"
          redirectUrl += `${separator}key=${token}`
        }
      }
      return NextResponse.redirect(redirectUrl, 302)
    }
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

// Broad matcher so proxy.ts sees every request, not just a hand-picked list —
// on the posts domain this is what makes the "only /p/:id resolves" rule
// actually apply to paths like /dashboard or /api/keys, not just the ones
// someone remembered to add here.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
