# MDI Dashboard

> Markdown 파일로 관리하는 팀 대시보드 — Jira/Notion 없이, Claude와 함께.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/model0627/mdi)

---

## 소개

MDI는 모든 데이터를 `.md` 파일로 저장하는 경량 팀 대시보드입니다.
별도 DB 없이 GitHub에 그대로 올라가고, Claude Code가 직접 읽고 써서 AI 협업에 최적화되어 있습니다.

```
팀원이 Claude Code로 작업 시작
→ Claude가 대시보드에 currentActivity 자동 업데이트
→ 팀원들이 실시간으로 확인
→ 작업 완료 → Claude가 태스크 done 처리
```

---

## 주요 기능

### 팀 대시보드
- 팀원별 실시간 활동 상태 (`currentActivity`)
- 온/오프라인 표시
- **픽셀 오피스** — 격자 기반 팀원 위치 시각화

### 작업 관리
- **작업 목록** — 상태/우선순위/담당자 필터
- **칸반 보드** — 드래그 앤 드롭 (todo → progress → done)
- **간트 차트** — 타임라인 기반 일정 시각화
- 작업 상세 모달 — Markdown body 편집, 링크 공유

### 설정 파일 뷰어
- 전역/프로젝트 `CLAUDE.md` + `MEMORY.md` 인라인 편집
- MDI Config `claudeBlock` 복사 (Claude Code 연동용)
- 마크다운 미리보기 / 원문 토글

### Claude Code 연동
모든 데이터가 `.md` 파일 → Claude가 직접 읽고 수정.
`CLAUDE.md`에 워크플로우 규칙을 정의하면 Claude가 자동으로 따릅니다.

---

## 빠른 시작

### 1. 저장소 Fork

```
https://github.com/model0627/mdi
```

### 2. Vercel 배포

1. [vercel.com](https://vercel.com) 로그인
2. **Add New Project** → Fork한 저장소 선택
3. **Deploy** — 설정 변경 없이 바로 배포

### 3. 팀원 초대

배포 후 대시보드 접속:

1. 우상단 **멤버 초대** → 이름/아이디/역할 입력 → 초대 링크 생성
2. 팀원에게 링크 공유
3. 팀원이 링크 접속 → **Claude Code 연동 curl 명령어** 복사 → 터미널 실행

이후 Claude Code 사용 시 대시보드에 활동이 자동으로 표시됩니다.

### 4. Claude Code 연동

초대 페이지에서 복사한 명령어를 실행하면 `~/.claude/CLAUDE.md`에 MDI 블록이 자동 추가됩니다.

```bash
# 실제 명령어는 초대 링크에서 확인
curl -s https://your-app.vercel.app/api/invites/TOKEN | bash
```

---

## 로컬 실행

```bash
git clone https://github.com/model0627/mdi
cd mdi/mdi-dashboard
npm install
npm run dev
```

`http://localhost:3000` 접속

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 스타일 | Tailwind CSS |
| 데이터 | Markdown 파일 (`data/`) |
| 배포 | Vercel |
| 스토리지 | Vercel Blob (선택) |

---

## 업데이트

GitHub `main` 브랜치 푸시 시 Vercel 자동 배포.
