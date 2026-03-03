"use client";
import { useState } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { statusLabel, priorityLabel, Status } from "@/lib/data";
import type { Task, Project, Member } from "@/lib/data";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import Avatar from "./Avatar";
import TaskModal from "./TaskModal";

function fmtDate(d: string) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d.slice(5, 10);
  const mm  = String(dt.getMonth() + 1).padStart(2, "0");
  const dd  = String(dt.getDate()).padStart(2, "0");
  const hh  = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  return `${mm}-${dd} ${hh}:${min}`;
}

const STATUS_ORDER: Status[] = ["progress", "review", "backlog", "done", "cancelled"];

function TaskRow({ task, members, index, onClick }: { task: Task; members: Member[]; index: number; onClick: () => void }) {
  const assignee = members.find((m) => m.id === task.assigneeId);
  return (
    <tr
      className="animate-slide-in-up"
      style={{ animationDelay: `${index * 0.03}s`, cursor: "pointer" }}
      onClick={onClick}
    >
      <td>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-accent-blue)", opacity: 0.75 }}>
          {task.id}
        </span>
      </td>
      <td>
        <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{task.title}</span>
      </td>
      <td><StatusBadge status={task.status} /></td>
      <td><PriorityBadge priority={task.priority} /></td>
      <td className="col-hide-mobile">
        {assignee ? (
          <div className="flex items-center gap-1.5">
            <Avatar initials={assignee.initials} colorIndex={assignee.avatarColor} size="sm" />
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{assignee.name}</span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: "var(--color-text-dimmed)" }}>—</span>
        )}
      </td>
      <td className="col-hide-mobile">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-secondary)" }}>
          {fmtDate(task.created)}
        </span>
      </td>
      <td className="col-hide-mobile">
        <span
          style={{
            fontFamily: "var(--font-mono)", fontSize: 12,
            color: task.status === "cancelled" ? "var(--color-text-muted)" : "var(--color-text-secondary)",
            textDecoration: task.status === "cancelled" ? "line-through" : "none",
          }}
        >
          {fmtDate(task.due)}
        </span>
      </td>
    </tr>
  );
}

