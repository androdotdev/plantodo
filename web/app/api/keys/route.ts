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

  let { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }
  const key = await auth.api.createApiKey({
    body: {
      name: name,
      prefix: "ptd",
      remaining: 10,
      userId: session.user.id,
    }
  })

  return NextResponse.json({ key })
}
