import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid"
import { db } from "@/db/schema"
import { redis } from "@/lib/redis"


export async function POST(request: NextRequest) {
  // Create plan
  // Auth: Bearer token
  // Body: { html: string, slug?: string, title?: string }
  // Returns: { url, id }
  return NextResponse.json({ message: "not implemented" }, { status: 501 });
}

export async function GET(request: NextRequest) {
  // List plans
  // Auth: Bearer token
  // Returns: [{ id, slug, title, views, created, updated }]
  return NextResponse.json({ message: "not implemented" }, { status: 501 });
}

export async function DELETE(request: NextRequest) {
  // Delete all plans for this token
  // Auth: Bearer token
  return NextResponse.json({ message: "not implemented" }, { status: 501 });
}
