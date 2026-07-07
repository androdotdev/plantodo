import { NextRequest, NextResponse } from "next/server"

type RouteHandler = (req: NextRequest, ctx: any) => Promise<NextResponse>

export function withError(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx)
    } catch (err) {
      console.error("Route error:", err)
      const message = err instanceof Error ? err.message : "Internal Server Error"
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }
}
