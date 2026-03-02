"use client";
import { useState, useCallback } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { statusLabel, priorityLabel, Status } from "@/lib/data";
import type { Task, Member } from "@/lib/data";
import Avatar from "./Avatar";
import TaskModal from "./TaskModal";

const COLUMNS: { status: Status; label: string; color: string }[] = [
  { status: "backlog",   label: "백로그",  color: "#52525b" },
  { status: "progress",  label: "진행 중", color: "#f59e0b" },
  { status: "review",    label: "리뷰 중", color: "#a78bfa" },
  { status: "done",      label: "완료",   color: "#34d399" },
  { status: "cancelled", label: "취소",   color: "#71717a" },
];

const PRIORITY_COLORS: Record<string, string> = {
  low:      "#6b7280",
  medium:   "#f59e0b",
  high:     "#f97316",
  critical: "#ef4444",
};

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function KanbanCard({
  task,
  members,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  task: Task;
  members: Member[];
  isDragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onClick: (id: string) => void;
}) {
  const assignee = members.find((m) => m.id === task.assigneeId);
  return (
    <div
      draggable
      onDragStart={(e) => { e.stopPropagation(); onDragStart(task.id); }}
      onDragEnd={onDragEnd}
      onClick={() => onClick(task.id)}
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-bg-border)",
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 8,
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.4 : 1,
        transition: "opacity 0.15s, box-shadow 0.15s",
        boxShadow: isDragging ? "none" : "0 1px 3px rgba(0,0,0,0.2)",
        userSelect: "none",
      }}
    >
      {/* ID + Priority */}
      <div className="flex items-center justify-between mb-1.5">
        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-accent-blue)", opacity: 0.8 }}>
          {task.id}
        </span>
        <span style={{
          fontSize: 10, padding: "1px 6px", borderRadius: 4, fontWeight: 600,
          background: `${PRIORITY_COLORS[task.priority]}22`,
          color: PRIORITY_COLORS[task.priority],
        }}>
          {priorityLabel[task.priority]}
        </span>
      </div>

      {/* Title */}
      <p style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.4, marginBottom: 8, wordBreak: "break-word" }}>
        {task.title}
      </p>

      {/* Footer: assignee + due */}
      <div className="flex items-center justify-between">
        {assignee ? (
          <div className="flex items-center gap-1.5">
            <Avatar initials={assignee.initials} colorIndex={assignee.avatarColor} size="sm" />
            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{assignee.name}</span>
          </div>
        ) : (
          <span />
        )}
        {task.due && (
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--color-text-dimmed)" }}>
            {task.due.slice(5, 10)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Kanban View ──────────────────────────────────────────────────────────────

export default function KanbanView() {
  const { tasks, members, projects, updateTask } = useDashboardStore();
  const [dragTaskId, setDragTaskId]   = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [projectFilter, setProjectFilter]   = useState<string>("all");

  const filteredTasks = projectFilter === "all"
    ? tasks
    : tasks.filter((t) => t.projectId === projectFilter);

  const handleDrop = useCallback(
    async (targetStatus: Status) => {
      if (!dragTaskId) return;
      const task = tasks.find((t) => t.id === dragTaskId);
      if (!task || task.status === targetStatus) {
        setDragTaskId(null);
        setDragOverCol(null);
        return;
      }
      // Optimistic update
      updateTask({ ...task, status: targetStatus });
      setDragTaskId(null);
      setDragOverCol(null);

      try {
        const res = await fetch(`/api/tasks/${dragTaskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: targetStatus }),
        });
        if (res.ok) {
          updateTask(await res.json());
        } else {
          updateTask(task); // revert
        }
      } catch {
        updateTask(task); // revert on network error
      }
    },
    [dragTaskId, tasks, updateTask]
  );

  return (
    <div
      className="flex-1 flex flex-col p-5"
      style={{ background: "var(--color-bg-base)", overflow: "hidden" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2
          style={{
            fontFamily: "var(--font-display)", color: "var(--color-text-secondary)",
            letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 11, fontWeight: 700,
          }}
        >
          칸반 보드
        </h2>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 11, color: "var(--color-text-dimmed)" }}>프로젝트</span>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            style={{
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-bg-border)",
              borderRadius: 6, padding: "4px 8px",
              fontSize: 12, color: "var(--color-text-secondary)",
              outline: "none", cursor: "pointer",
            }}
          >
            <option value="all">전체</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Board */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 12,
          flex: 1,
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {COLUMNS.map(({ status, label, color }) => {
          const colTasks = filteredTasks.filter((t) => t.status === status);
          const isOver   = dragOverCol === status;

          return (
            <div
              key={status}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(status); }}
              onDragLeave={(e) => {
                // only clear if leaving the column container itself
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverCol(null);
                }
              }}
              onDrop={(e) => { e.preventDefault(); handleDrop(status); }}
              style={{
                display: "flex",
                flexDirection: "column",
                background: isOver ? `${color}0d` : "var(--color-bg-card)",
                border: isOver ? `1.5px dashed ${color}99` : "1px solid var(--color-bg-border)",
                borderRadius: 10,
                overflow: "hidden",
                transition: "border 0.12s, background 0.12s",
              }}
            >
              {/* Column header */}
              <div
                style={{
                  padding: "10px 12px",
                  display: "flex", alignItems: "center", gap: 8,
                  borderBottom: `2px solid ${color}`,
                  background: "var(--color-bg-elevated)",
                  flexShrink: 0,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", fontFamily: "var(--font-display)" }}>
                  {label}
                </span>
                <span style={{
                  marginLeft: "auto", fontSize: 11, fontFamily: "var(--font-mono)",
                  background: "var(--color-bg-border)", color: "var(--color-text-muted)",
                  borderRadius: 4, padding: "1px 6px",
                }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ padding: "10px", overflowY: "auto", flex: 1, minHeight: 0 }}>
                {colTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    members={members}
                    isDragging={dragTaskId === task.id}
                    onDragStart={setDragTaskId}
                    onDragEnd={() => { setDragTaskId(null); setDragOverCol(null); }}
                    onClick={setSelectedTaskId}
                  />
                ))}

                {/* Drop hint */}
                {colTasks.length === 0 && (
                  <div style={{
                    textAlign: "center", padding: "32px 8px",
                    color: "var(--color-text-dimmed)", fontSize: 12,
                    opacity: isOver ? 1 : 0.4,
                    transition: "opacity 0.15s",
                  }}>
                    {isOver ? `→ ${label}으로 이동` : "작업 없음"}
                  </div>
                )}

                {/* Drop target indicator when column has cards */}
                {colTasks.length > 0 && isOver && dragTaskId && (
                  <div style={{
                    height: 4, borderRadius: 4, marginBottom: 4,
                    background: `${color}66`,
                    transition: "background 0.12s",
                  }} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTaskId && (
        <TaskModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      )}
    </div>
  );
}

// suppress unused warning
void statusLabel;
