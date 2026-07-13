import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { db } from "@/db"
import { plans } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { auth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BASE_URL = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "")

// ── MCP Tools ──────────────────────────────────────────────────────────────

function getToolDefs() {
  return [
    {
      name: "list_plans",
      description: "List all plans for the authenticated user",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_plan",
      description: "Get plan HTML content by ID",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string", description: "Plan ID" } },
        required: ["id"],
      },
    },
    {
      name: "upload_plan",
      description: "Create a new plan from HTML content",
      inputSchema: {
        type: "object",
        properties: {
          html: { type: "string", description: "Full HTML content" },
          title: { type: "string", description: "Optional display title" },
        },
        required: ["html"],
      },
    },
    {
      name: "replace_plan",
      description: "Replace an existing plan's HTML while preserving its ID and URL",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Plan ID to replace" },
          html: { type: "string", description: "New HTML content" },
          title: { type: "string", description: "Optional new title" },
        },
        required: ["id", "html"],
      },
    },
    {
      name: "delete_plan",
      description: "Delete a plan by ID",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string", description: "Plan ID to delete" } },
        required: ["id"],
      },
    },
  ]
}

async function handleToolCall(name: string, args: Record<string, unknown> | undefined, userId: string) {
  switch (name) {
    // ── list_plans ───────────────────────────────────────────────────────
    case "list_plans": {
      const list = await db
        .select({
          id: plans.id,
          title: plans.title,
          createdAt: plans.createdAt,
          updatedAt: plans.updatedAt,
        })
        .from(plans)
        .where(eq(plans.userId, userId))
        .orderBy(plans.createdAt)

      return {
        content: [{ type: "text" as const, text: JSON.stringify(list, null, 2) }],
      }
    }

    // ── get_plan ─────────────────────────────────────────────────────────
    case "get_plan": {
      if (!args?.id || typeof args.id !== "string") {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "id is required" }) }], isError: true }
      }

      const plan = (await db
        .select()
        .from(plans)
        .where(and(eq(plans.id, args.id), eq(plans.userId, userId)))
        .limit(1))[0]

      if (!plan) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Plan not found" }) }], isError: true }
      }

      return {
        content: [
          { type: "text" as const, text: plan.html },
          {
            type: "text" as const,
            text: JSON.stringify({ id: plan.id, title: plan.title, createdAt: plan.createdAt, updatedAt: plan.updatedAt }),
          },
        ],
      }
    }

    // ── upload_plan ──────────────────────────────────────────────────────
    case "upload_plan": {
      if (!args?.html || typeof args.html !== "string") {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "html is required" }) }], isError: true }
      }

      const id = nanoid(16)
      const title = typeof args.title === "string" ? args.title : ""

      await db.insert(plans).values({ id, html: args.html, userId, title })

      return {
        content: [{ type: "text" as const, text: JSON.stringify({ id, url: `${BASE_URL}/p/${id}` }, null, 2) }],
      }
    }

    // ── replace_plan ─────────────────────────────────────────────────────
    case "replace_plan": {
      if (!args?.id || typeof args.id !== "string" || !args?.html || typeof args.html !== "string") {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "id and html are required" }) }], isError: true }
      }

      const existing = (await db
        .select()
        .from(plans)
        .where(and(eq(plans.id, args.id), eq(plans.userId, userId)))
        .limit(1))[0]

      if (!existing) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Plan not found" }) }], isError: true }
      }

      await db
        .update(plans)
        .set({
          html: args.html,
          title: typeof args.title === "string" ? args.title : existing.title,
          updatedAt: new Date(),
        })
        .where(eq(plans.id, args.id))

      return {
        content: [{ type: "text" as const, text: JSON.stringify({ id: args.id, url: `${BASE_URL}/p/${args.id}` }, null, 2) }],
      }
    }

    // ── delete_plan ──────────────────────────────────────────────────────
    case "delete_plan": {
      if (!args?.id || typeof args.id !== "string") {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "id is required" }) }], isError: true }
      }

      const existing = (await db
        .select()
        .from(plans)
        .where(and(eq(plans.id, args.id), eq(plans.userId, userId)))
        .limit(1))[0]

      if (!existing) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Plan not found" }) }], isError: true }
      }

      await db.delete(plans).where(eq(plans.id, args.id))

      return {
        content: [{ type: "text" as const, text: JSON.stringify({ success: true }) }],
      }
    }

    default:
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: `Unknown tool: ${name}` }) }],
        isError: true,
      }
  }
}

// ── POST handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. Authenticate via x-api-key
  const apiKey = request.headers.get("x-api-key")
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Unauthorized — x-api-key header required" }),
      { status: 401, headers: { "content-type": "application/json" } },
    )
  }

  try {
    const result = await auth.api.verifyApiKey({ body: { key: apiKey } })

    if (!result.valid || !result.key?.referenceId) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { "content-type": "application/json" } },
      )
    }

    const userId = result.key.referenceId

    // 2. Create MCP server (per-request for stateless isolation)
    const server = new Server(
      { name: "PostHTML", version: "0.1.0" },
      { capabilities: { tools: {} } },
    )

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: getToolDefs(),
    }))

    server.setRequestHandler(CallToolRequestSchema, async (req) => {
      return handleToolCall(req.params.name, req.params.arguments as Record<string, unknown> | undefined, userId)
    })

    // 3. Create transport and handle request
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
    })

    await server.connect(transport)
    return transport.handleRequest(request)
  } catch (err) {
    console.error("MCP error:", err)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "content-type": "application/json" } },
    )
  }
}
