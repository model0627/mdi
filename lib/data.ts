// ─── Types ────────────────────────────────────────────────────────────────────

export type Status = "backlog" | "progress" | "review" | "done" | "cancelled";
export type Priority = "low" | "medium" | "high" | "critical";

export interface Member {
  id: string;
  name: string;
  initials: string;
  avatarColor: number; // index 0-7
  role: string;
  status: "active" | "away" | "offline";
  currentActivity?: string;
}

export interface Task {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  assigneeId: string;
  projectId: string;
  created: string;
  due: string;
  startDate: string;
  actualStart?: string;  // ISO datetime — status가 progress로 바뀔 때 자동 설정
  actualEnd?: string;    // ISO datetime — status가 done으로 바뀔 때 자동 설정
  description?: string;  // 태스크 설명 (POST 시 전달, MD body에 저장)
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  memberIds: string[];
  taskIds: string[];
  startDate: string;
  endDate: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

export const members: Member[] = [
  { id: "m1", name: "김지수", initials: "JS", avatarColor: 0, role: "Frontend Dev", status: "active", currentActivity: "Writing code" },
  { id: "m2", name: "박민준", initials: "MJ", avatarColor: 1, role: "Backend Dev",  status: "active", currentActivity: "2 tasks in-progress" },
  { id: "m3", name: "이서연", initials: "SY", avatarColor: 2, role: "Designer",     status: "active", currentActivity: "3 tasks in-review" },
  { id: "m4", name: "최현우", initials: "HW", avatarColor: 3, role: "DevOps",       status: "active", currentActivity: "Reviewing PR #42" },
  { id: "m5", name: "정하은", initials: "HE", avatarColor: 4, role: "QA Engineer",  status: "away",  currentActivity: undefined },
  { id: "m6", name: "강도윤", initials: "DY", avatarColor: 5, role: "PM",           status: "active", currentActivity: "Planning sprint" },
];

export const tasks: Task[] = [
  // Alpha
  { id: "T-01", title: "로그인 UI 구현",         status: "done",      priority: "medium",   assigneeId: "m1", projectId: "p1", created: "2025-01-10", due: "2025-01-20", startDate: "2025-01-10" },
  { id: "T-02", title: "API 인증 미들웨어",        status: "done",      priority: "high",     assigneeId: "m2", projectId: "p1", created: "2025-01-12", due: "2025-01-22", startDate: "2025-01-12" },
  { id: "T-03", title: "대시보드 레이아웃",        status: "progress",  priority: "high",     assigneeId: "m1", projectId: "p1", created: "2025-01-18", due: "2025-02-05", startDate: "2025-01-20" },
  { id: "T-04", title: "데이터베이스 스키마 설계", status: "review",    priority: "critical", assigneeId: "m2", projectId: "p1", created: "2025-01-20", due: "2025-02-10", startDate: "2025-01-21" },
  { id: "T-05", title: "반응형 네비게이션",        status: "progress",  priority: "medium",   assigneeId: "m3", projectId: "p1", created: "2025-01-22", due: "2025-02-08", startDate: "2025-01-23" },
  // Beta
  { id: "T-06", title: "CI/CD 파이프라인 구성",   status: "done",      priority: "high",     assigneeId: "m4", projectId: "p2", created: "2025-01-08", due: "2025-01-25", startDate: "2025-01-08" },
  { id: "T-07", title: "컴포넌트 라이브러리",      status: "review",    priority: "medium",   assigneeId: "m3", projectId: "p2", created: "2025-01-15", due: "2025-02-12", startDate: "2025-01-16" },
  { id: "T-08", title: "성능 최적화",              status: "progress",  priority: "high",     assigneeId: "m2", projectId: "p2", created: "2025-01-20", due: "2025-02-15", startDate: "2025-01-22" },
  { id: "T-09", title: "E2E 테스트 작성",          status: "backlog",   priority: "low",      assigneeId: "m5", projectId: "p2", created: "2025-01-25", due: "2025-02-20", startDate: "2025-02-01" },
  { id: "T-10", title: "접근성 감사",              status: "backlog",   priority: "medium",   assigneeId: "m5", projectId: "p2", created: "2025-01-25", due: "2025-02-22", startDate: "2025-02-05" },
  // Gamma
  { id: "T-11", title: "마케팅 랜딩 페이지",       status: "review",    priority: "high",     assigneeId: "m3", projectId: "p3", created: "2025-01-14", due: "2025-02-03", startDate: "2025-01-15" },
  { id: "T-12", title: "이메일 템플릿",             status: "progress",  priority: "medium",   assigneeId: "m1", projectId: "p3", created: "2025-01-18", due: "2025-02-07", startDate: "2025-01-19" },
  { id: "T-13", title: "분석 대시보드 통합",        status: "backlog",   priority: "medium",   assigneeId: "m6", projectId: "p3", created: "2025-01-22", due: "2025-02-25", startDate: "2025-02-10" },
  { id: "T-14", title: "SEO 메타데이터",            status: "cancelled", priority: "low",      assigneeId: "m1", projectId: "p3", created: "2025-01-10", due: "2025-01-30", startDate: "2025-01-10" },
];

export const projects: Project[] = [
  {
    id: "p1",
    name: "Alpha — 코어 플랫폼",
    description: "사용자 인증, API 레이어, 메인 대시보드 구축",
    color: "#4f8ef7",
    memberIds: ["m1", "m2", "m3"],
    taskIds: ["T-01", "T-02", "T-03", "T-04", "T-05"],
    startDate: "2025-01-10",
    endDate: "2025-02-28",
  },
  {
    id: "p2",
    name: "Beta — 인프라 & QA",
    description: "CI/CD 자동화, 컴포넌트 라이브러리, 테스트 커버리지",
    color: "#34d399",
    memberIds: ["m2", "m3", "m4", "m5"],
    taskIds: ["T-06", "T-07", "T-08", "T-09", "T-10"],
    startDate: "2025-01-08",
    endDate: "2025-03-07",
  },
  {
    id: "p3",
    name: "Gamma — 마케팅",
    description: "랜딩 페이지, 이메일 캠페인, 분석 통합",
    color: "#f97316",
    memberIds: ["m1", "m3", "m6"],
    taskIds: ["T-11", "T-12", "T-13", "T-14"],
    startDate: "2025-01-14",
    endDate: "2025-02-25",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const getMember = (id: string) => members.find((m) => m.id === id)!;
export const getProject = (id: string) => projects.find((p) => p.id === id)!;
export const getProjectTasks = (pid: string) => tasks.filter((t) => t.projectId === pid);
export const getMemberTasks = (mid: string) => tasks.filter((t) => t.assigneeId === mid);

export const statusLabel: Record<Status, string> = {
  backlog:   "백로그",
  progress:  "진행 중",
  review:    "리뷰 중",
  done:      "완료",
  cancelled: "취소",
};

export const priorityLabel: Record<Priority, string> = {
  low:      "낮음",
  medium:   "중간",
  high:     "높음",
  critical: "긴급",
};

export function projectProgress(pid: string): number {
  const t = getProjectTasks(pid);
  if (!t.length) return 0;
  const done = t.filter((x) => x.status === "done" || x.status === "cancelled").length;
  return Math.round((done / t.length) * 100);
}
