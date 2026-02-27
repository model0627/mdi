import { NextResponse } from 'next/server';
import { mdStore } from '@/lib/mdStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  await mdStore.init();
  const { members, tasks } = mdStore.getAll();

  const result = members.map((member) => {
    const mtasks = tasks.filter((t) => t.assigneeId === member.id);
    return { ...member, tasks: mtasks };
  });

  return NextResponse.json(result);
}
