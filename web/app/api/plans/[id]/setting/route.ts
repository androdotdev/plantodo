import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { plans } from "@/db/schema"
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

  const plan = await db.select({ userId: plans.userId }).from(plans).where(eq(plans.id, id)).then(r => r[0])
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (plan.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await db.update(plans).set({ title }).where(eq(plans.id, id))
  return NextResponse.json({ id, title })
})
