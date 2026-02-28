"use client";
import { useState } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import {
  statusLabel,
  Status,
} from "@/lib/data";
import type { Project, Member, Task } from "@/lib/data";
import Avatar from "./Avatar";
import StatusBadge from "./StatusBadge";
import TaskModal from "./TaskModal";

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({ project, tasks, members, index }: {
  project: Project;
  tasks: Task[];
  members: Member[];
  index: number;
}) {
  const ptasks = tasks.filter((t) => t.projectId === project.id);
  const done = ptasks.filter((t) => t.status === "done" || t.status === "cancelled").length;
  const progress = ptasks.length > 0 ? Math.round((done / ptasks.length) * 100) : 0;
  const countByStatus = (s: Status) => ptasks.filter((t) => t.status === s).length;

  const statusDots: { status: Status; color: string }[] = [
    { status: "progress", color: "#f59e0b" },
    { status: "review",   color: "#a78bfa" },
    { status: "done",     color: "#34d399" },
    { status: "backlog",  color: "#52525b" },
  ];

  const getMember = (id: string) => members.find((m) => m.id === id);

  return (
    <div
      className="card-interactive animate-slide-in-up rounded-lg overflow-hidden"
      style={{
        animationDelay: `${index * 0.1}s`,
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-bg-border)",
        borderLeft: `3px solid ${project.color}`,
      }}
    >
      <div className="p-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3
            className="text-sm font-bold leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
          >
            {project.name}
          </h3>
          <span
            className="text-xs shrink-0"
            style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
          >
            {project.startDate.slice(0, 10).slice(5)} – {project.endDate.slice(0, 10).slice(5)}
          </span>
        </div>

        <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
          {project.description}
        </p>

        {/* Progress bar */}
        <div className="progress-track mb-2">
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${project.color}99, ${project.color})`,
            }}
          />
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            완료 {progress}%
          </span>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {ptasks.length}개 작업
          </span>
        </div>

        {/* Status dots */}
        <div className="flex items-center gap-2 flex-wrap">
          {statusDots.map(({ status, color }) => {
            const n = countByStatus(status);
            if (n === 0) return null;
            return (
              <span key={status} className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                <span className="rounded-full" style={{ width: 7, height: 7, background: color, display: "inline-block" }} />
                {n} {statusLabel[status]}
              </span>
            );
          })}
        </div>
      </div>

      {/* Member avatars footer */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{ borderTop: "1px solid var(--color-bg-divider)" }}
      >
        <div className="flex items-center" style={{ gap: -4 }}>
          {project.memberIds.map((mid, i) => {
            const m = getMember(mid);
            if (!m) return null;
            return (
              <div key={mid} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: project.memberIds.length - i }}>
                <Avatar initials={m.initials} colorIndex={m.avatarColor} size="sm" />
              </div>
            );
          })}
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{
            background: "rgba(79,142,247,0.15)",
            color: "var(--color-accent-blue)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {project.memberIds.length}명
        </span>
      </div>
    </div>
  );
}

// ─── Team Member Card ─────────────────────────────────────────────────────────

function MemberCard({ member, tasks, index, onTaskClick }: {
  member: Member;
  tasks: Task[];
  index: number;
  onTaskClick: (taskId: string) => void;
}) {
  const mtasks = tasks.filter((t) => t.assigneeId === member.id);
  const today     = "2025-01-27";
  const yesterday = "2025-01-26";

  const inProgress = mtasks.filter((t) => t.status === "progress");
  const inReview   = mtasks.filter((t) => t.status === "review");
  const todayDone  = mtasks.filter((t) => t.status === "done" && t.due === today);
  const yestDone   = mtasks.filter((t) => t.status === "done" && t.due === yesterday);

  const totalActive = inProgress.length + inReview.length;

  return (
    <div
      className="card-interactive animate-slide-in-up rounded-lg relative"
      style={{
        animationDelay: `${0.3 + index * 0.07}s`,
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-bg-border)",
      }}
    >
      {totalActive > 0 && (
        <div
          className="absolute -top-2 -right-2 rounded-full flex items-center justify-center font-bold text-white z-10"
          style={{
            width: 20, height: 20, fontSize: 10,
            background: "var(--color-accent-blue)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {totalActive}
        </div>
      )}

      <div className="p-3">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="relative">
            <Avatar initials={member.initials} colorIndex={member.avatarColor} size="md" />
            <span
              className="absolute bottom-0 right-0 rounded-full border"
              style={{
                width: 9, height: 9,
                background: member.status === "active" ? "var(--color-live)" : "#71717a",
                borderColor: "var(--color-bg-card)",
              }}
            />
          </div>
          <div>
            <p className="text-xs font-bold leading-tight" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>
              {member.name}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{member.role}</p>
          </div>
          <span
            className="ml-auto text-xs rounded-full px-2 py-0.5"
            style={{
              background: member.status === "active" ? "rgba(34,197,94,0.15)" : "rgba(113,113,122,0.15)",
              color: member.status === "active" ? "var(--color-live)" : "#71717a",
            }}
          >
            {member.status === "active" ? "active" : member.status}
          </span>
        </div>

        {member.currentActivity && (
          <div
            className="flex items-center gap-1.5 mb-2 px-2 py-1.5 rounded"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            <span
              className="animate-pulse rounded-full shrink-0"
              style={{ width: 6, height: 6, background: "var(--color-live)" }}
            />
            <span className="text-xs truncate" style={{ color: "var(--color-live)", fontFamily: "var(--font-mono)" }}>
              {member.currentActivity}
            </span>
          </div>
        )}

        {[
          { label: "진행 중", items: inProgress, dot: "#f59e0b" },
          { label: "리뷰 중", items: inReview,   dot: "#a78bfa" },
          { label: "오늘",    items: todayDone,  dot: "#34d399" },
          { label: "어제",    items: yestDone,   dot: "#52525b" },
        ].map(({ label, items, dot }) =>
          items.length > 0 ? (
            <div key={label} className="mb-2">
              <p
                className="text-xs mb-1"
                style={{ color: "var(--color-text-dimmed)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}
              >
                {label}
              </p>
              {items.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-1.5 mb-0.5 rounded px-1 -mx-1"
                  style={{ cursor: "pointer" }}
                  onClick={() => onTaskClick(t.id)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span className="rounded-full shrink-0" style={{ width: 5, height: 5, background: dot }} />
                  <span className="text-xs truncate" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>
                    {t.title}
                  </span>
                </div>
              ))}
            </div>
          ) : null
        )}

        {totalActive === 0 && !todayDone.length && !yestDone.length && (
          <p className="text-xs" style={{ color: "var(--color-text-dimmed)" }}>할당된 활성 작업 없음</p>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────

export default function DashboardView() {
  const { projects, members, tasks } = useDashboardStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-auto p-5" style={{ background: "var(--color-bg-base)" }}>
      {/* Projects */}
      <section className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-sm font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 11 }}
          >
            프로젝트
          </h2>
          <span className="text-xs" style={{ color: "var(--color-text-dimmed)" }}>
            {projects.length}개 활성
          </span>
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} tasks={tasks} members={members} index={i} />
          ))}
        </div>
      </section>

      {/* Team Activity */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-sm font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 11 }}
          >
            팀 활동
          </h2>
          <span className="text-xs" style={{ color: "var(--color-text-dimmed)" }}>
            {members.filter((m) => m.status === "active").length}명 온라인
          </span>
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {members.map((m, i) => (
            <MemberCard key={m.id} member={m} tasks={tasks} index={i} onTaskClick={setSelectedTaskId} />
          ))}
        </div>
      </section>

      {selectedTaskId && (
        <TaskModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      )}
    </div>
  );
}
