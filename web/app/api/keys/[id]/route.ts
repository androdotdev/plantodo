import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

// GET — uses query, not body
export async function GET(_req: NextRequest, { params }: {params: Promise<{id: string}> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  
  const { id } = await params
  
  const key = await auth.api.getApiKey({
    query: { id},
    headers: await headers()
  })

  return NextResponse.json({ key })
}

// PATCH — uses body
export async function PATCH(req: NextRequest, { params }: {params: Promise<{id: string}> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id } = await params
  const key = await auth.api.updateApiKey({
    body: { keyId: id, ...body }
  })

  return NextResponse.json({ key })
}

// DELETE — uses body + headers
export async function DELETE(_req: NextRequest, { params }: {params: Promise<{id: string}> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { id } = await params

  await auth.api.deleteApiKey({
    body: { keyId: id },
    headers: await headers()
  })

  return NextResponse.json({ ok: true })
}
