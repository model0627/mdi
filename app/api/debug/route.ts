import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list();
    return NextResponse.json({
      count: blobs.length,
      blobs: blobs.map(b => ({ pathname: b.pathname, size: b.size })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
