import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'config', 'mdi-config.json');

interface MdiConfig {
  version: number;
  updatedAt: string;
  claudeBlock: string;
}

export async function GET() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return NextResponse.json({ error: 'Config not found' }, { status: 404 });
  }

  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) as MdiConfig;
    const stat = fs.statSync(CONFIG_PATH);
    return NextResponse.json({
      version: config.version ?? 0,
      updatedAt: config.updatedAt ?? stat.mtime.toISOString(),
      claudeBlock: config.claudeBlock ?? '',
      path: CONFIG_PATH,
      size: stat.size,
      lastModified: stat.mtime.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Parse error' }, { status: 500 });
  }
}
