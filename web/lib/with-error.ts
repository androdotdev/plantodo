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
      // Malformed JSON body (from request.json()) is a client error, not a 500
      if (err instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
      }
      // Never echo internal error details to clients — log server-side only
      console.error("Route error:", err)
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
  }
}
