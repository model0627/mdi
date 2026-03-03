# MDI Dashboard — Claude Instructions

> Markdown 기반 팀 대시보드. DB 없이 `.md` 파일로 모든 데이터를 관리하며, Claude Code 에이전트와의 협업에 최적화되어 있다.
> 배포: https://mdi-gamma.vercel.app | 저장소: https://github.com/model0627/mdi

---

## 프로젝트 개요

### 기술 스택
- **프레임워크**: Next.js 16.1.6 (App Router) + React 19.2.3
- **언어**: TypeScript (strict mode)
- **스타일**: Tailwind CSS v4
- **상태 관리**: Zustand v5
- **실시간**: SSE (Server-Sent Events) + WebSocket
- **데이터 저장**: Markdown 파일 (gray-matter) — 로컬 파일시스템 또는 Vercel Blob
- **아이콘**: Lucide React
- **서버**: 커스텀 Node.js HTTP 서버 (server.ts) + WebSocket
- **패키지 매니저**: npm

### 주요 명령어
```bash
npm run dev      # 개발 서버 (tsx watch server.ts → localhost:3001)
npm run build    # Next.js 빌드
npm run start    # 프로덕션 서버
npm run lint     # ESLint 실행
```

---

## 디렉토리 구조

```
mdi/
├── app/                          # Next.js App Router
│   ├── api/                      # REST API 라우트
│   │   ├── backup/route.ts       # GET — 전체 데이터 ZIP 백업
│   │   ├── config/               # 설정 관리
│   │   │   ├── files/[name]/route.ts  # GET/PUT — 설정 파일 읽기/쓰기
│   │   │   ├── sync.sh/route.ts       # GET — 동기화 스크립트 다운로드
│   │   │   └── version/route.ts       # GET — 설정 버전 조회
│   │   ├── events/route.ts       # GET — SSE 실시간 이벤트 스트림
│   │   ├── invites/              # 초대 시스템
│   │   │   ├── route.ts               # GET/POST — 초대 목록/생성
│   │   │   └── [token]/
│   │   │       ├── route.ts           # GET — 초대 정보
│   │   │       ├── activate/route.ts  # POST — 초대 수락
│   │   │       └── setup.sh/route.ts  # GET — 셋업 스크립트 생성
│   │   ├── projects/route.ts     # GET/POST — 프로젝트 목록/생성
│   │   ├── share/[token]/route.ts  # GET — 태스크 공유 링크
│   │   ├── tasks/                # 태스크 CRUD
│   │   │   ├── route.ts               # GET/POST — 태스크 목록/생성
│   │   │   └── [id]/
│   │   │       ├── route.ts           # GET/PATCH/DELETE — 태스크 조회/수정/삭제
│   │   │       └── share/route.ts     # POST — 공유 링크 생성
│   │   └── team/                 # 팀 멤버 관리
│   │       ├── route.ts               # GET — 멤버 목록 (+ 태스크 포함)
│   │       └── [id]/
│   │           ├── route.ts           # GET/PATCH/DELETE — 멤버 조회/수정/삭제
│   │           └── reinvite/route.ts  # POST — 재초대
│   ├── invite/[token]/page.tsx   # 초대 수락 페이지
│   ├── share/[token]/page.tsx    # 태스크 공유 페이지 (읽기 전용)
│   ├── global-error.tsx          # 글로벌 에러 바운더리
│   ├── globals.css               # 전역 CSS (Tailwind + CSS 변수)
│   ├── layout.tsx                # 루트 레이아웃 (메타데이터, OG)
│   ├── opengraph-image.tsx       # OG 이미지 동적 생성
│   └── page.tsx                  # 메인 대시보드 (SPA — 6개 뷰)
├── components/                   # React 컴포넌트
│   ├── Avatar.tsx                # 이니셜 아바타 + 상태 표시
│   ├── ConfigView.tsx            # 설정 에디터 (Claude 설정 등)
│   ├── CreateProjectModal.tsx    # 프로젝트 생성 모달
│   ├── DashboardView.tsx         # 프로젝트 카드 + 팀 현황 대시보드
│   ├── GanttView.tsx             # 간트 차트 타임라인
│   ├── InviteModal.tsx           # 멤버 초대 모달
│   ├── KanbanView.tsx            # 칸반 보드 (드래그&드롭)
│   ├── MemberManageModal.tsx     # 멤버 관리 모달
│   ├── OfficeView.tsx            # 픽셀 아트 오피스 씬 (애니메이션)
│   ├── PriorityBadge.tsx         # 우선순위 배지
│   ├── StatusBadge.tsx           # 상태 배지
│   ├── TaskListView.tsx          # 태스크 테이블 뷰
│   ├── TaskModal.tsx             # 태스크 상세 모달 (편집)
│   └── TopNav.tsx                # 상단 네비게이션 바
├── hooks/
│   └── useSSE.ts                 # SSE 연결 훅 (자동 재연결, 지수 백오프)
├── lib/
│   ├── data.ts                   # 타입 정의 (Member, Task, Project) + 샘플 데이터
│   ├── mdStore.ts                # 마크다운 파일 저장소 (Vercel Blob / 로컬 FS)
│   └── wsManager.ts              # WebSocket 매니저 (Claude Code 에이전트 연결)
├── stores/
│   └── dashboardStore.ts         # Zustand 글로벌 스토어
├── scripts/
│   ├── mdi-activity.sh           # 멤버 활동 상태 업데이트
│   ├── mdi-connect.js            # Claude Code 에이전트 WebSocket 연결
│   ├── mdi-setup-member.sh       # 멤버 자동 셋업 스크립트
│   ├── mdi-sync.js               # 파일 변경 → 서버 WebSocket 동기화 데몬
│   ├── migrate-to-blob.js        # Vercel Blob 마이그레이션 도구
│   ├── setup-vps.sh              # VPS 배포 초기화
│   ├── test-ws.js                # WebSocket 테스트 유틸
│   └── ws-test.js                # WebSocket 연결 테스트
├── data/                         # 데이터 디렉토리 (마크다운 파일)
│   ├── tasks/                    # 태스크 .md 파일 (YAML frontmatter + body)
│   ├── projects/                 # 프로젝트 .md 파일
│   ├── team/                     # 멤버 프로필 .md 파일
│   ├── config/                   # 설정 JSON (mdi-config.json)
│   └── invites/                  # 초대 토큰 JSON (로컬 전용)
├── public/                       # 정적 파일
├── server.ts                     # 커스텀 Next.js 서버 (HTTP + WebSocket)
├── Dockerfile                    # 멀티스테이지 Docker 빌드 (node:22-alpine)
├── docker-compose.yml            # Docker Compose (포트 3001, data/ 볼륨)
├── nginx.conf                    # Nginx 리버스 프록시 (SSL + WebSocket)
├── .gitlab-ci.yml                # GitLab CI/CD (main 브랜치 자동 배포)
└── CLAUDE.md                     # 이 파일
```

