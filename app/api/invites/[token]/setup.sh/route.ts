import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Try self-contained base64url token first (Vercel-compatible, no storage needed)
  let invite: Invite | null = tryDecodeToken(token);

  if (!invite) {
    const filePath = path.join(INVITES_DIR, `${token}.json`);
    if (!fs.existsSync(filePath)) {
      return new NextResponse('# Error: Invite not found\nexit 1\n', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
    try {
      invite = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Invite;
    } catch {
      return new NextResponse('# Error: Failed to read invite\nexit 1\n', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  }

  if (invite.status !== 'pending') {
    return new NextResponse(`# Error: Invite is ${invite.status}\nexit 1\n`, {
      status: 410,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  if (new Date(invite.expiresAt) < new Date()) {
    return new NextResponse('# Error: Invite has expired\nexit 1\n', {
      status: 410,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
  const baseUrl = `${proto}://${host}`;
  const { memberId } = invite;

  const script = `#!/bin/bash
# MDI Setup Script — Member: ${memberId}
# Generated: ${new Date().toISOString()}

set -e

MDI_SERVER="${baseUrl}"
MDI_MEMBER_ID="${memberId}"
TOKEN="${token}"
CLAUDE_GLOBAL="$HOME/.claude/CLAUDE.md"

echo "=== MDI Setup for ${invite.memberName} ==="
echo "Server: $MDI_SERVER"
echo "Member ID: $MDI_MEMBER_ID"
echo ""

# Ensure CLAUDE.md exists
if [ ! -f "$CLAUDE_GLOBAL" ]; then
  mkdir -p "$(dirname "$CLAUDE_GLOBAL")"
  touch "$CLAUDE_GLOBAL"
fi

# Remove existing MDI block if present
if grep -q "MDI_BLOCK_END" "$CLAUDE_GLOBAL" 2>/dev/null; then
  echo "Removing existing MDI block..."
  # Use python3 for reliable cross-platform block removal
  python3 -c "
import re, sys
content = open('$CLAUDE_GLOBAL').read()
# Remove block from ## MDI 대시보드 to <!-- MDI_BLOCK_END -->
cleaned = re.sub(r'## MDI 대시보드.*?<!-- MDI_BLOCK_END -->', '', content, flags=re.DOTALL)
open('$CLAUDE_GLOBAL', 'w').write(cleaned.strip() + '\\n')
"
fi

# Append new MDI block
cat >> "$CLAUDE_GLOBAL" << 'MDIBLOCKSEP'

## MDI 대시보드 — 작업 상태 추적

MDI_SERVER: ${baseUrl}
MDI_MEMBER_ID: ${memberId}

**모든 응답의 첫 번째 액션** — currentActivity 설정 (한국어, 20자 이내):
\`\`\`
curl -s -X PATCH ${baseUrl}/api/team/${memberId} \\
  -H 'Content-Type: application/json' \\
  -d '{"currentActivity":"[작업내용] 중"}' > /dev/null 2>&1 &
\`\`\`

**사용자에게 최종 답변 직전** — currentActivity 초기화:
\`\`\`
curl -s -X PATCH ${baseUrl}/api/team/${memberId} \\
  -H 'Content-Type: application/json' \\
  -d '{"currentActivity":""}' > /dev/null 2>&1 &
\`\`\`

단순 질문이라도 예외 없이 적용한다.
<!-- MDI_BLOCK_END -->
MDIBLOCKSEP

echo "MDI block added to $CLAUDE_GLOBAL"

# Activate invite
echo "Activating invite..."
RESPONSE=$(curl -s -w "\\n%{http_code}" -X POST "$MDI_SERVER/api/invites/$TOKEN/activate" \\
  -H 'Content-Type: application/json')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "Invite activated successfully!"
else
  echo "Warning: Activation returned HTTP $HTTP_CODE: $BODY"
fi

echo ""
echo "=== Setup complete! ==="
echo "Your member ID is: $MDI_MEMBER_ID"
echo "Please restart Claude Code for changes to take effect."
`;

  return new NextResponse(script, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="mdi-setup-${memberId}.sh"`,
    },
  });
}
