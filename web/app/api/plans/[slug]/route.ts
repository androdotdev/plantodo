import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Delete plan by slug
  // Auth: Bearer token
  const { slug } = await params;
  return NextResponse.json({ message: "not implemented", slug }, { status: 501 });
}
