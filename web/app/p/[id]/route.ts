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

// safe: `</` inside the JSON payload can't prematurely close the script tag —
// browsers only scan for the literal byte sequence "</script", so escaping
// just the "<" of "</" is sufficient and keeps the JSON otherwise untouched.
const DATA_SCRIPT = (data: unknown) =>
  `<script type="application/json" id="__ph_data">${JSON.stringify(data ?? {}).replace(/</g, "\\u003c")}</script>`;

// Minimal auto-bind runtime: fills {{field}} text, data-bind-attr="attr:path",
// and <template data-each="path"> loops from __ph_data. No fetch, no user JS
// required for the common case — posts can still write their own script and
// ignore this entirely if they need more than flat/loop binding.
const RUNTIME_SCRIPT = `<script>
(function () {
  var el = document.getElementById("__ph_data");
  if (!el) return;
  var data;
  try { data = JSON.parse(el.textContent); } catch (e) { return; }

  function get(obj, path) {
    return path.split(".").reduce(function (o, k) {
      return o == null ? undefined : o[k];
    }, obj);
  }

  function interpolate(text, ctx) {
    return text.replace(/\\{\\{\\s*([\\w.]+)\\s*\\}\\}/g, function (_, path) {
      var v = path === "this" ? ctx : get(ctx, path);
      return v == null ? "" : String(v);
    });
  }

  function bind(root, ctx) {
    root.querySelectorAll("template[data-each]").forEach(function (tpl) {
      var items = get(ctx, tpl.getAttribute("data-each")) || [];
      var frag = document.createDocumentFragment();
      items.forEach(function (item) {
        var wrapper = document.createElement("div");
        wrapper.appendChild(tpl.content.cloneNode(true));
        bind(wrapper, item);
        while (wrapper.firstChild) frag.appendChild(wrapper.firstChild);
      });
      tpl.replaceWith(frag);
    });

    root.querySelectorAll("[data-bind-attr]").forEach(function (node) {
      node.getAttribute("data-bind-attr").split(";").forEach(function (pair) {
        var parts = pair.split(":");
        var attr = (parts[0] || "").trim();
        var path = (parts[1] || "").trim();
        if (!attr || !path) return;
        var v = get(ctx, path);
        if (v != null) node.setAttribute(attr, v);
      });
    });

    root.querySelectorAll("*").forEach(function (node) {
      if (node.tagName === "TEMPLATE") return;
      Array.prototype.forEach.call(node.childNodes, function (child) {
        if (child.nodeType === 3 && child.textContent.indexOf("{{") !== -1) {
          child.textContent = interpolate(child.textContent, ctx);
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bind(document.body, data);
  });
})();
</script>`;

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

  const scripts = `${DATA_SCRIPT(plan.data)}\n${RUNTIME_SCRIPT}`;
  const injected = plan.html.includes("</body>")
    ? plan.html.replace("</body>", `${scripts}\n</body>`)
    : `${plan.html}\n${scripts}`;

  return new NextResponse(injected, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
