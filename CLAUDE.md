# MDI Dashboard — Claude Instructions

## 워크플로우 (필수 준수)

모든 작업은 아래 순서를 반드시 따른다:

### 1. 작업 시작
```bash
# status: active 확인 (SessionStart hook이 자동 설정하지만 명시적으로 확인)
curl -s -X PATCH http://192.168.130.36:3001/api/team/shawn \
  -H 'Content-Type: application/json' \
  -d '{"currentActivity":"[작업 내용 요약]"}' > /dev/null 2>&1 &
```

### 2. 작업 항목 생성 (MDI API)
- 사용자 요청을 받으면 **즉시 MDI 태스크 생성** 후 진행
- `title`: 작업 제목 (간결하게)
- `description`: 작업 내용 상세 설명 (무엇을 왜 하는지)
- 각 작업은 `progress` → `done` 순서로 상태 관리

```bash
NEXT_ID=$(curl -s http://192.168.130.36:3001/api/tasks | python3 -c "
import json,sys
tasks=json.load(sys.stdin)
nums=[int(t['id'].replace('T-','')) for t in tasks if t['id'].startswith('T-') and t['id'][2:].isdigit()]
print('T-'+str((max(nums) if nums else 0)+1).zfill(3))
")
curl -s -X POST http://192.168.130.36:3001/api/tasks \
  -H 'Content-Type: application/json' \
  -d "{\"id\":\"$NEXT_ID\",\"title\":\"[작업제목]\",\"description\":\"[작업 상세 설명]\",\"status\":\"progress\",\"priority\":\"medium\",\"assigneeId\":\"shawn\",\"projectId\":\"mdi\",\"due\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"startDate\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > /dev/null 2>&1
```

### 3. 작업 진행
- 각 세부 작업 시작 시 TaskUpdate로 `in_progress` 표시
- currentActivity를 해당 작업 내용으로 업데이트

### 4. 종료 (필수 — 모든 작업 완료 후)
```bash
# 1) MDI 태스크 → status: done
# 2) currentActivity 초기화
curl -s -X PATCH http://192.168.130.36:3001/api/team/shawn \
  -H 'Content-Type: application/json' \
  -d '{"currentActivity":""}' > /dev/null 2>&1 &
# 참고: Stop hook은 currentActivity만 초기화 (status 유지)
```

## 상태 업데이트 규칙

- 작업 내용은 **한국어**, 20자 이내
- **파일 직접 수정 금지**: `data/team/shawn.md` 편집 금지
  - mdi-sync.js가 파일 변경 감지 시 서버로 push → `status` 덮어씌워짐
- 반드시 **REST API (curl PATCH)** 만 사용

```bash
# currentActivity 설정
curl -s -X PATCH http://192.168.130.36:3001/api/team/shawn \
  -H 'Content-Type: application/json' \
  -d '{"currentActivity":"[내용]"}' > /dev/null 2>&1 &

# currentActivity 초기화
curl -s -X PATCH http://192.168.130.36:3001/api/team/shawn \
  -H 'Content-Type: application/json' \
  -d '{"currentActivity":""}' > /dev/null 2>&1 &
```

## 체크리스트

- [ ] 작업 시작 → currentActivity 설정
- [ ] TaskCreate로 작업 항목 생성
- [ ] 각 작업 → TaskUpdate(in_progress) → 수행 → TaskUpdate(completed)
- [ ] 모든 작업 완료 → currentActivity 초기화
- [ ] 최종 답변
