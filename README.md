# MDI Dashboard

Jira/Notion 없이 Markdown 파일로 관리하는 팀 대시보드.
AI(Claude)와 협업에 최적화된 구조 — 모든 데이터가 `.md` 파일이라 Claude가 직접 읽고 씁니다.

## 화면 구성

| 탭 | 설명 |
|---|---|
| 픽셀 오피스 | 팀원이 픽셀 캐릭터로 표시, 현재 작업 상태 실시간 확인 |
| 대시보드 | 프로젝트 진행률 + 팀 활동 현황 |
| 작업 목록 | 프로젝트별 작업 테이블 |
| 간트 차트 | 타임라인 뷰 |

---

## 설치

```bash
git clone <repo-url>
cd mdi-dashboard
npm install
npm run dev
```

`http://localhost:3001` 접속

---

## 팀원 등록

`data/team/[아이디].md` 파일 생성:

```markdown
---
id: alice
name: Alice
initials: A
avatarColor: 2
role: Backend Dev
status: active
currentActivity:
---
```

**avatarColor** (0~7):

| 번호 | 색상 |
|---|---|
| 0 | 파랑 |
| 1 | 분홍 |
| 2 | 초록 |
| 3 | 노랑 |
| 4 | 보라 |
| 5 | 하늘 |
| 6 | 빨강 |
| 7 | 청록 |

---

## 프로젝트 등록

`data/projects/[아이디].md` 파일 생성:

```markdown
---
id: proj-api
name: API 서버
description: NestJS 백엔드
color: "#34d399"
memberIds:
  - alice
  - bob
taskIds: []
startDate: 2026-02-27
endDate: 2026-06-30
---
```

---

## 작업 등록

`data/tasks/[아이디].md` 파일 생성:

```markdown
---
id: T-001
title: 로그인 API 구현
status: backlog
priority: high
projectId: proj-api
assigneeId: alice
created: 2026-02-27
due: 2026-03-15
startDate: 2026-02-27
---

## 설명
작업 상세 내용을 자유롭게 작성

## 체크리스트
- [ ] 항목 1
- [ ] 항목 2
```

**status 값:** `backlog` / `progress` / `review` / `done` / `cancelled`

**priority 값:** `low` / `medium` / `high` / `critical`

---

## Claude 자동 상태 추적 설정

Claude가 작업할 때 `currentActivity` 를 자동으로 업데이트하도록 설정합니다.

### 로컬 서버 (파일 직접 수정)

`~/.claude/CLAUDE.md` 파일 끝에 추가 (`[내아이디]`, `[경로]` 수정):

```markdown
## MDI 대시보드 — 작업 상태 추적

MDI 파일: `/path/to/mdi-dashboard/data/team/[내아이디].md`

**모든 응답의 첫 번째 액션** — currentActivity 설정 (한국어, 20자 이내):
currentActivity: "xxx 중"

**사용자에게 최종 답변 직전** — currentActivity 초기화:
currentActivity:

순서: ① currentActivity 설정 → 작업 수행 → ② currentActivity 초기화 → 답변
단순 질문이라도 예외 없이 적용한다.
```

Stop 훅 추가 (`~/.claude/hooks/mdi-clear-activity.sh`):

```bash
#!/bin/bash
MDI_FILE="/path/to/mdi-dashboard/data/team/[내아이디].md"
if [ -f "$MDI_FILE" ]; then
  sed -i '' 's/^currentActivity: .*/currentActivity:/' "$MDI_FILE"
fi
```

```bash
chmod +x ~/.claude/hooks/mdi-clear-activity.sh
```

`~/.claude/settings.json` 의 `Stop` 훅 배열에 추가:

```json
{ "type": "command", "command": "/Users/[유저명]/.claude/hooks/mdi-clear-activity.sh", "timeout": 5 }
```

---

### 원격 서버 (WebSocket 연결)

로컬 파일 수정 없이 WebSocket으로 실시간 업데이트합니다.
**연결이 끊기면 서버가 자동으로 `status: offline` + `currentActivity` 초기화** — Stop 훅 불필요.

**1. Claude Code 세션 시작 시 백그라운드 연결:**

```bash
node scripts/mdi-connect.js [내아이디] wss://mdi.yourteam.com/ws &
```

**2. `~/.claude/CLAUDE.md` 에 추가:**

```markdown
## MDI 대시보드 — 작업 상태 추적 (원격)

MDI_SERVER: https://mdi.yourteam.com
MDI_MEMBER_ID: [내아이디]

**모든 응답의 첫 번째 액션** — API로 currentActivity 설정:
curl -s -X PATCH $MDI_SERVER/api/team/$MDI_MEMBER_ID \
  -H "Content-Type: application/json" \
  -d '{"currentActivity":"xxx 중"}' > /dev/null

**사용자에게 최종 답변 직전** — API로 초기화:
curl -s -X PATCH $MDI_SERVER/api/team/$MDI_MEMBER_ID \
  -H "Content-Type: application/json" \
  -d '{"currentActivity":""}' > /dev/null

단순 질문이라도 예외 없이 적용한다.
```

