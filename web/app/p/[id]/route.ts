import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUserId } from "@/lib/auth-user";

export const dynamic = "force-dynamic";

const PRIVATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Private plan</title>
<style>body{font-family:ui-monospace,monospace;background:#0a0a0a;color:#e8e8e8;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}main{text-align:center;padding:2rem}svg{opacity:.5}h1{font-size:1.25rem;margin:.75rem 0 .5rem}.msg{color:#888;max-width:22rem;font-size:.85rem}.home{border:1px solid #333;color:#888;padding:.5rem 1rem;border-radius:2px;text-decoration:none;display:inline-block;margin-top:1rem}.home:hover{color:#e8e8e8;border-color:#444}</style>
</head>
<body><main>
<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
<h1>This plan is private</h1>
<p class="msg">The owner has marked this plan as private. Sign in with the owner account to view it.</p>
<a class="home" href="/">Go home</a>
</main></body></html>`;

const DATA_SCRIPT = (data: unknown) =>
  `<script type="application/json" id="__ph_data">${JSON.stringify(data ?? {})}</script>`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const plan = await db
    .select({ html: plans.html, data: plans.data, isPrivate: plans.isPrivate, userId: plans.userId })
    .from(plans)
    .where(eq(plans.id, id))
    .then((rows) => rows[0]);

  if (!plan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Gate private plans to the owner only
  if (plan.isPrivate) {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return new NextResponse(PRIVATE_HTML, { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (plan.userId !== userId) {
      return new NextResponse(PRIVATE_HTML, { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
  }

  const injected = plan.html.replace(
    "</body>",
    `${DATA_SCRIPT(plan.data)}\n</body>`
  );

  return new NextResponse(injected, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
