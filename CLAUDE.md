# MDI Dashboard — Claude Instructions

## 작업 상태 자동 업데이트

이 프로젝트에서 작업할 때 **항상** 아래 규칙을 따른다:

### 작업 시작 시
`data/team/shawn.md` 의 `currentActivity` 필드를 작업 내용으로 업데이트:
```yaml
currentActivity: "[작업 내용 요약]"
```
예시:
- `currentActivity: "T-003 JWT 취약점 분석 중"`
- `currentActivity: "로그인 API 보안 검토 중"`
- `currentActivity: "의존성 취약점 스캔 중"`

### 작업 완료 시 (필수 — 마지막 응답 전에 반드시 실행)
`currentActivity` 를 비운다:
```yaml
currentActivity:
```

### 규칙
- 작업 내용은 **한국어**로 간결하게 (20자 이내)
- 파일 직접 수정: `data/team/shawn.md` frontmatter 의 `currentActivity` 만 변경
- 다른 필드(id, name, role, status 등)는 건드리지 않는다
- **사용자에게 최종 답변하기 직전, `currentActivity` 를 반드시 비워야 한다**
- 작업 시작 → `currentActivity` 설정 → 작업 수행 → `currentActivity` 초기화 → 답변
