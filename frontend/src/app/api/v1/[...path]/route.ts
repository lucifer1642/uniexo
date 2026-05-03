import { NextRequest, NextResponse } from 'next/server';

/**
 * Catch-all proxy: forwards /api/v1/* → BACKEND_URL/api/v1/*
 *
 * Set BACKEND_URL in Vercel Environment Variables, e.g.
 *   https://uniexo-backend.vercel.app
 * If not set, falls back to localhost:5000 (local dev).
 */

const isProd = process.env.NODE_ENV === 'production';
const BACKEND = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ||
  (isProd ? '' : 'http://localhost:5000')
).replace(/\/$/, '');

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (!BACKEND) {
    console.error('[API Proxy] BACKEND_URL environment variable is missing in production.');
    return NextResponse.json(
      { success: false, message: 'Server Configuration Error: BACKEND_URL is not set.' },
      { status: 500 }
    );
  }

  const { path } = await params;
  const targetUrl = `${BACKEND}/api/v1/${path.join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  // Forward relevant headers
  req.headers.forEach((value, key) => {
    if (['content-type', 'authorization', 'cookie', 'accept'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  let body: BodyInit | null = null;
  if (!['GET', 'HEAD', 'DELETE'].includes(req.method)) {
    body = await req.text();
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      // @ts-ignore
      duplex: 'half',
    });

    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('[API Proxy] Error:', err);
    return NextResponse.json({ success: false, message: 'Backend unreachable' }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
