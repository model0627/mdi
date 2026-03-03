"use client";
import { useMemo, useState } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { statusLabel, Status } from "@/lib/data";
import type { Task, Member, Project } from "@/lib/data";

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toDateStr(s: string): string { return s ? s.slice(0, 10) : ""; }

function daysBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86400000;
}

function getToday(): string { return new Date().toISOString().slice(0, 10); }

function addMonths(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ─── Chart ranges ─────────────────────────────────────────────────────────────

interface ChartRange { start: string; end: string; total: number }

function getMonthRange(tasks: Task[], projects: Project[]): ChartRange {
  const today = getToday();
  const dates: string[] = [today];
  for (const t of tasks) {
    if (t.startDate)   dates.push(toDateStr(t.startDate));
    if (t.due)         dates.push(toDateStr(t.due));
    if (t.actualStart) dates.push(toDateStr(t.actualStart));
    if (t.actualEnd)   dates.push(toDateStr(t.actualEnd));
  }
  for (const p of projects) {
    if (p.startDate) dates.push(toDateStr(p.startDate));
    if (p.endDate)   dates.push(toDateStr(p.endDate));
  }
  const sorted = [...new Set(dates.filter(Boolean))].sort();
  const start = addDays(sorted[0], -14);
  const end   = addMonths(sorted[sorted.length - 1], 1);
  return { start, end, total: Math.max(1, daysBetween(start, end)) };
}

function getWeekRange(): ChartRange {
  const today = getToday();
  const start = addDays(today, -3);   // 3일 전
  const end   = addDays(today, 18);   // 18일 후
  return { start, end, total: Math.max(1, daysBetween(start, end)) };
}

function pct(dateStr: string, range: ChartRange): number {
  if (!dateStr) return 0;
  const d = Math.max(0, Math.min(range.total, daysBetween(range.start, toDateStr(dateStr))));
  return d / range.total;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

interface Label { label: string; pos: number; isMonthStart: boolean }

function monthLabels(range: ChartRange): Label[] {
  const result: Label[] = [];
  const end = new Date(range.end);
  const cur = new Date(range.start);
  cur.setDate(1);
  while (cur <= end) {
    const ds = cur.toISOString().slice(0, 10);
    result.push({
      label: `${cur.getFullYear() % 100}년 ${cur.getMonth() + 1}월`,
      pos: pct(ds, range),
      isMonthStart: true,
    });
    cur.setMonth(cur.getMonth() + 1);
  }
  return result;
}

function weekLabels(range: ChartRange): Label[] {
  const result: Label[] = [];
  const end = new Date(range.end);
  // 가장 가까운 월요일로 시작
  const cur = new Date(range.start);
  const dow = cur.getDay();
  const offset = dow === 1 ? 0 : dow === 0 ? 1 : (8 - dow);
  cur.setDate(cur.getDate() + offset);

  while (cur <= end) {
    const ds = cur.toISOString().slice(0, 10);
    const isMonthStart = cur.getDate() <= 7;
    const label = isMonthStart
      ? `${cur.getMonth() + 1}월 ${cur.getDate()}일`
      : `${cur.getMonth() + 1}/${cur.getDate()}`;
    result.push({ label, pos: pct(ds, range), isMonthStart });
    cur.setDate(cur.getDate() + 7);
  }
  return result;
}

// ─── Bar colors ───────────────────────────────────────────────────────────────

const barColor: Record<Status, { bg: string; border: string }> = {
  backlog:   { bg: "rgba(82,82,91,0.45)",    border: "#52525b" },
  progress:  { bg: "rgba(245,158,11,0.6)",   border: "#f59e0b" },
  review:    { bg: "rgba(167,139,250,0.6)",  border: "#a78bfa" },
  done:      { bg: "rgba(52,211,153,0.5)",   border: "#34d399" },
  cancelled: { bg: "rgba(244,63,94,0.35)",   border: "#f43f5e" },
};

// ─── Gantt Row ────────────────────────────────────────────────────────────────

const MIN_BAR_PX = 8; // 최소 bar 너비 (px)

function GanttRow({ task, members, range, rowIndex }: {
  task: Task; members: Member[]; range: ChartRange; rowIndex: number;
}) {
  const assignee = members.find((m) => m.id === task.assigneeId);
  const today = getToday();
  const { bg, border } = barColor[task.status];

  const startDate = task.startDate || task.created || today;
  const dueDate   = task.due || startDate;

  const plannedL = pct(startDate, range);
  const plannedR = pct(dueDate, range);
  const plannedW = plannedR - plannedL;

  const hasActual = !!task.actualStart;
  const actualL   = hasActual ? pct(task.actualStart!, range) : null;
  const actualEnd = task.actualEnd
    ? toDateStr(task.actualEnd)
    : task.status === "progress" && task.actualStart ? today : null;
  const actualR = actualEnd ? pct(actualEnd, range) : null;
  const actualW = actualL !== null && actualR !== null ? actualR - actualL : null;

  const duration = task.actualStart
    ? task.actualEnd
      ? `${Math.round(daysBetween(task.actualStart, task.actualEnd))}일`
      : task.status === "progress" ? `${Math.round(daysBetween(task.actualStart, today))}일째` : null
    : null;

  return (
    <div
      className="flex items-center animate-slide-in-up"
      style={{ animationDelay: `${rowIndex * 0.04}s`, height: 44, borderBottom: "1px solid var(--color-bg-divider)" }}
    >
      {/* Label */}
      <div className="shrink-0 flex items-center gap-2 px-3" style={{ width: "min(260px, 40vw)", borderRight: "1px solid var(--color-bg-border)", height: "100%" }}>
        <div className="rounded-sm shrink-0" style={{ width: 8, height: 8, background: border }} />
        <span className="text-xs truncate flex-1" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>
          {task.title}
        </span>
        {duration && (
          <span style={{ fontSize: 9, color: border, fontFamily: "var(--font-mono)", flexShrink: 0 }}>
            {duration}
          </span>
        )}
        {assignee && (
          <div
            className="rounded-full shrink-0 flex items-center justify-center text-white font-semibold"
            style={{ width: 18, height: 18, fontSize: 8, background: `var(--color-avatar-${assignee.avatarColor})`, fontFamily: "var(--font-display)" }}
          >
            {assignee.initials.slice(0, 1)}
          </div>
        )}
      </div>

      {/* Bar area */}
      <div className="relative flex-1 h-full px-2 flex flex-col justify-center gap-1.5">
        {/* Track 1: Planned */}
        <div className="relative w-full" style={{ height: 7 }}>
          <div
            style={{
              position: "absolute",
              left: `${plannedL * 100}%`,
              width: plannedW > 0 ? `${plannedW * 100}%` : 0,
              minWidth: `${MIN_BAR_PX}px`,
              height: "100%",
              background: bg,
              border: `1px dashed ${border}`,
              borderRadius: 2,
              opacity: 0.45,
            }}
            title={`계획: ${startDate} → ${dueDate}`}
          />
        </div>

        {/* Track 2: Actual */}
        <div className="relative w-full" style={{ height: 10 }}>
          {actualL !== null && actualW !== null && (
            <div
              style={{
                position: "absolute",
                left: `${actualL * 100}%`,
                width: actualW > 0 ? `${actualW * 100}%` : 0,
                minWidth: `${MIN_BAR_PX}px`,
                height: "100%",
                background: bg,
                border: `1.5px solid ${border}`,
                borderRadius: 2,
                boxShadow: task.status === "progress" ? `0 0 6px ${border}55` : undefined,
              }}
              title={`실제: ${task.actualStart?.slice(0, 10)} → ${actualEnd ?? "진행 중"}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Gantt View ───────────────────────────────────────────────────────────────

type Zoom = "week" | "month";

export default function GanttView() {
  const { projects, tasks, members } = useDashboardStore();
  const [zoom, setZoom] = useState<Zoom>("week");

  const range = useMemo(
    () => zoom === "week" ? getWeekRange() : getMonthRange(tasks, projects),
    [zoom, tasks, projects],
  );
  const labels = useMemo(
    () => zoom === "week" ? weekLabels(range) : monthLabels(range),
    [zoom, range],
  );
  const today    = getToday();
  const todayPos = pct(today, range);

  return (
    <div className="flex-1 overflow-auto" style={{ background: "var(--color-bg-base)" }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20" style={{ background: "var(--color-bg-surface)", borderBottom: "1px solid var(--color-bg-border)" }}>
        <div className="flex items-center" style={{ height: 40 }}>
          {/* Left column: title + zoom toggle */}
          <div className="shrink-0 flex items-center gap-2 px-3" style={{ width: 260, height: "100%", borderRight: "1px solid var(--color-bg-border)" }}>
            <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 10 }}>
              작업 / 담당자
            </span>
            {/* Zoom toggle */}
            <div className="flex items-center gap-0.5 ml-auto" style={{ background: "var(--color-bg-base)", borderRadius: 4, padding: "2px", border: "1px solid var(--color-bg-border)" }}>
              {(["week", "month"] as Zoom[]).map((z) => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  style={{
                    padding: "1px 8px",
                    fontSize: 9,
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    borderRadius: 3,
                    border: "none",
                    cursor: "pointer",
                    background: zoom === z ? "var(--color-accent-blue)" : "transparent",
                    color: zoom === z ? "#fff" : "var(--color-text-muted)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {z === "week" ? "주별" : "월별"}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline labels */}
          <div className="relative flex-1 h-full overflow-hidden">
            {labels.map(({ label, pos, isMonthStart }) => (
              <div key={label} className="absolute top-0 flex items-center" style={{ left: `${pos * 100}%`, height: "100%", paddingLeft: 6 }}>
                <span style={{
                  fontSize: zoom === "week" ? (isMonthStart ? 10 : 9) : 10,
                  fontFamily: "var(--font-display)",
                  color: isMonthStart ? "var(--color-text-secondary)" : "var(--color-text-dimmed)",
                  fontWeight: isMonthStart ? 700 : 500,
                  whiteSpace: "nowrap",
                }}>
                  {label}
                </span>
                <div className="absolute left-0 top-0 bottom-0" style={{
                  width: 1,
                  background: isMonthStart ? "var(--color-bg-border)" : "var(--color-bg-divider)",
                }} />
              </div>
            ))}
            {/* Today line */}
            <div className="absolute top-0 bottom-0" style={{ left: `${todayPos * 100}%`, zIndex: 10 }}>
              <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "#f43f5e", whiteSpace: "nowrap", marginLeft: 4, display: "block", marginTop: 4 }}>오늘</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div>
        {projects.map((project) => {
          const ptasks = tasks.filter((t) => t.projectId === project.id);
          return (
            <div key={project.id}>
              {/* Project row */}
              <div
                className="flex items-center sticky"
                style={{ top: 40, zIndex: 10, background: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-bg-border)", borderLeft: `3px solid ${project.color}`, height: 32 }}
              >
                <div className="shrink-0 flex items-center gap-2 px-3" style={{ width: "min(257px, 40vw)", borderRight: "1px solid var(--color-bg-border)", height: "100%" }}>
                  <span className="text-xs font-bold truncate" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
                    {project.name}
                  </span>
                </div>
                <div className="relative flex-1 h-full flex items-center px-2">
                  <div className="relative w-full" style={{ height: 4 }}>
                    <div style={{
                      position: "absolute",
                      left: `${pct(project.startDate, range) * 100}%`,
                      width: `${(pct(project.endDate, range) - pct(project.startDate, range)) * 100}%`,
                      height: "100%", background: `${project.color}33`,
                      border: `1px solid ${project.color}66`, borderRadius: 2,
                    }} />
                  </div>
                </div>
              </div>

              {/* Task rows */}
              <div className="relative">
                {/* Today vertical line */}
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-10"
                  style={{ left: `calc(min(260px, 40vw) + (100% - min(260px, 40vw)) * ${todayPos})`, width: 1, background: "rgba(244,63,94,0.6)" }}
                />
                {ptasks.map((t, i) => (
                  <GanttRow key={t.id} task={t} members={members} range={range} rowIndex={i} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 flex items-center gap-5 flex-wrap" style={{ borderTop: "1px solid var(--color-bg-border)" }}>
        <span className="text-xs" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>범례:</span>
        {(Object.entries(barColor) as [Status, { bg: string; border: string }][]).map(([s, c]) => (
          <span key={s} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <span className="rounded-sm" style={{ width: 14, height: 8, background: c.bg, border: `1px solid ${c.border}`, display: "inline-block" }} />
            {statusLabel[s]}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span style={{ width: 16, height: 5, background: "rgba(100,100,120,0.3)", border: "1px dashed #64748b", borderRadius: 1, display: "inline-block" }} />
          계획
        </span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span style={{ width: 16, height: 8, background: "rgba(245,158,11,0.6)", border: "1.5px solid #f59e0b", borderRadius: 1, display: "inline-block" }} />
          실제
        </span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "#f43f5e" }}>
          <span style={{ width: 1, height: 10, background: "#f43f5e", display: "inline-block" }} />
          오늘
        </span>
      </div>
    </div>
  );
}
