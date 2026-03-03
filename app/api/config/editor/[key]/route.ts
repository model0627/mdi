import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const IS_VERCEL = process.env.VERCEL === '1';

const ALLOWED_KEYS = ['global-claude', 'project-claude', 'memory'];
const DIR = path.join(process.cwd(), 'data', 'config');

const filePath = (key: string) => path.join(DIR, `editor-${key}.md`);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  if (IS_VERCEL) return NextResponse.json({ vercel: true }, { status: 503 });

  const { key } = await params;
  if (!ALLOWED_KEYS.includes(key)) return NextResponse.json({ error: 'Unknown key' }, { status: 404 });

  const fp = filePath(key);
  const content = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf-8') : '';
  return NextResponse.json({ content });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  if (IS_VERCEL) return NextResponse.json({ vercel: true }, { status: 503 });

  const { key } = await params;
  if (!ALLOWED_KEYS.includes(key)) return NextResponse.json({ error: 'Unknown key' }, { status: 404 });

  const { content } = await req.json() as { content: string };
  if (typeof content !== 'string') return NextResponse.json({ error: 'content required' }, { status: 400 });

  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(filePath(key), content, 'utf-8');
  return NextResponse.json({ ok: true });
}
