import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { plans } from "@/db/schema"
import { eq } from "drizzle-orm"
import { withError } from "@/lib/with-error"

export const DELETE = withError(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const userId = request.headers.get("x-user-id")
  // TODO: add getSession fallback for browser dashboard
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const plan = await db.select({ userId: plans.userId }).from(plans).where(eq(plans.id, id)).then(r => r[0])
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (plan.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await db.delete(plans).where(eq(plans.id, id))
  return NextResponse.json({ success: true })
})

export const PATCH = withError(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const userId = request.headers.get("x-user-id")
  // TODO: add getSession fallback for browser dashboard
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { html } = await request.json()
  if (!html || typeof html !== "string") {
    return NextResponse.json({ error: "html is required" }, { status: 400 })
  }

  const plan = await db.select({ userId: plans.userId }).from(plans).where(eq(plans.id, id)).then(r => r[0])
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (plan.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await db.update(plans).set({ html }).where(eq(plans.id, id))
  const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
  return NextResponse.json({ id, url: `${BASE_URL}/p/${id}` })
})