---

## 핵심 아키텍처

### 데이터 흐름
```
[Claude Code Agent] --WebSocket(/ws)--> [server.ts] --file write--> [data/*.md]
                                                                        |
[Browser UI] <--SSE(/api/events)-- [mdStore] <--chokidar watch-- [data/*.md]
                                      |
                                   [Zustand Store] --> [React Components]
```

### 데이터 저장 구조
모든 데이터는 YAML frontmatter를 가진 `.md` 파일로 저장된다:
```yaml
---
id: "T-001"
title: "기능 구현"
status: "progress"
priority: "medium"
assigneeId: "shawn"
projectId: "mdi"
created: "2026-03-01"
due: "2026-03-03"
startDate: "2026-03-01"
---

## 설명

태스크 본문 내용
```

### 듀얼 스토리지 모드 (mdStore.ts)
- **로컬 모드** (기본): `data/` 디렉토리에 파일 읽기/쓰기 + chokidar로 변경 감지
- **Vercel 모드** (`VERCEL=1`): `@vercel/blob`에 저장, 첫 배포 시 로컬 데이터를 Blob에 시드

### 실시간 업데이트
- **SSE**: 브라우저 → `/api/events` 연결 → `init`, `task:update`, `task:create`, `task:delete`, `project:update`, `member:update`, `member:delete` 이벤트 수신
- **WebSocket**: Claude Code 에이전트 → `/ws` 연결 → `join`, `activity`, `file:sync`, `file:delete` 메시지 처리

