import { NextRequest, NextResponse } from 'next/server';
import { mdStore } from '@/lib/mdStore';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const SHARES_DIR = path.join(process.cwd(), 'data', 'shares');

function ensureSharesDir() {
  if (!fs.existsSync(SHARES_DIR)) fs.mkdirSync(SHARES_DIR, { recursive: true });
}

// GET /api/tasks/[id]/share — return existing share token if any
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  ensureSharesDir();
  const files = fs.readdirSync(SHARES_DIR);
  const match = files.find((f) => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(SHARES_DIR, f), 'utf-8'));
      return data.taskId === id;
    } catch { return false; }
  });
  if (!match) return NextResponse.json({ token: null });
  const token = match.replace('.json', '');
  return NextResponse.json({ token });
}

// POST /api/tasks/[id]/share — create (or reuse) a share token
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await mdStore.init();
  const { id } = await params;
  const task = mdStore.tasks.get(id);
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  ensureSharesDir();

  // Reuse existing token if already shared
  const files = fs.readdirSync(SHARES_DIR);
  const existing = files.find((f) => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(SHARES_DIR, f), 'utf-8'));
      return data.taskId === id;
    } catch { return false; }
  });
  if (existing) {
    return NextResponse.json({ token: existing.replace('.json', '') });
  }

  const token = crypto.randomBytes(16).toString('hex');
  fs.writeFileSync(
    path.join(SHARES_DIR, `${token}.json`),
    JSON.stringify({ taskId: id, title: task.title, createdAt: new Date().toISOString() }, null, 2)
  );
  return NextResponse.json({ token });
}

// DELETE /api/tasks/[id]/share — revoke share
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  ensureSharesDir();
  const files = fs.readdirSync(SHARES_DIR);
  const match = files.find((f) => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(SHARES_DIR, f), 'utf-8'));
      return data.taskId === id;
    } catch { return false; }
  });
  if (match) fs.unlinkSync(path.join(SHARES_DIR, match));
  return NextResponse.json({ deleted: true });
}
