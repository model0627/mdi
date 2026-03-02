import { NextRequest, NextResponse } from 'next/server';
import { mdStore } from '@/lib/mdStore';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const INVITES_DIR = path.join(process.cwd(), 'data', 'invites');

interface Invite {
  token: string;
  memberId: string;
  memberName: string;
  initials: string;
  role: string;
  avatarColor: number;
  status: 'pending' | 'used' | 'expired' | 'cancelled';
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
}

function readInvite(token: string): Invite | null {
  const filePath = path.join(INVITES_DIR, `${token}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Invite;
  } catch {
    return null;
  }
}

function writeInvite(invite: Invite) {
  const filePath = path.join(INVITES_DIR, `${invite.token}.json`);
  fs.writeFileSync(filePath, JSON.stringify(invite, null, 2), 'utf-8');
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  await mdStore.init();
  const { token } = await params;
  const invite = readInvite(token);

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }

  if (invite.status === 'used') {
    return NextResponse.json({ error: 'Invite has already been used' }, { status: 410 });
  }

  if (invite.status === 'cancelled') {
    return NextResponse.json({ error: 'Invite has been cancelled' }, { status: 410 });
  }

  if (new Date(invite.expiresAt) < new Date()) {
    invite.status = 'expired';
    writeInvite(invite);
    return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
  }

  // Mark invite as used
  invite.status = 'used';
  invite.usedAt = new Date().toISOString();
  writeInvite(invite);

  // Update member status to active
  await mdStore.updateMemberField(invite.memberId, 'status', 'active');

  const updatedMember = mdStore.members.get(invite.memberId);
  return NextResponse.json({ success: true, member: updatedMember });
}
