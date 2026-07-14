import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const plan = await db
    .select({ html: plans.html })
    .from(plans)
    .where(eq(plans.id, id))
    .then((rows) => rows[0]);

  if (!plan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(plan.html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
