import { NextRequest, NextResponse } from 'next/server';
import { mdStore } from '@/lib/mdStore';
import crypto from 'crypto';
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

  // Cancel any existing pending invites for this member
  if (fs.existsSync(INVITES_DIR)) {
    const files = fs.readdirSync(INVITES_DIR).filter(f => f.endsWith('.json'));
    for (const f of files) {
      try {
        const filePath = path.join(INVITES_DIR, f);
        const inv = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Invite;
        if (inv.memberId === id && inv.status === 'pending') {
          inv.status = 'cancelled';
          fs.writeFileSync(filePath, JSON.stringify(inv, null, 2), 'utf-8');
        }
      } catch {
        // skip malformed files
      }
    }
  } else {
    fs.mkdirSync(INVITES_DIR, { recursive: true });
  }

  const token = crypto.randomBytes(16).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const invite: Invite = {
    token,
    memberId: member.id,
    memberName: member.name,
    initials: member.initials,
    role: member.role,
    avatarColor: member.avatarColor,
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt,
  };

  fs.writeFileSync(
    path.join(INVITES_DIR, `${token}.json`),
    JSON.stringify(invite, null, 2),
    'utf-8'
  );

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
  const inviteUrl = `${proto}://${host}/invite/${token}`;

  return NextResponse.json({ ...invite, inviteUrl }, { status: 201 });
}