### 타입 시스템 (lib/data.ts)
```typescript
type Status = "backlog" | "progress" | "review" | "done" | "cancelled";
type Priority = "low" | "medium" | "high" | "critical";

interface Member {
  id: string; name: string; initials: string;
  avatarColor: number; // 0-7
  role: string; status: "active" | "away" | "offline";
  currentActivity?: string;
}

interface Task {
  id: string; title: string; status: Status; priority: Priority;
  assigneeId: string; projectId: string;
  created: string; due: string; startDate: string;
  actualStart?: string; actualEnd?: string;
  description?: string;
}

interface Project {
  id: string; name: string; description: string; color: string;
  memberIds: string[]; taskIds: string[];
  startDate: string; endDate: string;
}
```

---

## 뷰 구성 (메인 페이지)

| 뷰 | 컴포넌트 | 설명 |
|---|---|---|
| `office` | OfficeView | 픽셀 아트 오피스 — 멤버 활동을 캐릭터로 시각화 |
| `dashboard` | DashboardView | 프로젝트 카드 + 팀 멤버 현황 |
| `tasks` | TaskListView | 프로젝트별 그룹화된 태스크 테이블 |
| `kanban` | KanbanView | 상태별 칸반 보드 (백로그/진행/리뷰/완료) |
| `gantt` | GanttView | 간트 차트 타임라인 |
| `config` | ConfigView | Claude 설정 파일 에디터 |

---

## 배포

### Vercel (프로덕션)
- `main` 브랜치 푸시 시 자동 배포
- 데이터는 Vercel Blob Storage에 저장
- `metadataBase`: https://mdi-gamma.vercel.app

### Docker (셀프호스팅)
```bash
docker compose up -d --build
# 포트: 80 → 3001, 데이터: ./data 볼륨 마운트
```

### GitLab CI/CD
- `main` 푸시 → `secumate` 태그 러너에서 자동 배포
- Docker Compose 재빌드 + 헬스체크

---

## 개발 컨벤션

### 코드 스타일
- TypeScript strict mode
- `@/*` 경로 별칭 사용 (예: `@/components/TopNav`)
- 컴포넌트는 `components/` 디렉토리에 PascalCase 파일명
- API 라우트는 `app/api/` 하위에 Next.js App Router 규칙 준수
- 한국어 UI 라벨 (`statusLabel`, `priorityLabel` 맵 참조)

### 파일 수정 시 주의사항
- **`data/team/*.md` 직접 편집 금지** — mdi-sync.js가 파일 감지 시 서버로 push하여 상태가 덮어씌워짐
- 멤버 상태 변경은 반드시 **REST API** (`curl PATCH`) 사용
- `mdStore.ts`에서 파일 쓰기 시 `.tmp` → `rename` 패턴으로 원자적 쓰기 보장
- `data/` 하위 `.archive/` 디렉토리는 삭제된 태스크 보관

### 글로벌 싱글톤 패턴
`mdStore`와 `wsManager`는 `global.__mdStore` / `global.__wsManager`로 HMR 안전한 싱글톤 유지.

---

## 워크플로우 (필수 준수)

모든 작업은 아래 순서를 반드시 따른다:

