import { authenticate, runMcp } from "./lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ── POST handler: header-based auth (backward compat) ───────────────────────

export async function POST(request: Request) {  const apiKey = request.headers.get("x-api-key")
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Unauthorized — x-api-key header required" }),
      { status: 401, headers: { "content-type": "application/json" } },
    )
  }

  try {
    const userId = await authenticate(apiKey)
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { "content-type": "application/json" } },
      )
    }

    const started = performance.now()
    const res = runMcp(request, userId)
    const duration = performance.now() - started
    console.log(`[mcp] ${request.method} handled in ${duration.toFixed(1)}ms (auth: header)`)
    return res
  } catch (err) {
    console.error("MCP error:", err)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "content-type": "application/json" } },
    )
  }
}

// ── GET handler: header-based auth (parity with the URL-token route, which
//    already accepts GET — AGENTS.md documents GET/POST) ─────────────────────

export async function GET(request: Request) {
  return POST(request)
}
