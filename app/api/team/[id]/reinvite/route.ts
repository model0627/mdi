import { NextRequest, NextResponse } from 'next/server';
import { mdStore } from '@/lib/mdStore';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await mdStore.init();
  const { id } = await params;

  const member = mdStore.members.get(id);
  if (!member) {
    return NextResponse.json({ error: `Member "${id}" not found` }, { status: 404 });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Self-contained base64url token — works on Vercel without file storage
  const payload = {
    v: 1,
    memberId: member.id,
    memberName: member.name,
    initials: member.initials,
    role: member.role,
    avatarColor: member.avatarColor,
    createdAt: now.toISOString(),
    expiresAt,
  };
  const token = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
  const baseUrl = `${proto}://${host}`;
  const inviteUrl = `${baseUrl}/invite/${token}`;
  const setupUrl = `${baseUrl}/api/invites/${token}/setup.sh`;

  return NextResponse.json({ token, inviteUrl, setupUrl, expiresAt }, { status: 201 });
}
