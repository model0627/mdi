# MDI Dashboard

Jira/Notion 없이 Markdown 파일로 관리하는 팀 대시보드.
AI(Claude)와 협업에 최적화된 구조 — 모든 데이터가 `.md` 파일이라 Claude가 직접 읽고 씁니다.

## 화면 구성

### 픽셀 오피스
팀원이 픽셀 캐릭터로 표시되며, 현재 작업 상태를 실시간으로 확인할 수 있습니다.

![픽셀 오피스](docs/screenshots/01-pixel-office.png)

### 대시보드
프로젝트 진행률과 팀 활동 현황을 한눈에 볼 수 있습니다.

![대시보드](docs/screenshots/02-dashboard.png)

### 칸반
드래그 없이 상태별로 작업을 한눈에 파악할 수 있는 칸반 보드입니다.

![칸반](docs/screenshots/04-kanban.png)

### 간트 차트
작업의 타임라인을 시각적으로 확인할 수 있습니다.

![간트 차트](docs/screenshots/05-gantt.png)

---

## 서버 배포 (Docker)

### 사전 준비

- Ubuntu 22.04+ 서버
- Docker 설치

```bash
curl -fsSL https://get.docker.com | sh
```

### 최초 실행

```bash
git clone <repo-url> mdi-dashboard
cd mdi-dashboard
docker compose up -d
```

- `http://서버IP` 또는 `http://서버IP:3001` 으로 접속
- `data/` 폴더는 바인드 마운트 — 재시작 없이 즉시 반영

### 업데이트

```bash
# 데이터만 변경 시 (재시작 불필요)
git pull

# 코드(앱) 변경 시
git pull
docker compose up -d --build
```

### 로그

```bash
docker compose logs -f mdi
```

---

## 팀원 온보딩

### 1단계 — 어드민: 초대 링크 발급

대시보드 우상단 **멤버 초대** 버튼 클릭 → 이름/아이디/역할 입력 → 초대 링크 생성.
생성된 링크를 팀원에게 공유합니다.

### 2단계 — 팀원: 초대 링크 접속

공유받은 링크(`http://서버IP/invite/[token]`)에 접속해 프로필을 확인하고 활성화합니다.

### 3단계 — 팀원: Claude Code 연동 (1회만 실행)

팀원의 맥북 터미널에서 아래 명령어 한 줄 실행:

```bash
bash <(curl -s http://서버IP:3001/mdi-setup.sh) [내아이디] http://서버IP:3001
```

**이후 Claude Code를 사용하면 자동으로:**
- 메시지 입력 시 → `status: active` (대시보드에 온라인 표시)
- Claude 작업 중 → `currentActivity` 실시간 업데이트
- Claude Code 종료 시 → `currentActivity` 초기화

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
| POST | `/api/invites` | 초대 링크 생성 |
| GET | `/api/events` | SSE 실시간 스트림 |
| WS | `/ws` | WebSocket |

---

## 데이터 구조

```
data/
├── tasks/      ← 작업 파일 (T-001.md, ...)
├── projects/   ← 프로젝트 파일
├── team/       ← 팀원 파일
├── invites/    ← 초대 토큰 파일
└── .archive/   ← 삭제된 작업 보관
```

모든 파일은 YAML frontmatter + Markdown 본문 구조입니다.
Claude가 직접 파일을 읽고 쓸 수 있어 별도 MCP 연결 없이 AI 협업이 가능합니다.
