import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { db } from "@/db"
import { posts } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { auth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BASE_URL = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "")
const MAX_HTML_SIZE = 524_288 // 512KB

// ── Auth ────────────────────────────────────────────────────────────────────

export async function authenticate(apiKey: string) {
  const result = await auth.api.verifyApiKey({ body: { key: apiKey } })
  if (!result.valid || !result.key?.referenceId) return null
  return result.key.referenceId
}

// ── Tool defs ───────────────────────────────────────────────────────────────

function getToolDefs() {
  return [
    {
      name: "list_posts",
      description: "List all posts for the authenticated user",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_post",
      description: "Get post HTML content by ID",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string", description: "Post ID" } },
        required: ["id"],
      },
    },
    {
      name: "upload_post",
      description: "Create a new post from HTML content",
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
      name: "replace_post",
      description: "Replace an existing post's HTML while preserving its ID and URL",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Post ID to replace" },
          html: { type: "string", description: "New HTML content" },
          title: { type: "string", description: "Optional new title" },
        },
        required: ["id", "html"],
      },
    },
    {
      name: "delete_post",
      description: "Delete a post by ID",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string", description: "Post ID to delete" } },
        required: ["id"],
      },
    },
  ]
}

// ── Tool handlers ───────────────────────────────────────────────────────────

async function handleToolCall(name: string, args: Record<string, unknown> | undefined, userId: string) {
  switch (name) {
    case "list_posts": {
      const list = await db
        .select({
          id: posts.id,
          title: posts.title,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
        })
        .from(posts)
        .where(eq(posts.userId, userId))
        .orderBy(posts.createdAt)

      return {
        content: [{ type: "text" as const, text: JSON.stringify(list, null, 2) }],
      }
    }

    case "get_post": {
      if (!args?.id || typeof args.id !== "string") {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "id is required" }) }], isError: true }
      }

      const post = (await db
        .select()
        .from(posts)
        .where(and(eq(posts.id, args.id), eq(posts.userId, userId)))
        .limit(1))[0]

      if (!post) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Post not found" }) }], isError: true }
      }

      return {
        content: [
          { type: "text" as const, text: post.html },
          {
            type: "text" as const,
            text: JSON.stringify({ id: post.id, title: post.title, createdAt: post.createdAt, updatedAt: post.updatedAt }),
          },
        ],
      }
    }

    case "upload_post": {
      if (!args?.html || typeof args.html !== "string") {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "html is required" }) }], isError: true }
      }
      if (args.html.length > MAX_HTML_SIZE) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "HTML content exceeds 512KB limit" }) }], isError: true }
      }

      const id = nanoid(16)
      const title = typeof args.title === "string" ? args.title : ""

      await db.insert(posts).values({ id, html: args.html, userId, title })

      return {
        content: [{ type: "text" as const, text: JSON.stringify({ id, url: `${BASE_URL}/p/${id}` }, null, 2) }],
      }
    }

    case "replace_post": {
      if (!args?.id || typeof args.id !== "string" || !args?.html || typeof args.html !== "string") {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "id and html are required" }) }], isError: true }
      }
      if (args.html.length > MAX_HTML_SIZE) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "HTML content exceeds 512KB limit" }) }], isError: true }
      }

      const existing = (await db
        .select()
        .from(posts)
        .where(and(eq(posts.id, args.id), eq(posts.userId, userId)))
        .limit(1))[0]

      if (!existing) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Post not found" }) }], isError: true }
      }

      await db
        .update(posts)
        .set({
          html: args.html,
          title: typeof args.title === "string" ? args.title : existing.title,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, args.id))

      return {
        content: [{ type: "text" as const, text: JSON.stringify({ id: args.id, url: `${BASE_URL}/p/${args.id}` }, null, 2) }],
      }
    }

    case "delete_post": {
      if (!args?.id || typeof args.id !== "string") {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "id is required" }) }], isError: true }
      }

      const existing = (await db
        .select()
        .from(posts)
        .where(and(eq(posts.id, args.id), eq(posts.userId, userId)))
        .limit(1))[0]

      if (!existing) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Post not found" }) }], isError: true }
      }

      await db.delete(posts).where(eq(posts.id, args.id))

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

// ── Run MCP server ──────────────────────────────────────────────────────────

export async function runMcp(request: Request, userId: string) {
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

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })

  await server.connect(transport)
  return transport.handleRequest(request)
}
