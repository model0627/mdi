#!/bin/bash
# MDI Dashboard — 팀원 Claude Code 연동 설정
# Usage: bash scripts/mdi-setup-member.sh <memberId> [serverUrl]
# Example:
#   bash scripts/mdi-setup-member.sh yeon                          # 로컬 서버
#   bash scripts/mdi-setup-member.sh yeon http://192.168.1.10:3001 # 원격 서버

set -e

MEMBER_ID="${1:?팀원 ID를 입력하세요 (예: yeon)}"
SERVER_URL="${2:-http://localhost:3001}"
HOOKS_DIR="${HOME}/.claude/hooks"
SETTINGS_FILE="${HOME}/.claude/settings.json"
CLAUDE_MD="${HOME}/.claude/CLAUDE.md"

echo "=========================================="
echo "  MDI Dashboard — Claude Code 연동 설정"
echo "  Member : ${MEMBER_ID}"
echo "  Server : ${SERVER_URL}"
echo "=========================================="
echo ""

# ─── 1. Hook 디렉토리 ────────────────────────────────────────────────────────
mkdir -p "${HOOKS_DIR}"

# ─── 2. Active hook (UserPromptSubmit: 메시지 입력 시 online) ────────────────
ACTIVE_HOOK="${HOOKS_DIR}/mdi-active-${MEMBER_ID}.sh"
cat > "${ACTIVE_HOOK}" << HOOK
#!/bin/bash
# MDI: Claude Code 사용 중 → status: active
curl -s -X PATCH "${SERVER_URL}/api/team/${MEMBER_ID}" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"active"}' > /dev/null 2>&1 &
HOOK
chmod +x "${ACTIVE_HOOK}"
echo "✅ Active hook 생성: ${ACTIVE_HOOK}"

# ─── 3. Stop hook (Claude Code 종료 시 offline) ──────────────────────────────
STOP_HOOK="${HOOKS_DIR}/mdi-stop-${MEMBER_ID}.sh"
cat > "${STOP_HOOK}" << HOOK
#!/bin/bash
# MDI: Claude Code 종료 → status: offline, currentActivity 초기화
curl -s -X PATCH "${SERVER_URL}/api/team/${MEMBER_ID}" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"offline","currentActivity":""}' > /dev/null 2>&1
HOOK
chmod +x "${STOP_HOOK}"
echo "✅ Stop hook 생성: ${STOP_HOOK}"

# ─── 4. settings.json 업데이트 ───────────────────────────────────────────────
if [ ! -f "${SETTINGS_FILE}" ]; then
  echo '{"hooks":{}}' > "${SETTINGS_FILE}"
fi

# node로 JSON 업데이트 (macOS/Linux 공통)
node - << JS
const fs = require('fs');
const file = '${SETTINGS_FILE}';
const settings = JSON.parse(fs.readFileSync(file, 'utf8'));

if (!settings.hooks) settings.hooks = {};

// UserPromptSubmit hook (active)
if (!Array.isArray(settings.hooks.UserPromptSubmit)) {
  settings.hooks.UserPromptSubmit = [];
}
const activeHook = { type: 'command', command: '${ACTIVE_HOOK}', timeout: 3 };
const hasActive = settings.hooks.UserPromptSubmit.some(h => h.command === '${ACTIVE_HOOK}');
if (!hasActive) settings.hooks.UserPromptSubmit.push(activeHook);

// Stop hook (offline)
if (!Array.isArray(settings.hooks.Stop)) {
  settings.hooks.Stop = [];
}
const stopHook = { type: 'command', command: '${STOP_HOOK}', timeout: 5 };
const hasStop = settings.hooks.Stop.some(h => h.command === '${STOP_HOOK}');
if (!hasStop) settings.hooks.Stop.push(stopHook);

fs.writeFileSync(file, JSON.stringify(settings, null, 2));
console.log('✅ settings.json 업데이트 완료');
JS

# ─── 5. CLAUDE.md에 currentActivity 추가 ────────────────────────────────────
MDI_SECTION="
## MDI 대시보드 — 작업 상태 추적

MDI_SERVER: ${SERVER_URL}
MDI_MEMBER_ID: ${MEMBER_ID}

**모든 응답의 첫 번째 액션** — currentActivity 설정 (한국어, 20자 이내):
\`\`\`
curl -s -X PATCH ${SERVER_URL}/api/team/${MEMBER_ID} \\
  -H 'Content-Type: application/json' \\
  -d '{\"currentActivity\":\"[작업내용] 중\"}' > /dev/null 2>&1 &
\`\`\`

**사용자에게 최종 답변 직전** — currentActivity 초기화:
\`\`\`
curl -s -X PATCH ${SERVER_URL}/api/team/${MEMBER_ID} \\
  -H 'Content-Type: application/json' \\
  -d '{\"currentActivity\":\"\"}' > /dev/null 2>&1 &
\`\`\`

단순 질문이라도 예외 없이 적용한다.
"

if ! grep -q "MDI_MEMBER_ID: ${MEMBER_ID}" "${CLAUDE_MD}" 2>/dev/null; then
  echo "${MDI_SECTION}" >> "${CLAUDE_MD}"
  echo "✅ CLAUDE.md 업데이트 완료"
else
  echo "⏭  CLAUDE.md 이미 설정됨 (skip)"
fi

# ─── 완료 ───────────────────────────────────────────────────────────────────
echo ""
echo "=========================================="
echo "  ✅ 설정 완료!"
echo ""
echo "  이제 Claude Code를 실행하면 자동으로"
echo "  MDI 오피스에 ${MEMBER_ID}(으)로 나타납니다."
echo ""
echo "  서버: ${SERVER_URL}"
echo "=========================================="