### 1. 작업 시작
```bash
# status: active 확인 (SessionStart hook이 자동 설정하지만 명시적으로 확인)
curl -s -X PATCH $MDI_SERVER/api/team/shawn \
  -H 'Content-Type: application/json' \
  -d '{"currentActivity":"[작업 내용 요약]"}' > /dev/null 2>&1 &
```

### 2. 작업 항목 생성 (MDI API) — 반드시 작업 수행 전에 생성
- **코드 수정, 파일 생성/편집, 분석, 구현, 커밋/푸시 등 모든 실질적 작업 시작 전에 먼저 태스크를 생성한다**
- 단순 답변/안내만 예외 — 그 외에는 예외 없이 생성
- `status: "progress"` 로 생성하고 **작업이 완전히 끝날 때까지 유지** → 완료 후 `done`

```bash
NEXT_ID=$(curl -s $MDI_SERVER/api/tasks | python3 -c "
import json,sys
tasks=json.load(sys.stdin)
nums=[int(t['id'].replace('T-','')) for t in tasks if t['id'].startswith('T-') and t['id'][2:].isdigit()]
print('T-'+str((max(nums) if nums else 0)+1).zfill(3))
")
curl -s -X POST $MDI_SERVER/api/tasks \
  -H 'Content-Type: application/json' \
  -d "{\"id\":\"$NEXT_ID\",\"title\":\"[작업제목]\",\"description\":\"[작업 상세 설명]\",\"status\":\"progress\",\"priority\":\"medium\",\"assigneeId\":\"shawn\",\"due\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"startDate\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
echo "태스크 생성: $NEXT_ID"
```

### 3. 작업 진행
- 각 세부 작업 시작 시 TaskUpdate로 `in_progress` 표시
- currentActivity를 해당 작업 내용으로 업데이트

### 4. 종료 (필수 — 모든 작업 완료 후)

작업 완료 시 반드시 **description에 변경사항 기록 + due를 현재시간으로 갱신 + done** 처리한다.

```bash
# 1) MDI 태스크 → description 업데이트 + due 현재시간 + body 작성 + status: done (한 번에 처리)
curl -s -X PATCH $MDI_SERVER/api/tasks/$NEXT_ID \
  -H 'Content-Type: application/json' \
  -d "{
    \"status\": \"done\",
    \"due\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"description\": \"[수행한 작업 요약 — 변경 파일 및 내용 포함]\",
    \"body\": \"## 완료 내용\n\n[수행한 작업 요약]\n\n## 변경 파일\n\n- [파일명]: [변경 내용]\"
  }"

# 2) currentActivity 초기화
curl -s -X PATCH $MDI_SERVER/api/team/shawn \
  -H 'Content-Type: application/json' \
  -d '{"currentActivity":""}' > /dev/null 2>&1 &
# 참고: Stop hook은 currentActivity만 초기화 (status 유지)
```

**description 작성 가이드** (태스크 목록에서 바로 보이는 한 줄 요약):
- 수행한 작업과 변경 파일을 간결하게 기술
- 예: `mate-api/ai_chat.py: _select_tools() 추가로 도구 53→3개 최적화, slack-bot: history[-20:]→[-10:] 중복 제거`

**body 작성 가이드**:
- `## 완료 내용` — 수행한 작업을 2~5줄로 요약
- `## 변경 파일` — 수정/생성한 파일 목록과 변경 이유
- `## 커밋` — 커밋이 1개 이상 발생한 경우 반드시 포함:
  ```
  | 커밋 | 내용 | 푸시 |
  |------|------|------|
  | [`해시`](https://github.com/model0627/mdi/commit/전체해시) | 변경 내용 요약 | ✅ |
  ```
- `## 결과` — 기능 동작 확인 결과 (테스트 통과 여부 등)
- 간단한 작업은 한 줄 요약도 무방

## 상태 업데이트 규칙

