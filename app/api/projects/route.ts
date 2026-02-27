import { NextResponse } from 'next/server';
import { mdStore } from '@/lib/mdStore';

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
