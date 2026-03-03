# MDI Dashboard — Claude Instructions

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
