import { NextRequest, NextResponse } from 'next/server';
import { mdStore } from '@/lib/mdStore';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await mdStore.init();
  const { id } = await params;
  const project = mdStore.projects.get(id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(project);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await mdStore.init();
  const { id } = await params;
  if (!mdStore.projects.has(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  mdStore.projects.delete(id);
  mdStore.deleteProjectFile(id);
  mdStore.broadcast('project:delete', { id });

  return NextResponse.json({ deleted: id });
}
