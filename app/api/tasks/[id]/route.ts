import { NextRequest, NextResponse } from 'next/server';
import { mdStore } from '@/lib/mdStore';
import { wsManager } from '@/lib/wsManager';
import type { Task } from '@/lib/data';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await mdStore.init();
  const { id } = await params;
  const task = mdStore.tasks.get(id);
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Read body from MD file
  const filePath = path.join(process.cwd(), 'data', 'tasks', `${id}.md`);
  let body = '';
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    body = matter(raw).content.trim();
  }
  return NextResponse.json({ ...task, body });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await mdStore.init();
  const { id } = await params;
  const existing = mdStore.tasks.get(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as Partial<Task>;
  const updated: Task = { ...existing, ...body, id };

  // Auto-track actual work time
  const now = new Date().toISOString();
  if (body.status === 'progress' && !existing.actualStart) {
    updated.actualStart = now;
  }
  if (body.status === 'done' && !updated.actualEnd) {
    updated.actualEnd = now;
  }

  mdStore.tasks.set(id, updated);
  mdStore.writeTaskFile(updated);
  mdStore.broadcast('task:update', updated);

  // WebSocket push: notify assignee on assignment change
  if (body.assigneeId && body.assigneeId !== existing.assigneeId) {
    wsManager.notify(body.assigneeId, {
      type: 'task_assigned',
      task: { id, title: updated.title, priority: updated.priority },
    });
  }

  // WebSocket push: notify reviewer when task moves to review
  // reviewer is not in the core Task type but may exist in file frontmatter
  const reviewer = (updated as unknown as Record<string, unknown>).reviewer as string | undefined;
  if (body.status === 'review' && reviewer) {
    wsManager.notify(reviewer, {
      type: 'task_review',
      task: { id, title: updated.title },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await mdStore.init();
  const { id } = await params;
  if (!mdStore.tasks.has(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  mdStore.tasks.delete(id);
  mdStore.archiveTaskFile(id);
  mdStore.broadcast('task:delete', { id });

  return NextResponse.json({ deleted: id });
}
