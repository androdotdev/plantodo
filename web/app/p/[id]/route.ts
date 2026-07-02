import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { b2 } from "@/lib/b2";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const plan = await db
    .select({ b2Key: plans.b2Key })
    .from(plans)
    .where(eq(plans.id, id))
    .then((rows) => rows[0]);

  if (!plan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const html = await b2.fetch(plan.b2Key);
  if (!html) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
