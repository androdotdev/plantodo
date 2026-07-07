import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { db } from "@/db"
import { plans } from "@/db/schema"
import { eq } from "drizzle-orm"
import { withError } from "@/lib/with-error"

const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"

export const POST = withError(async (request: NextRequest) => {
  const userId = request.headers.get("x-user-id")
  // TODO: add getSession fallback for browser dashboard
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { html, title } = await request.json()
  if (!html || typeof html !== "string") {
    return NextResponse.json({ error: "html is required" }, { status: 400 })
  }
  const id = nanoid(16)
  await db.insert(plans).values({ id, html, userId, title: title ?? "" })
  return NextResponse.json({ id, url: `${BASE_URL}/p/${id}`, title: title ?? "" })
})

export const GET = withError(async (request: NextRequest) => {
  const userId = request.headers.get("x-user-id")
  // TODO: add getSession fallback for browser dashboard
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const list = await db
    .select({ id: plans.id, title: plans.title, createdAt: plans.createdAt, updatedAt: plans.updatedAt })
    .from(plans)
    .where(eq(plans.userId, userId))
    .orderBy(plans.createdAt)
  return NextResponse.json(list)
})

export const DELETE = withError(async (request: NextRequest) => {
  const userId = request.headers.get("x-user-id")
  // TODO: add getSession fallback for browser dashboard
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await db.delete(plans).where(eq(plans.userId, userId))
  return NextResponse.json({ success: true })
})
