import { NextRequest, NextResponse } from "next/server"

// Route handler's second arg is the route context (params, etc.) — shape
// depends on the route segment, so we allow `any` here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
