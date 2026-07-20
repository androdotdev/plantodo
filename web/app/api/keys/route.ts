import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

// GET /api/keys
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { apiKeys } = await auth.api.listApiKeys({
    query: { },
    headers: await headers()
  })

  return NextResponse.json({ keys: apiKeys })
}

// POST /api/keys
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await req.json()
  const name = body.name
  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const payload: Record<string, unknown> = {
    name,
    prefix: "post",
    userId: session.user.id,
  }

  if (body.unlimited !== false) {
    payload.remaining = null
  } else if (body.remaining != null) {
    payload.remaining = body.remaining
  }

  if (body.expiresIn != null) {
    payload.expiresIn = body.expiresIn
  }

  if (body.rateLimitEnabled === true) {
    payload.rateLimitEnabled = true
    if (body.rateLimitMax != null) payload.rateLimitMax = body.rateLimitMax
    if (body.rateLimitTimeWindow != null) payload.rateLimitTimeWindow = body.rateLimitTimeWindow
  } else {
    payload.rateLimitEnabled = false
  }

  const { key: keyString } = await auth.api.createApiKey({ body: payload })

  return NextResponse.json({ key: keyString })
}
