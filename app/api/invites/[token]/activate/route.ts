import { NextRequest, NextResponse } from 'next/server';
import { mdStore } from '@/lib/mdStore';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const IS_VERCEL = process.env.VERCEL === '1';
const INVITES_DIR = IS_VERCEL
  ? '/tmp/mdi/invites'
  : path.join(process.cwd(), 'data', 'invites');

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

function tryDecodeToken(token: string): Invite | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'));
    if (decoded.v === 1 && decoded.memberId && decoded.expiresAt) {
      return {
        token,
        memberId: decoded.memberId,
        memberName: decoded.memberName,
        initials: decoded.initials ?? '',
        role: decoded.role,
        avatarColor: decoded.avatarColor ?? 0,
        status: 'pending',
        createdAt: decoded.createdAt,
        expiresAt: decoded.expiresAt,
      };
    }
  } catch { /* not a base64url token */ }
  return null;
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

  // Try self-contained base64url token first
  const decoded = tryDecodeToken(token);
  const invite = decoded ?? readInvite(token);

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
    if (!decoded) {
      invite.status = 'expired';
      writeInvite(invite);
    }
    return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
  }

  // Mark file-based invite as used (base64url tokens are self-contained, skip)
  if (!decoded) {
    invite.status = 'used';
    invite.usedAt = new Date().toISOString();
    writeInvite(invite);
  }

  // If member doesn't exist in store (writeMemberFile may have failed earlier), create it now
  if (!mdStore.members.has(invite.memberId)) {
    const newMember = {
      id: invite.memberId,
      name: invite.memberName,
      initials: invite.initials,
      avatarColor: invite.avatarColor,
      role: invite.role,
      status: 'active' as const,
      currentActivity: '',
    };
    await mdStore.writeMemberFile(newMember);
    mdStore.members.set(newMember.id, newMember);
    mdStore.broadcast('member:update', newMember);
    return NextResponse.json({ success: true, member: newMember });
  }

  // Update member status to active
  await mdStore.updateMemberField(invite.memberId, 'status', 'active');

  const updatedMember = mdStore.members.get(invite.memberId);
  return NextResponse.json({ success: true, member: updatedMember });
}
