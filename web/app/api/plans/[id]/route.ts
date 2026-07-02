import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { b2 } from "@/lib/b2";
import { eq } from "drizzle-orm";

async function verifyKey(request: NextRequest) {
  const key = request.headers.get("x-api-key");
  if (!key) return null;
  try {
    const result = await auth.api.verifyApiKey({ body: { key } });
    if (!result.valid || !result.key) return null;
    return { id: result.key.id };
  } catch {
    return null;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = await verifyKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const plan = await db
    .select({ b2Key: plans.b2Key, keyId: plans.keyId })
    .from(plans)
    .where(eq(plans.id, id))
    .then((rows) => rows[0]);

  if (!plan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (plan.keyId !== apiKey.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Promise.all([
    b2.delete(plan.b2Key).catch(() => {}),
    db.delete(plans).where(eq(plans.id, id)),
  ]);

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = await verifyKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { html } = await request.json();

  if (!html || typeof html !== "string") {
    return NextResponse.json({ error: "html is required" }, { status: 400 });
  }

  const plan = await db
    .select({ b2Key: plans.b2Key, keyId: plans.keyId })
    .from(plans)
    .where(eq(plans.id, id))
    .then((rows) => rows[0]);

  if (!plan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (plan.keyId !== apiKey.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await b2.upload(plan.b2Key, html);
  await db.update(plans).set({}).where(eq(plans.id, id));

  const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return NextResponse.json({ id, url: `${BASE_URL}/p/${id}` });
}