import { authenticate, runMcp } from "../lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ── Shared auth helper ──────────────────────────────────────────────────────

async function handle(request: Request, params: Promise<{ token: string }>) {
  const apiKey = (await params).token

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key is required in the URL path" }),
      { status: 400, headers: { "content-type": "application/json" } },
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

// ── GET — SSE stream initiation ─────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  return handle(request, params)
}

// ── POST — JSON-RPC calls ───────────────────────────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  return handle(request, params)
}
