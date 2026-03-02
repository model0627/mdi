import { NextRequest, NextResponse } from 'next/server';
import { mdStore } from '@/lib/mdStore';
import type { Project } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  await mdStore.init();
  const { projects, tasks } = mdStore.getAll();

  const result = projects.map((project) => {
    const ptasks = tasks.filter((t) => t.projectId === project.id);
    const done = ptasks.filter(
      (t) => t.status === 'done' || t.status === 'cancelled'
    ).length;
    const progress = ptasks.length > 0 ? Math.round((done / ptasks.length) * 100) : 0;

    const taskCountByStatus = {
      backlog: ptasks.filter((t) => t.status === 'backlog').length,
      progress: ptasks.filter((t) => t.status === 'progress').length,
      review: ptasks.filter((t) => t.status === 'review').length,
      done: ptasks.filter((t) => t.status === 'done').length,
      cancelled: ptasks.filter((t) => t.status === 'cancelled').length,
    };

    return { ...project, progress, taskCount: ptasks.length, taskCountByStatus };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  await mdStore.init();
  const body = await req.json() as Partial<Project>;

  if (!body.id || !body.name) {
    return NextResponse.json({ error: 'id and name are required' }, { status: 400 });
  }

  const project: Project = {
    id: body.id,
    name: body.name,
    description: body.description ?? '',
    color: body.color ?? '#4f8ef7',
    memberIds: body.memberIds ?? [],
    taskIds: [],
    startDate: body.startDate ?? new Date().toISOString().slice(0, 10),
    endDate: body.endDate ?? '',
  };

  mdStore.projects.set(project.id, project);
  mdStore.writeProjectFile(project);
  mdStore.broadcast('project:create', project);

  return NextResponse.json(project, { status: 201 });
}
