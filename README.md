# MDI Dashboard

Jira/Notion 없이 Markdown 파일로 관리하는 팀 대시보드.
AI(Claude)와 협업에 최적화된 구조 — 모든 데이터가 `.md` 파일이라 Claude가 직접 읽고 씁니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/model0627/mdi)

---

## Vercel 배포

### 1. 저장소 Fork

```
https://github.com/model0627/mdi
```

### 2. Vercel에 배포

1. [vercel.com](https://vercel.com) 로그인
2. **Add New Project** → Fork한 저장소 선택
3. **Deploy** 클릭 — 설정 변경 없이 바로 배포

### 3. 팀원 초대

배포된 URL(예: `https://your-app.vercel.app`)에 접속 후:

1. 우상단 **멤버 초대** 클릭 → 이름/아이디/역할 입력 → 초대 링크 생성
2. 팀원에게 링크 공유
3. 팀원이 링크 접속 → **Claude Code 연동 curl 명령어** 복사 후 터미널에서 실행

이후 Claude Code 사용 시 대시보드에 팀원 활동이 자동으로 표시됩니다.

---

## 업데이트

Vercel은 GitHub `main` 브랜치 푸시 시 자동 배포됩니다.