- 작업 내용은 **한국어**, 20자 이내
- **파일 직접 수정 금지**: `data/team/shawn.md` 편집 금지
  - mdi-sync.js가 파일 변경 감지 시 서버로 push → `status` 덮어씌워짐
- 반드시 **REST API (curl PATCH)** 만 사용

```bash
# currentActivity 설정
curl -s -X PATCH $MDI_SERVER/api/team/shawn \
  -H 'Content-Type: application/json' \
  -d '{"currentActivity":"[내용]"}' > /dev/null 2>&1 &

# currentActivity 초기화
curl -s -X PATCH $MDI_SERVER/api/team/shawn \
  -H 'Content-Type: application/json' \
  -d '{"currentActivity":""}' > /dev/null 2>&1 &
```

## 체크리스트

- [ ] 작업 시작 → currentActivity 설정
- [ ] TaskCreate로 작업 항목 생성 (status: progress)
- [ ] 각 작업 → TaskUpdate(in_progress) → 수행 → TaskUpdate(completed)
- [ ] 모든 작업 완료 → description 업데이트 + due 현재시간 + body 작성 + status: done
- [ ] currentActivity 초기화
- [ ] 최종 답변

---

## API 레퍼런스

### 태스크
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/tasks` | 전체 태스크 목록 |
| POST | `/api/tasks` | 태스크 생성 |
| GET | `/api/tasks/[id]` | 태스크 상세 (body 포함) |
| PATCH | `/api/tasks/[id]` | 태스크 수정 (body 필드로 본문 작성) |
| DELETE | `/api/tasks/[id]` | 태스크 삭제 (아카이브) |
| POST | `/api/tasks/[id]/share` | 공유 링크 생성 |

### 프로젝트
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/projects` | 프로젝트 목록 |
| POST | `/api/projects` | 프로젝트 생성 |

### 팀 멤버
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/team` | 멤버 목록 (태스크 포함) |
| GET | `/api/team/[id]` | 멤버 상세 |
| PATCH | `/api/team/[id]` | 멤버 정보 수정 |
| DELETE | `/api/team/[id]` | 멤버 삭제 |
| POST | `/api/team/[id]/reinvite` | 재초대 |

### 초대
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/invites` | 초대 목록 |
| POST | `/api/invites` | 초대 생성 |
| GET | `/api/invites/[token]` | 초대 정보 |
| POST | `/api/invites/[token]/activate` | 초대 수락 |
| GET | `/api/invites/[token]/setup.sh` | 셋업 스크립트 |

### 기타
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/events` | SSE 실시간 이벤트 스트림 |
| GET | `/api/backup` | 전체 데이터 ZIP 다운로드 |
| GET | `/api/share/[token]` | 공유 태스크 조회 |
| GET/PUT | `/api/config/files/[name]` | 설정 파일 읽기/쓰기 |
| GET | `/api/config/version` | 설정 버전 |

---

## 커밋 보고 형식 (필수)

커밋이 1개 이상 발생한 경우, **최종 답변에 반드시 커밋 요약 테이블을 포함**한다.

### 형식

```
| 커밋 | 내용 | 푸시 |
|------|------|------|
| [`해시`](https://github.com/model0627/mdi/commit/전체해시) | 변경 내용 요약 | ✅ |
```

### 규칙
- 커밋 해시는 7자리로 표시하고, GitHub 커밋 URL로 링크 처리
- GitHub 저장소 주소: `https://github.com/model0627/mdi`
- 커밋 URL 형식: `.../commit/{전체 커밋 해시}`
- 내용은 한국어로 간결하게 (20자 이내)
- 푸시 성공: ✅ / 실패: ❌

### 예시

| 커밋 | 내용 | 푸시 |
|------|------|------|
| [`a58cdaa`](https://github.com/model0627/mdi/commit/a58cdaa) | writeTaskBodyContent 빌드 수정 | ✅ |
| [`f66f457`](https://github.com/model0627/mdi/commit/f66f457) | 프로젝트 생성 UI | ✅ |
