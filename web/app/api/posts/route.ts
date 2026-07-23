import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { db } from "@/db"
import { posts } from "@/db/schema"
import { eq } from "drizzle-orm"
import { withError } from "@/lib/with-error"
import { getAuthenticatedUserId } from "@/lib/auth-user"

const BASE_URL = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "")
const MAX_HTML_SIZE = 524_288 // 512KB

function getUserId(request: NextRequest): string | null {
  return request.headers.get("x-user-id")
}

export const POST = withError(async (request: NextRequest) => {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { html, title, isPrivate } = await request.json()
  if (!html || typeof html !== "string") {
    return NextResponse.json({ error: "html is required" }, { status: 400 })
  }
  if (html.length > MAX_HTML_SIZE) {
    return NextResponse.json({ error: `HTML content exceeds 512KB limit` }, { status: 413 })
  }
  const id = nanoid(16)
  await db.insert(posts).values({
    id,
    html,
    userId,
    title: title ?? "",
    ...(typeof isPrivate === "boolean" ? { isPrivate } : {}),
  })
  return NextResponse.json({ id, url: `${BASE_URL}/p/${id}`, title: title ?? "", ...(typeof isPrivate === "boolean" ? { isPrivate } : {}) })
})

export const GET = withError(async (request: NextRequest) => {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const list = await db
    .select({ id: posts.id, title: posts.title, createdAt: posts.createdAt, updatedAt: posts.updatedAt, isPrivate: posts.isPrivate })
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(posts.createdAt)
  return NextResponse.json(list)
})

export const DELETE = withError(async (request: NextRequest) => {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await db.delete(posts).where(eq(posts.userId, userId))
  return NextResponse.json({ success: true })
})
