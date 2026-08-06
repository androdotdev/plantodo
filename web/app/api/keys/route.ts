import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { BASE_URL } from "@/lib/constants"

// GET /api/keys
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { apiKeys } = await auth.api.listApiKeys({
    query: { },
    headers: await headers()
  })

  return NextResponse.json({ keys: apiKeys })
}

// POST /api/keys
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const name = body.name
  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const payload: Record<string, unknown> = {
    name,
    prefix: body.purpose === "mcp" ? "mcp" : "post",
    userId: session.user.id,
  }

  // One active MCP token per user: generating a new one revokes the previous.
  // Enforced server-side so a stale browser tab can't leave two live tokens
  // (AGENTS.md documents "regenerate replaces it in place").
  if (body.purpose === "mcp") {
    const { apiKeys } = await auth.api.listApiKeys({ query: {}, headers: await headers() })
    const existing = apiKeys.filter(k => k.prefix === "mcp")
    for (const key of existing) {
      await auth.api.deleteApiKey({ body: { keyId: key.id }, headers: await headers() })
    }
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
  } else if (body.purpose === "mcp") {
    // MCP keys get the same conservative defaults as dashboard keys —
    // rate limited 1000/24h unless explicitly overridden.
    payload.rateLimitEnabled = true
    payload.rateLimitMax = body.rateLimitMax ?? 1000
    payload.rateLimitTimeWindow = body.rateLimitTimeWindow ?? 86_400_000
  } else {
    payload.rateLimitEnabled = false
  }

  const createdKey = await auth.api.createApiKey({ body: payload })

  const result: Record<string, unknown> = {
    key: createdKey.key,
    id: createdKey.id,
    start: createdKey.start,
  }
  if (body.purpose === "mcp") {
    result.mcpUrl = `${BASE_URL}/api/mcp/${createdKey.key}`
  }

  return NextResponse.json(result)
}
