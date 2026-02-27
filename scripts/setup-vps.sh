#!/bin/bash
# MDI Dashboard — VPS 설정 스크립트 (HTTP / IP 접근)
# Usage: bash setup-vps.sh <git-repo-url>
# Example: bash setup-vps.sh https://github.com/yourteam/mdi-dashboard.git

set -e

REPO_URL="${1:?Git 저장소 URL을 인자로 전달하세요}"
INSTALL_DIR="/opt/mdi-dashboard"

echo "========================================"
echo "  MDI Dashboard VPS Setup (HTTP)"
echo "  Repo    : ${REPO_URL}"
echo "  Install : ${INSTALL_DIR}"
echo "========================================"
echo ""

# ─── 1. Docker ──────────────────────────────────────────────────────────────
echo "[1/3] Docker 설치 확인..."
if ! command -v docker &>/dev/null; then
  echo "  → Docker 설치 중..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
  echo "  ✅ Docker 설치 완료"
else
  echo "  ✅ Docker 이미 설치됨"
fi

# ─── 2. Clone / pull ────────────────────────────────────────────────────────
echo ""
echo "[2/3] 저장소 준비..."
if [ -d "${INSTALL_DIR}/.git" ]; then
  echo "  → 기존 디렉토리 발견 — git pull 실행"
  git -C "${INSTALL_DIR}" pull
else
  git clone "${REPO_URL}" "${INSTALL_DIR}"
fi
echo "  ✅ 코드 준비 완료"

# ─── 3. Docker Compose up ───────────────────────────────────────────────────
echo ""
echo "[3/3] Docker Compose 시작..."
cd "${INSTALL_DIR}"
docker compose up -d --build
echo "  ✅ 컨테이너 시작 완료"

# ─── 완료 ───────────────────────────────────────────────────────────────────
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo "========================================"
echo "  ✅ 배포 완료!"
echo ""
echo "  대시보드  : http://${SERVER_IP}"
echo "  WebSocket : ws://${SERVER_IP}/ws"
echo ""
echo "  팀원 연결 :"
echo "    node scripts/mdi-connect.js <아이디> ws://${SERVER_IP}/ws"
echo ""
echo "  로그 확인 :"
echo "    docker compose -f ${INSTALL_DIR}/docker-compose.yml logs -f mdi"
echo "========================================"
