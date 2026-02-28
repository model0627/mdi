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
      <td>
        {assignee ? (
          <div className="flex items-center gap-1.5">
            <Avatar initials={assignee.initials} colorIndex={assignee.avatarColor} size="sm" />
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{assignee.name}</span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: "var(--color-text-dimmed)" }}>—</span>
        )}
      </td>
      <td>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-secondary)" }}>
          {fmtDate(task.created)}
        </span>
      </td>
      <td>
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
  if (filtered.length === 0) return null;

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

      {open && (
        <table className="task-table w-full" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 72 }} />
            <col />
            <col style={{ width: 110 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 140 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 120 }} />
          </colgroup>
          <thead>
            <tr>
              {["ID", "제목", "상태", "우선순위", "담당자", "생성일", "마감일"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => (
              <TaskRow key={t.id} task={t} members={members} index={i} onClick={() => onTaskClick(t.id)} />
            ))}
          </tbody>
        </table>
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

export default function TaskListView() {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { projects, tasks, members } = useDashboardStore();

  return (
    <div className="flex-1 overflow-auto p-5" style={{ background: "var(--color-bg-base)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-sm font-bold"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 11 }}
        >
          작업 목록
        </h2>
        <div className="flex items-center gap-1.5">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className="px-2.5 py-1 rounded text-xs font-medium transition-all"
              style={{
                fontFamily: "var(--font-display)",
                background: filter === value ? "var(--color-bg-elevated)" : "transparent",
                color: filter === value ? "var(--color-text-primary)" : "var(--color-text-muted)",
                border: filter === value ? "1px solid var(--color-bg-border)" : "1px solid transparent",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {projects.map((p) => (
        <ProjectSection key={p.id} project={p} tasks={tasks} members={members} filter={filter} onTaskClick={setSelectedTaskId} />
      ))}

      {/* 미분류 섹션 */}
      {(() => {
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
            onTaskClick={setSelectedTaskId}
          />
        );
      })()}

      {selectedTaskId && (
        <TaskModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      )}
    </div>
  );
}

// Suppress unused import warning - these are used for type reference
void statusLabel;
void priorityLabel;
