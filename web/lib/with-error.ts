import { NextRequest, NextResponse } from "next/server"

type RouteHandler = (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>

export function withError(handler: RouteHandler): RouteHandler {
  return async (req, ...args) => {
    try {
      return await handler(req, ...args)
    } catch (err) {
      console.error("Route error:", err)
      const message = err instanceof Error ? err.message : "Internal Server Error"
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }
}
