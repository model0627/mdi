import { NextRequest, NextResponse } from 'next/server';
import { mdStore } from '@/lib/mdStore';
import type { Task } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  await mdStore.init();
  const { tasks } = mdStore.getAll();
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  await mdStore.init();
  const body = await req.json() as Partial<Task>;

  if (!body.id || !body.title) {
    return NextResponse.json({ error: 'id and title are required' }, { status: 400 });
  }

  const task: Task = {
    id: body.id,
    title: body.title,
    status: body.status ?? 'backlog',
    priority: body.priority ?? 'medium',
    assigneeId: body.assigneeId ?? '',
    projectId: body.projectId ?? '',
    created: body.created ?? new Date().toISOString(),
    due: body.due ?? '',
    startDate: body.startDate ?? new Date().toISOString(),
    ...(body.description ? { description: body.description } : {}),
  };

  mdStore.tasks.set(task.id, task);
  await mdStore.writeTaskFile(task);
  mdStore.broadcast('task:create', task);

  return NextResponse.json(task, { status: 201 });
}
