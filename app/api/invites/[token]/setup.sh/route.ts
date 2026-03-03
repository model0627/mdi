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

# ── MEMORY.md 업데이트 (auto-memory: 현재 디렉토리 기준) ──────────────────────
ESCAPED_CWD=$(echo "$PWD" | sed 's|/|-|g')
MEMORY_DIR="$HOME/.claude/projects/\${ESCAPED_CWD}/memory"
MEMORY_FILE="\${MEMORY_DIR}/MEMORY.md"
mkdir -p "$MEMORY_DIR"

if ! grep -q "MDI_SERVER" "$MEMORY_FILE" 2>/dev/null; then
  cat >> "$MEMORY_FILE" << 'MEMSEP'

# MDI 프로젝트 메모리

## MDI 대시보드 구조

- **서버**: \`$MDI_SERVER\` (전역 CLAUDE.md의 MDI_SERVER 참조)
- **멤버 ID**: \`$MDI_MEMBER_ID\`
- **상태 API**: \`PATCH /api/team/$MDI_MEMBER_ID\` (허용 필드: \`currentActivity\`, \`status\`)

## 워크플로우 규칙

모든 작업 세션에서 아래 순서를 따른다:

1. **시작**: currentActivity 업데이트 (REST PATCH)
2. **작업 생성**: 요청 받으면 태스크 먼저 생성 후 작업
3. **진행**: 작업 수행 → 완료 후 태스크 done 처리
4. **종료**: currentActivity 초기화 → 답변

## MDI 태스크 연동 워크플로

실질적 작업 시작 시 MDI API로 태스크 직접 생성 (도구 사용 시 반드시 먼저 생성):

\`\`\`bash
NEXT_ID=$(curl -s $MDI_SERVER/api/tasks | python3 -c "
import json,sys
tasks=json.load(sys.stdin)
nums=[int(t['id'].replace('T-','')) for t in tasks if t['id'].startswith('T-') and t['id'][2:].isdigit()]
print('T-'+str((max(nums) if nums else 0)+1).zfill(3))
")
curl -s -X POST $MDI_SERVER/api/tasks \
  -H 'Content-Type: application/json' \
  -d "{\"id\":\"$NEXT_ID\",\"title\":\"[제목]\",\"description\":\"[설명]\",\"status\":\"progress\",\"priority\":\"medium\",\"assigneeId\":\"$MDI_MEMBER_ID\",\"due\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"startDate\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
# 완료 시:
curl -s -X PATCH $MDI_SERVER/api/tasks/$NEXT_ID \
  -H 'Content-Type: application/json' \
  -d "{\"status\":\"done\",\"due\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"description\":\"[요약]\",\"body\":\"## 완료 내용\n\n[요약]\n\n## 변경 파일\n\n- [파일]: [내용]\"}"
\`\`\`

## 파일 편집 금지

\`data/team/$MDI_MEMBER_ID.md\` 직접 편집 금지 — mdi-sync.js 파일 감시 → 서버 push → status 덮어씌워짐
MEMSEP
  # $MDI_SERVER, $MDI_MEMBER_ID 실제 값으로 치환
  sed -i '' "s|\\\$MDI_SERVER|${baseUrl}|g" "$MEMORY_FILE"
  sed -i '' "s|\\\$MDI_MEMBER_ID|${memberId}|g" "$MEMORY_FILE"
  echo "MEMORY.md 생성: $MEMORY_FILE"
else
  echo "MEMORY.md 이미 설정됨 (skip)"
fi

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
echo ""
echo "Opening dashboard..."
if command -v open &>/dev/null; then
  open "$MDI_SERVER"
elif command -v xdg-open &>/dev/null; then
  xdg-open "$MDI_SERVER"
fi
`;

  return new NextResponse(script, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="mdi-setup-${memberId}.sh"`,
    },
  });
}
