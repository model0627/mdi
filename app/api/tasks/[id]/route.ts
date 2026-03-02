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

  // Read body: prefer file content, fall back to in-memory body
  const filePath = path.join(process.cwd(), 'data', 'tasks', `${id}.md`);
  let body = (task as Task & { body?: string }).body ?? '';
  if (fs.existsSync(filePath)) {
    const fileBody = matter(fs.readFileSync(filePath, 'utf-8')).content.trim();
    if (fileBody) body = fileBody;
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

  const raw = await req.json() as Partial<Task> & { body?: string };
  const { body: bodyContent, ...taskFields } = raw;
  const updated: Task = { ...existing, ...taskFields, id };

  // Auto-track actual work time
  const now = new Date().toISOString();
  if (taskFields.status === 'progress' && !existing.actualStart) {
    updated.actualStart = now;
  }
  if (taskFields.status === 'done' && !updated.actualEnd) {
    updated.actualEnd = now;
  }

  const updatedWithBody = bodyContent !== undefined
    ? { ...updated, body: bodyContent } as Task & { body: string }
    : updated;
  mdStore.tasks.set(id, updatedWithBody as Task);
  if (bodyContent !== undefined) {
    mdStore.writeTaskBodyContent(updated, bodyContent);
  } else {
    mdStore.writeTaskFile(updated);
  }
  mdStore.broadcast('task:update', updated);

  // WebSocket push: notify assignee on assignment change
  if (taskFields.assigneeId && taskFields.assigneeId !== existing.assigneeId) {
    wsManager.notify(taskFields.assigneeId, {
      type: 'task_assigned',
      task: { id, title: updated.title, priority: updated.priority },
    });
  }

  // WebSocket push: notify reviewer when task moves to review
  // reviewer is not in the core Task type but may exist in file frontmatter
  const reviewer = (updated as unknown as Record<string, unknown>).reviewer as string | undefined;
  if (taskFields.status === 'review' && reviewer) {
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
