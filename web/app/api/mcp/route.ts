import { authenticate, runMcp } from "./lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ── POST handler: header-based auth (backward compat) ───────────────────────

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key")
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

    return runMcp(request, userId)
  } catch (err) {
    console.error("MCP error:", err)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "content-type": "application/json" } },
    )
  }
}
