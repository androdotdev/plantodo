import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

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

export async function POST(request: NextRequest) {
  const apiKey = await verifyKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { html, title } = await request.json();
  if (!html || typeof html !== "string") {
    return NextResponse.json({ error: "html is required" }, { status: 400 });
  }
  const id = nanoid(16);

  await db.insert(plans).values({
    id,
    html,
    keyId: apiKey.id,
    title: title ?? "",
  });

  return NextResponse.json({
    id,
    url: `${BASE_URL}/p/${id}`,
    title: title ?? "",
  });
}

export async function GET(request: NextRequest) {
  const apiKey = await verifyKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await db
    .select({
      id: plans.id,
      title: plans.title,
      createdAt: plans.createdAt,
      updatedAt: plans.updatedAt,
    })
    .from(plans)
    .where(eq(plans.keyId, apiKey.id))
    .orderBy(plans.createdAt);

  return NextResponse.json(list);
}

export async function DELETE(request: NextRequest) {
  const apiKey = await verifyKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.delete(plans).where(eq(plans.keyId, apiKey.id));
  return NextResponse.json({ success: true });
}