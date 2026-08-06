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
  const post = await db
    .select({
      id: posts.id,
      html: posts.html,
      data: posts.data,
      title: posts.title,
      isPrivate: posts.isPrivate,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      userId: posts.userId,
    })
    .from(posts).where(eq(posts.id, id)).then(r => r[0])
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (post.isPrivate) {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (post.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { userId: _userId, ...publicPost } = post
  return NextResponse.json(publicPost)
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
  const body = await request.json()
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 })
  }

  const updates: Record<string, string | boolean> = {}
  if (body.title !== undefined) {
    if (typeof body.title !== "string") return NextResponse.json({ error: "title must be a string" }, { status: 400 })
    updates.title = body.title
  }
  if (body.html !== undefined) {
    if (typeof body.html !== "string") return NextResponse.json({ error: "html must be a string" }, { status: 400 })
    if (body.html.length > MAX_HTML_SIZE) {
      return NextResponse.json({ error: `HTML content exceeds 512KB limit` }, { status: 413 })
    }
    updates.html = body.html
  }
  if (body.isPrivate !== undefined) {
    if (typeof body.isPrivate !== "boolean") return NextResponse.json({ error: "isPrivate must be a boolean" }, { status: 400 })
    updates.isPrivate = body.isPrivate
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "html, title, or isPrivate is required" }, { status: 400 })
  }

  const post = await db.select({ userId: posts.userId }).from(posts).where(eq(posts.id, id)).then(r => r[0])
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (post.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await db.update(posts).set(updates).where(eq(posts.id, id))
  return NextResponse.json({
    id,
    url: `${BASE_URL}/p/${id}`,
    ...(updates.title !== undefined ? { title: updates.title } : {}),
    ...(updates.isPrivate !== undefined ? { isPrivate: updates.isPrivate } : {}),
  })
})
