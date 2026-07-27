import { NextRequest, NextResponse } from 'next/server'

/* §12.2 The API proxy — adopted from Common Sage, and the main reason
 * §13.1 stays on Next.js rather than dropping to a static SPA. All requests
 * go through /api/v1/* to a server-side route, keeping tokens
 * server-adjacent and sidestepping CORS.
 *
 * Components do not call this yet — they resolve from fixtures via
 * lib/api/client.ts. Switching over means changing that one adapter. */

const BACKEND = process.env.COMMON_SAGE_API ?? 'http://localhost:8000'

async function forward(req: NextRequest, path: string[]) {
  const url = new URL(`/api/v1/${path.join('/')}`, BACKEND)
  url.search = req.nextUrl.search

  const headers = new Headers(req.headers)
  headers.delete('host')

  // The session token stays server-side; the browser never holds it.
  const token = req.cookies.get('cs_session')?.value
  if (token) headers.set('authorization', `Bearer ${token}`)

  try {
    const res = await fetch(url, {
      method: req.method,
      headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text(),
      cache: 'no-store',
    })

    return new NextResponse(res.body, {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    })
  } catch {
    // §11.13: one normalised error shape, so error states stay uniform.
    return NextResponse.json(
      { error: 'The server could not be reached.', retryable: true },
      { status: 502 },
    )
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await ctx.params).path)
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await ctx.params).path)
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await ctx.params).path)
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await ctx.params).path)
}
