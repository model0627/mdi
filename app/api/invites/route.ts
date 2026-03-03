import { NextRequest, NextResponse } from 'next/server';
import { mdStore } from '@/lib/mdStore';
import type { Member } from '@/lib/data';
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

function ensureInvitesDir() {
  if (!fs.existsSync(INVITES_DIR)) fs.mkdirSync(INVITES_DIR, { recursive: true });
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
  ensureInvitesDir();
  const filePath = path.join(INVITES_DIR, `${invite.token}.json`);
  fs.writeFileSync(filePath, JSON.stringify(invite, null, 2), 'utf-8');
}

export async function GET() {
  await mdStore.init();
  ensureInvitesDir();

  const files = fs.readdirSync(INVITES_DIR).filter(f => f.endsWith('.json'));
  const invites: Invite[] = [];
  for (const f of files) {
    try {
      const invite = JSON.parse(fs.readFileSync(path.join(INVITES_DIR, f), 'utf-8')) as Invite;
      invites.push(invite);
    } catch {
      // skip malformed files
    }
  }

  return NextResponse.json(invites);
}

export async function POST(req: NextRequest) {
  await mdStore.init();

  const body = await req.json() as {
    memberId: string;
    memberName: string;
    initials: string;
    role: string;
    avatarColor: number;
    expiresInDays?: number;
  };

  if (!body.memberId || !body.memberName || !body.initials || !body.role) {
    return NextResponse.json(
      { error: 'memberId, memberName, initials, role are required' },
      { status: 400 }
    );
  }

  // Check for duplicate memberId
  const existing = mdStore.members.get(body.memberId);
  if (existing) {
    return NextResponse.json(
      { error: `Member with id "${body.memberId}" already exists` },
      { status: 409 }
    );
  }

  // Also check if a pending invite already exists for this memberId
  ensureInvitesDir();
  const files = fs.readdirSync(INVITES_DIR).filter(f => f.endsWith('.json'));
  for (const f of files) {
    try {
      const inv = JSON.parse(fs.readFileSync(path.join(INVITES_DIR, f), 'utf-8')) as Invite;
      if (inv.memberId === body.memberId && inv.status === 'pending') {
        return NextResponse.json(
          { error: `A pending invite for memberId "${body.memberId}" already exists` },
          { status: 409 }
        );
      }
    } catch {
      // skip
    }
  }

  const now = new Date();
  const expiresInDays = body.expiresInDays ?? 7;
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  // Self-contained token: embed invite data in base64url so Vercel serverless
  // instances can decode without shared storage
  const payload = {
    v: 1,
    memberId: body.memberId,
    memberName: body.memberName,
    initials: body.initials,
    role: body.role,
    avatarColor: body.avatarColor ?? 0,
    createdAt: now.toISOString(),
    expiresAt,
  };
  const token = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const invite: Invite = {
    token,
    memberId: body.memberId,
    memberName: body.memberName,
    initials: body.initials,
    role: body.role,
    avatarColor: body.avatarColor ?? 0,
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt,
  };

  writeInvite(invite);

  // Create member file with status: offline
  const member: Member = {
    id: body.memberId,
    name: body.memberName,
    initials: body.initials,
    avatarColor: body.avatarColor ?? 0,
    role: body.role,
    status: 'offline',
  };
  mdStore.writeMemberFile(member);
  mdStore.members.set(member.id, member);
  mdStore.broadcast('member:update', member);

  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  const host = req.headers.get('host') ?? 'localhost:3001';
  const inviteUrl = `${proto}://${host}/invite/${token}`;

  return NextResponse.json({ ...invite, inviteUrl }, { status: 201 });
}
