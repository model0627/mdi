import { NextRequest, NextResponse } from 'next/server';
import { mdStore } from '@/lib/mdStore';
import type { Task } from '@/lib/data';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const dynamic = 'force-dynamic';

const SHARES_DIR = path.join(process.cwd(), 'data', 'shares');

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const tokenFile = path.join(SHARES_DIR, `${token}.json`);
  if (!fs.existsSync(tokenFile)) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 });
  }

  let shareData: { taskId: string; title: string; createdAt: string };
  try {
    shareData = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
  } catch {
    return NextResponse.json({ error: 'Invalid share' }, { status: 500 });
  }

  await mdStore.init();
  const task = mdStore.tasks.get(shareData.taskId);
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  // Read body from file
  const filePath = path.join(process.cwd(), 'data', 'tasks', `${shareData.taskId}.md`);
  let body = (task as Task & { body?: string }).body ?? '';
  if (fs.existsSync(filePath)) {
    const fileBody = matter(fs.readFileSync(filePath, 'utf-8')).content.trim();
    if (fileBody) body = fileBody;
  }

  return NextResponse.json({ ...task, body, sharedAt: shareData.createdAt });
}
