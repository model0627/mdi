import { NextRequest, NextResponse } from 'next/server';
import { put, head, del } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ALLOWED_KEYS = ['global-claude', 'project-claude', 'memory'];
const BLOB_PREFIX = 'config-editor';
const LOCAL_DIR = path.join(process.cwd(), 'data', 'config');

const localPath = (key: string) => path.join(LOCAL_DIR, `editor-${key}.md`);
const blobPath = (key: string) => `${BLOB_PREFIX}/${key}.md`;
const hasBlobToken = () => !!process.env.BLOB_READ_WRITE_TOKEN;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  if (!ALLOWED_KEYS.includes(key)) return NextResponse.json({ error: 'Unknown key' }, { status: 404 });

  // Vercel Blob
  if (hasBlobToken()) {
    try {
      const info = await head(blobPath(key)).catch(() => null);
      if (info) {
        const res = await fetch(info.downloadUrl);
        const content = await res.text();
        return NextResponse.json({ content, source: 'blob' });
      }
      return NextResponse.json({ content: '', source: 'blob' });
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }

  // Local fallback
  const fp = localPath(key);
  const content = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf-8') : '';
  return NextResponse.json({ content, source: 'local' });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  if (!ALLOWED_KEYS.includes(key)) return NextResponse.json({ error: 'Unknown key' }, { status: 404 });

  const { content } = await req.json() as { content: string };
  if (typeof content !== 'string') return NextResponse.json({ error: 'content required' }, { status: 400 });

  // Vercel Blob
  if (hasBlobToken()) {
    if (content === '') {
      await del(blobPath(key)).catch(() => null);
      return NextResponse.json({ ok: true, source: 'blob' });
    }
    await put(blobPath(key), content, { access: 'public', addRandomSuffix: false });
    return NextResponse.json({ ok: true, source: 'blob' });
  }

  // Local fallback
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
  fs.writeFileSync(localPath(key), content, 'utf-8');
  return NextResponse.json({ ok: true, source: 'local' });
}
