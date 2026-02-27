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

## 설치 (로컬)

```bash
git clone <repo-url>
cd mdi-dashboard
npm install
npm run dev
```

`http://localhost:3001` 접속

---

## 팀원 온보딩

새 팀원을 대시보드에 추가하는 절차. **어드민(팀장)**과 **팀원** 역할이 나뉩니다.

### 1단계 — 어드민: 팀원 등록

`data/team/[아이디].md` 파일 생성:

```markdown
---
id: yeon
name: Yeon
initials: Y
avatarColor: 2
role: Developer
status: offline
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

변경사항 반영:

```bash
git add data/team/yeon.md
git commit -m "add member: yeon"
git push

# 서버에서
git pull   # 재시작 없이 즉시 반영
```

---

### 2단계 — 팀원: Claude Code 연동 (1회만 실행)

팀원은 자신의 MacBook 터미널에서 아래 명령어 **한 줄**만 실행합니다:

```bash
bash <(curl -s http://192.168.130.36:3001/mdi-setup.sh) [내아이디] http://192.168.130.36:3001
```

예시:
```bash
bash <(curl -s http://192.168.130.36:3001/mdi-setup.sh) yeon http://192.168.130.36:3001
```

**이후 Claude Code를 사용하면 자동으로:**
- 메시지 입력 시 → `status: active` (대시보드에 온라인 표시)
- Claude가 작업 중 → `currentActivity` 실시간 업데이트
- Claude Code 종료 시 → `status: offline` + `currentActivity` 초기화

> **필요 사전 조건:** `curl`, `node` 설치 (macOS 기본 제공)

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

> 작업 상태가 `progress`로 바뀌면 `actualStart`, `done`으로 바뀌면 `actualEnd`가 자동 기록됩니다.

---

## VPS 서버 배포 (Docker)

### 사전 준비

- Ubuntu 22.04+ VPS
- Docker, Docker Compose 설치

```bash
curl -fsSL https://get.docker.com | sh
git clone <repo-url> mdi-dashboard
cd mdi-dashboard
```

### 실행

```bash
docker compose up -d
```

- `http://VPS-IP` 또는 `http://VPS-IP:3001` 으로 접속
- `data/` 폴더는 바인드 마운트 — `git pull` 만으로 데이터 즉시 반영

### 업데이트

```bash
git pull                          # 데이터만 변경 시 (재빌드 불필요)
docker compose up -d --build      # 코드 변경 시
```

### 로그 확인

```bash
docker compose logs -f mdi
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
| PATCH | `/api/team/:id` | 팀원 상태/활동 업데이트 (`status`, `currentActivity`) |
| GET | `/api/events` | SSE 실시간 스트림 |
| WS | `/ws` | WebSocket |

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
