import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

const IS_VERCEL = process.env.VERCEL === '1';

const FILE_MAP: Record<string, string> = {
  'global-claude': path.join(os.homedir(), '.claude', 'CLAUDE.md'),
  'project-claude': path.join(process.cwd(), 'CLAUDE.md'),
  'memory': path.join(
    os.homedir(), '.claude', 'projects',
    '-Users-shawn-Desktop-claude-code-mdi',
    'memory', 'MEMORY.md'
  ),
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  if (IS_VERCEL) {
    return NextResponse.json({ localOnly: true }, { status: 503 });
  }

  const { name } = await params;
  const filePath = FILE_MAP[name];
  if (!filePath) {
    return NextResponse.json({ error: 'Unknown file' }, { status: 404 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found', path: filePath }, { status: 404 });
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const stat = fs.statSync(filePath);
  return NextResponse.json({
    content,
    path: filePath,
    size: stat.size,
    lastModified: stat.mtime.toISOString(),
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  if (IS_VERCEL) {
    return NextResponse.json({ localOnly: true }, { status: 503 });
  }

  const { name } = await params;
  const filePath = FILE_MAP[name];
  if (!filePath) {
    return NextResponse.json({ error: 'Unknown file' }, { status: 404 });
  }

  const { content } = await req.json() as { content: string };
  if (typeof content !== 'string') {
    return NextResponse.json({ error: 'content required' }, { status: 400 });
  }

  // Backup before overwrite
  let backupPath: string | null = null;
  if (fs.existsSync(filePath)) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    backupPath = `${filePath}.backup.${ts}`;
    fs.copyFileSync(filePath, backupPath);
  } else {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  return NextResponse.json({ success: true, backupPath });
}