function ProjectSection({
  project,
  tasks,
  members,
  filter,
  defaultOpen = true,
  onTaskClick,
}: {
  project: Project;
  tasks: Task[];
  members: Member[];
  filter: Status | "all";
  defaultOpen?: boolean;
  onTaskClick: (id: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const ptasks = tasks
    .filter((t) => t.projectId === project.id)
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  const filtered = filter === "all" ? ptasks : ptasks.filter((t) => t.status === filter);
  if (filtered.length === 0 && filter !== "all") return null;

  return (
    <div
      className="mb-4 rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--color-bg-border)", background: "var(--color-bg-card)" }}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{
          borderBottom: open ? "1px solid var(--color-bg-border)" : "none",
          background: "var(--color-bg-elevated)",
        }}
        onClick={() => setOpen(!open)}
      >
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s ease", color: "var(--color-text-muted)", flexShrink: 0 }}
        >
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="rounded-sm" style={{ width: 10, height: 10, background: project.color, display: "inline-block" }} />
        <span className="text-sm font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
          {project.name}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold ml-1"
          style={{ background: "var(--color-bg-border)", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
        >
          {filtered.length}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {(["progress", "review", "done"] as Status[]).map((s) => {
            const n = filtered.filter((t) => t.status === s).length;
            if (!n) return null;
            const dotColors: Record<string, string> = { progress: "#f59e0b", review: "#a78bfa", done: "#34d399" };
            return (
              <span key={s} className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                <span className="rounded-full" style={{ width: 6, height: 6, background: dotColors[s], display: "inline-block" }} />
                {n}
              </span>
            );
          })}
        </div>
      </button>

      {open && filtered.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-10 gap-2"
          style={{ color: "var(--color-text-dimmed)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="12" y1="9" x2="12" y2="15" />
          </svg>
          <span style={{ fontSize: 12, fontFamily: "var(--font-display)" }}>태스크가 없습니다</span>
        </div>
      )}

      {open && filtered.length > 0 && (
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table className="task-table w-full" style={{ tableLayout: "fixed", minWidth: 640 }}>
          <colgroup>
            <col style={{ width: 72 }} />
            <col />
            <col style={{ width: 110 }} />
            <col style={{ width: 80 }} />
            <col className="col-hide-mobile" style={{ width: 140 }} />
            <col className="col-hide-mobile" style={{ width: 120 }} />
            <col className="col-hide-mobile" style={{ width: 120 }} />
          </colgroup>
          <thead>
            <tr>
              <th>ID</th>
              <th>제목</th>
              <th>상태</th>
              <th>우선순위</th>
              <th className="col-hide-mobile">담당자</th>
              <th className="col-hide-mobile">생성일</th>
              <th className="col-hide-mobile">마감일</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => (
              <TaskRow key={t.id} task={t} members={members} index={i} onClick={() => onTaskClick(t.id)} />
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

const STATUS_FILTERS: { value: Status | "all"; label: string }[] = [
  { value: "all",       label: "전체" },
  { value: "progress",  label: "진행 중" },
  { value: "review",    label: "리뷰 중" },
  { value: "backlog",   label: "백로그" },
  { value: "done",      label: "완료" },
  { value: "cancelled", label: "취소" },
];

function BackupButton() {
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("Backup failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? "mdi-backup.zip";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBackup}
      disabled={loading}
      title="작업 목록 ZIP 백업 다운로드"
      style={{
        fontSize: 11, fontFamily: "var(--font-display)",
        color: "var(--color-text-muted)",
        padding: "4px 10px", borderRadius: 6,
        border: "1px solid var(--color-bg-border)",
        background: "transparent",
        cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.6 : 1,
        display: "flex", alignItems: "center", gap: 4,
      }}
    >
      {loading ? "생성 중..." : "⬇ 백업"}
    </button>
  );
}

export default function TaskListView({ projectFilter, onClearFilter }: { projectFilter?: string | null; onClearFilter?: () => void } = {}) {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("task");
    }
    return null;
  });
  const { projects, tasks, members } = useDashboardStore();

  const handleTaskClick = (id: string) => {
    setSelectedTaskId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("task", id);
    window.history.pushState({}, "", url.toString());
  };

  const handleTaskClose = () => {
    setSelectedTaskId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("task");
    window.history.pushState({}, "", url.toString());
  };

  return (
    <div className="flex-1 overflow-auto p-3 sm:p-5" style={{ background: "var(--color-bg-base)" }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2
          className="text-sm font-bold"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 11 }}
        >
          작업 목록
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
        <BackupButton />
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className="px-2 sm:px-2.5 py-1 rounded text-xs font-medium transition-all"
              style={{
                fontFamily: "var(--font-display)",
                background: filter === value ? "var(--color-bg-elevated)" : "transparent",
                color: filter === value ? "var(--color-text-primary)" : "var(--color-text-muted)",
                border: filter === value ? "1px solid var(--color-bg-border)" : "1px solid transparent",
                minHeight: 32,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        </div>
      </div>

      {projectFilter && (
        <div
          className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-xs"
          style={{ background: "rgba(79,142,247,0.08)", border: "1px solid rgba(79,142,247,0.2)", color: "var(--color-accent-blue)" }}
        >
          <span>프로젝트 필터:</span>
          <span className="font-semibold">{projects.find((p) => p.id === projectFilter)?.name ?? projectFilter}</span>
          <button
            onClick={onClearFilter}
            style={{ marginLeft: "auto", opacity: 0.7, cursor: "pointer" }}
          >
            ✕ 전체 보기
          </button>
        </div>
      )}

      {(projectFilter ? projects.filter((p) => p.id === projectFilter) : projects).map((p) => (
        <ProjectSection key={p.id} project={p} tasks={tasks} members={members} filter={filter} onTaskClick={handleTaskClick} />
      ))}

      {/* 미분류 섹션 */}
      {!projectFilter && (() => {
        const projectIds = new Set(projects.map((p) => p.id));
        const unassigned = tasks.filter((t) => !t.projectId || !projectIds.has(t.projectId));
        const filtered = filter === "all" ? unassigned : unassigned.filter((t) => t.status === filter);
        if (filtered.length === 0) return null;
        const fakeProject = { id: "", name: "미분류", color: "#71717a", description: "", startDate: "", endDate: "", memberIds: [], taskIds: [] };
        return (
          <ProjectSection
            key="__unassigned__"
            project={fakeProject as unknown as import("@/lib/data").Project}
            tasks={tasks}
            members={members}
            filter={filter}
            defaultOpen={false}
            onTaskClick={handleTaskClick}
          />
        );
      })()}

      {selectedTaskId && (
        <TaskModal taskId={selectedTaskId} onClose={handleTaskClose} />
      )}
    </div>
  );
}

// Suppress unused import warning - these are used for type reference
void statusLabel;
void priorityLabel;
