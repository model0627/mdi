"use client";
import { useEffect, useState } from "react";
import { statusLabel, priorityLabel } from "@/lib/data";
import type { Task } from "@/lib/data";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";

interface TaskWithBody extends Task {
  body?: string;
}

function MarkdownBody({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={i} style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 16, marginBottom: 6 }}>
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith("- [ ] ")) {
      elements.push(
        <div key={i} className="flex items-start gap-2" style={{ marginBottom: 4 }}>
          <span style={{ width: 14, height: 14, border: "1.5px solid var(--color-bg-border)", borderRadius: 3, display: "inline-block", flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{line.slice(6)}</span>
        </div>
      );
    } else if (line.startsWith("- [x] ") || line.startsWith("- [X] ")) {
      elements.push(
        <div key={i} className="flex items-start gap-2" style={{ marginBottom: 4 }}>
          <span style={{ width: 14, height: 14, background: "var(--color-live)", borderRadius: 3, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <span style={{ fontSize: 13, color: "var(--color-text-dimmed)", textDecoration: "line-through" }}>{line.slice(6)}</span>
        </div>
      );
    } else if (line.trim()) {
      elements.push(
        <p key={i} style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 4, lineHeight: 1.6 }}>
          {line}
        </p>
      );
    }
  });

  return <div>{elements}</div>;
}

export default function TaskModal({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const [task, setTask] = useState<TaskWithBody | null>(null);

  useEffect(() => {
    fetch(`/api/tasks/${taskId}`)
      .then((r) => r.json())
      .then(setTask);
  }, [taskId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-xl overflow-hidden flex flex-col"
        style={{ width: 560, maxHeight: "80vh", background: "var(--color-bg-card)", border: "1px solid var(--color-bg-border)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
      >
        {!task ? (
          <div className="flex items-center justify-center" style={{ height: 200, color: "var(--color-text-dimmed)" }}>
            불러오는 중...
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--color-bg-border)" }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-dimmed)" }}>{task.id}</span>
                <button onClick={onClose} style={{ color: "var(--color-text-dimmed)", lineHeight: 1 }}>✕</button>
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "var(--font-display)", lineHeight: 1.3, marginBottom: 10 }}>
                {task.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
            </div>

            {/* Meta */}
            <div className="px-5 py-3 grid gap-2" style={{ borderBottom: "1px solid var(--color-bg-border)", gridTemplateColumns: "1fr 1fr" }}>
              {[
                { label: "담당자", value: task.assigneeId },
                { label: "프로젝트", value: task.projectId },
                { label: "생성일", value: task.created?.slice(0, 10) ?? "—" },
                { label: "마감일", value: task.due?.slice(0, 10) ?? "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span style={{ fontSize: 10, color: "var(--color-text-dimmed)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                  <p style={{ fontSize: 12, color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)", marginTop: 1 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="px-5 py-4 overflow-auto flex-1">
              {task.body ? (
                <MarkdownBody content={task.body} />
              ) : (
                <p style={{ fontSize: 13, color: "var(--color-text-dimmed)" }}>내용 없음</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
