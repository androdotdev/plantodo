import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { posts } from "@/db/schema"
import { eq } from "drizzle-orm"
import { withError } from "@/lib/with-error"
import { getAuthenticatedUserId } from "@/lib/auth-user"

export const PATCH = withError(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { title } = await request.json()
  if (typeof title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 })
  }

  const post = await db.select({ userId: posts.userId }).from(posts).where(eq(posts.id, id)).then(r => r[0])
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (post.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await db.update(posts).set({ title }).where(eq(posts.id, id))
  return NextResponse.json({ id, title })
})
