import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { plans } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { withError } from "@/lib/with-error"
import { getAuthenticatedUserId } from "@/lib/auth-user"

// GET /api/plans/:id/data — public unless plan.isPrivate, then owner-only
export const GET = withError(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const row = await db
    .select({ data: plans.data, isPrivate: plans.isPrivate, userId: plans.userId })
    .from(plans)
    .where(eq(plans.id, id))
    .then(r => r[0])

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (row.isPrivate) {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (row.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(row.data ?? {})
})

// PATCH /api/plans/:id/data — auth via x-api-key, merges into existing jsonb
export const PATCH = withError(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  // Verify ownership
  const plan = await db
    .select({ userId: plans.userId })
    .from(plans)
    .where(eq(plans.id, id))
    .then(r => r[0])

  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (plan.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 })
  }

  // Merge into existing jsonb using Postgres ||
  // safe: `fragment` is bound as a Drizzle parameter ($1), not string-concatenated —
  // sql`` here is just Postgres's jsonb `||` merge operator, which Drizzle doesn't wrap natively
  const fragment = JSON.stringify(body)
  const merged = await db
    .update(plans)
    .set({ data: sql`${plans.data} || ${fragment}::jsonb` })
    .where(eq(plans.id, id))
    .returning({ data: plans.data })

  return NextResponse.json(merged[0].data)
})
