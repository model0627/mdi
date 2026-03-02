import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'config', 'mdi-config.json');

export async function GET() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return NextResponse.json({ version: 0 });
  }

  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) as { version: number };
    return NextResponse.json({ version: config.version ?? 0 });
  } catch {
    return NextResponse.json({ version: 0 });
  }
}
