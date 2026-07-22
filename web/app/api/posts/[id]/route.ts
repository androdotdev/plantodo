import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { posts } from "@/db/schema"
import { eq } from "drizzle-orm"
import { withError } from "@/lib/with-error"
import { getAuthenticatedUserId } from "@/lib/auth-user"

const BASE_URL = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "")
const MAX_HTML_SIZE = 524_288 // 512KB

// GET /api/posts/:id — public unless post.isPrivate, then owner-only
export const GET = withError(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const post = await db.select().from(posts).where(eq(posts.id, id)).then(r => r[0])
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (post.isPrivate) {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (post.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(post)
})

export const DELETE = withError(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const post = await db.select({ userId: posts.userId }).from(posts).where(eq(posts.id, id)).then(r => r[0])
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (post.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await db.delete(posts).where(eq(posts.id, id))
  return NextResponse.json({ success: true })
})

export const PATCH = withError(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { html, title, isPrivate } = await request.json()
  if (typeof title !== "string" && (!html || typeof html !== "string") && typeof isPrivate !== "boolean") {
    return NextResponse.json({ error: "html, title, or isPrivate is required" }, { status: 400 })
  }
  if (html && typeof html === "string" && html.length > MAX_HTML_SIZE) {
    return NextResponse.json({ error: `HTML content exceeds 512KB limit` }, { status: 413 })
  }

  const post = await db.select({ userId: posts.userId }).from(posts).where(eq(posts.id, id)).then(r => r[0])
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (post.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const updates: Record<string, string | boolean> = {}
  if (html) updates.html = html
  if (title !== undefined) updates.title = title
  if (typeof isPrivate === "boolean") updates.isPrivate = isPrivate
  await db.update(posts).set(updates).where(eq(posts.id, id))
  return NextResponse.json({ id, url: `${BASE_URL}/p/${id}`, ...(title !== undefined ? { title } : {}), ...(typeof isPrivate === "boolean" ? { isPrivate } : {}) })
})
