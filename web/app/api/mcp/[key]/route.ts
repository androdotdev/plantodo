import { authenticate, runMcp } from "../lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ── POST handler: URL-based auth (no headers needed) ────────────────────────
// Usage: MCP client points to https://posthtml.vercel.app/api/mcp/<api-key>

export async function POST(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const apiKey = (await params).key

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
