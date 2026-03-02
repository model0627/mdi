import { NextRequest, NextResponse } from 'next/server';
import { mdStore } from '@/lib/mdStore';

export const dynamic = 'force-dynamic';

const ALLOWED_FIELDS = ['currentActivity', 'status'] as const;
type AllowedField = typeof ALLOWED_FIELDS[number];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await mdStore.init();
  const { id } = await params;
  const member = mdStore.members.get(id);
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(member);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await mdStore.init();
  const { id } = await params;

  if (!mdStore.members.has(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json() as Partial<Record<AllowedField, string>>;

  // Only update allowed fields
  const updates: [AllowedField, string][] = [];
  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      updates.push([field, body[field] ?? '']);
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  }

  for (const [field, value] of updates) {
    await mdStore.updateMemberField(id, field, value);
  }

  const updated = mdStore.members.get(id);
  return NextResponse.json(updated ?? { id, updated: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await mdStore.init();
  const { id } = await params;

  if (!mdStore.members.has(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  mdStore.members.delete(id);
  mdStore.deleteMemberFile(id);
  mdStore.broadcast('member:delete', { id });

  return NextResponse.json({ deleted: id });
}