**WebSocket 이벤트:**

| 이벤트 | 방향 | 설명 |
|---|---|---|
| `join` | MacBook → 서버 | 연결 시 멤버 등록, `status: active` 자동 설정 |
| `activity` | MacBook → 서버 | `currentActivity` 업데이트 |
| `ping` / `pong` | 양방향 | 연결 유지 (25초 간격) |
| `task_assigned` | 서버 → MacBook | 새 작업 배정 알림 |
| `task_review` | 서버 → MacBook | 리뷰 요청 알림 |
| 연결 종료 | — | `status: offline` + `currentActivity` 자동 초기화 |

---

## VPS 서버 배포 (Docker + HTTPS)

### 사전 준비

- Ubuntu 22.04+ VPS (RAM 1GB 이상 권장)
- 도메인 A 레코드를 VPS IP로 설정 (예: `mdi.yourteam.com` → VPS IP)
- Docker, Docker Compose, Certbot 설치

```bash
# Docker 설치
curl -fsSL https://get.docker.com | sh

# Certbot 설치
sudo apt install -y certbot

# 저장소 클론
git clone <repo-url> mdi-dashboard
cd mdi-dashboard
```

### 1단계 — SSL 인증서 발급 (Certbot)

nginx가 80 포트를 사용하기 전에 standalone 모드로 발급합니다:

```bash
sudo certbot certonly --standalone -d mdi.yourteam.com
```

발급 성공 시 인증서 위치:
- `/etc/letsencrypt/live/mdi.yourteam.com/fullchain.pem`
- `/etc/letsencrypt/live/mdi.yourteam.com/privkey.pem`

### 2단계 — nginx.conf 도메인 수정

`nginx.conf` 의 `mdi.yourteam.com` 을 실제 도메인으로 교체:

```bash
sed -i 's/mdi.yourteam.com/실제도메인/g' nginx.conf
```

### 3단계 — Docker Compose 실행

```bash
docker compose up -d
```

컨테이너 상태 확인:

```bash
docker compose ps
docker compose logs -f mdi      # 앱 로그
docker compose logs -f nginx     # nginx 로그
```

브라우저에서 `https://mdi.yourteam.com` 접속 확인.

### 4단계 — WebSocket 연결 테스트

서버에서 WebSocket 엔드포인트 응답 확인:

```bash
# wscat 설치 (없으면)
npm install -g wscat

# WSS 연결 테스트
wscat -c wss://mdi.yourteam.com/ws
```

연결 후 join 메시지 전송:

```json
{"type":"join","memberId":"shawn"}
```

서버가 `{"type":"joined","memberId":"shawn"}` 으로 응답하면 성공.

### 5단계 — 팀원 원격 연결

각 팀원은 MacBook에서 아래 명령으로 실시간 연결:

```bash
node scripts/mdi-connect.js [내아이디] wss://mdi.yourteam.com/ws
```

백그라운드 실행:

```bash
node scripts/mdi-connect.js shawn wss://mdi.yourteam.com/ws &
```

### 인증서 자동 갱신

Let's Encrypt 인증서는 90일마다 갱신 필요. cron 등록:

```bash
sudo crontab -e
# 추가:
0 3 * * * certbot renew --quiet && docker compose -f /path/to/mdi-dashboard/docker-compose.yml restart nginx
```

### 업데이트 배포

```bash
git pull
docker compose build --no-cache
docker compose up -d
```

---

## API

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/tasks` | 전체 작업 목록 |
| POST | `/api/tasks` | 작업 생성 |
| PATCH | `/api/tasks/:id` | 작업 수정 |
| DELETE | `/api/tasks/:id` | 작업 삭제 (아카이브) |
| GET | `/api/projects` | 프로젝트 목록 |
| GET | `/api/team` | 팀원 목록 |
| GET | `/api/events` | SSE 실시간 스트림 (브라우저 → 대시보드 수신) |
| WS | `/ws` | WebSocket (Claude Code 에이전트 연결) |

---

## 데이터 구조

```
data/
├── tasks/      ← 작업 파일 (T-001.md, ...)
├── projects/   ← 프로젝트 파일
├── team/       ← 팀원 파일
└── .archive/   ← 삭제된 작업 보관
```

모든 파일은 YAML frontmatter + Markdown 본문 구조입니다.
Claude가 직접 파일을 읽고 쓸 수 있어 별도 MCP 연결 없이 AI 협업이 가능합니다.
