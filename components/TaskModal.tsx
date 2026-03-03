"use client";
import { useEffect, useState, useCallback } from "react";
import { statusLabel, priorityLabel } from "@/lib/data";
import type { Task } from "@/lib/data";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";

interface TaskWithBody extends Task {
  body?: string;
}

function parseTableRow(line: string): string[] {
  return line.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
}

function isSeparatorRow(line: string): boolean {
  return parseTableRow(line).every(c => /^:?-+:?$/.test(c.trim()));
}

function isTableLine(line: string): boolean {
  return line.trim().startsWith("|") && line.trim().endsWith("|");
}

function renderCellText(text: string): React.ReactNode {
  // Render inline markdown link: [label](url)
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let last = 0, m: RegExpExecArray | null;
  while ((m = linkRe.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <a key={m.index} href={m[2]} target="_blank" rel="noopener noreferrer"
        style={{ color: "var(--color-accent-blue, #6366f1)", textDecoration: "underline", textDecorationColor: "rgba(99,102,241,0.4)" }}>
        {m[1]}
      </a>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? <>{parts}</> : text;
}

function MarkdownBody({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table block: collect consecutive table lines
    if (isTableLine(line)) {
      const tableLines: string[] = [];
      while (i < lines.length && isTableLine(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      // First non-separator row = header, rest = body rows
      const headerLine = tableLines[0];
      const dataLines = tableLines.slice(1).filter(l => !isSeparatorRow(l));
      const headers = parseTableRow(headerLine);
      const rows = dataLines.map(parseTableRow);
      elements.push(
        <div key={`table-${i}`} style={{ overflowX: "auto", marginBottom: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {headers.map((h, ci) => (
                  <th key={ci} style={{
                    padding: "5px 10px", textAlign: "left", fontWeight: 600,
                    color: "var(--color-text-dimmed)", fontSize: 10,
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    borderBottom: "1px solid var(--color-bg-border)",
                    background: "var(--color-bg-elevated)",
                    whiteSpace: "nowrap",
                  }}>{renderCellText(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: "1px solid var(--color-bg-border)" }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      padding: "5px 10px",
                      color: "var(--color-text-secondary)",
                      fontFamily: ci === 0 ? "var(--font-mono)" : undefined,
                      fontSize: 12,
                      verticalAlign: "top",
                    }}>{renderCellText(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

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
    i++;
  }

  return <div>{elements}</div>;
}

export default function TaskModal({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const [task, setTask] = useState<TaskWithBody | null>(null);
  const [editing, setEditing] = useState(false);
  const [bodyDraft, setBodyDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/tasks/${taskId}`)
      .then((r) => r.json())
      .then((t: TaskWithBody) => {
        setTask(t);
        setBodyDraft(t.body ?? "");
      });
  }, [taskId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editing) setEditing(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, editing]);

  const handleSaveBody = useCallback(async () => {
    if (!task) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: bodyDraft }),
      });
      const updated = await res.json();
      setTask({ ...updated, body: bodyDraft });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [task, bodyDraft]);

  const handleComplete = useCallback(async () => {
    if (!task) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      const updated = await res.json();
      setTask((prev) => ({ ...prev, ...updated }));
    } finally {
      setCompleting(false);
    }
  }, [task]);

  const buildMarkdown = useCallback(() => {
    if (!task) return "";
    const lines = [
      `# ${task.title}`,
      ``,
      `| 항목 | 값 |`,
      `|------|-----|`,
      `| ID | ${task.id} |`,
      `| 상태 | ${task.status} |`,
      `| 우선순위 | ${task.priority} |`,
      `| 담당자 | ${task.assigneeId} |`,
      ...(task.projectId ? [`| 프로젝트 | ${task.projectId} |`] : []),
      ...(task.created ? [`| 생성일 | ${new Date(task.created).toLocaleString("ko-KR")} |`] : []),
      ...(task.due ? [`| 마감일 | ${new Date(task.due).toLocaleString("ko-KR")} |`] : []),
      ``,
      ...(task.body ? [task.body] : []),
    ];
    return lines.join("\n");
  }, [task]);

  const handleCopyMarkdown = useCallback(async () => {
    const md = buildMarkdown();
    let success = false;
    // Modern Clipboard API (requires HTTPS or localhost)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(md);
        success = true;
      } catch { /* fall through */ }
    }
    // Legacy fallback — works on plain HTTP
    if (!success) {
      const ta = document.createElement("textarea");
      ta.value = md;
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand("copy"); success = true; } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [buildMarkdown]);

  const handleCopyLink = useCallback(async () => {
    if (!task) return;
    const link = `${window.location.origin}/?task=${task.id}`;
    let success = false;
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(link); success = true; } catch { /* fall through */ }
    }
    if (!success) {
      const ta = document.createElement("textarea");
      ta.value = link;
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      try { document.execCommand("copy"); success = true; } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
    if (success) { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }
  }, [task]);

  const handleShare = useCallback(async () => {
    if (!task) return;
    setShareLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/share`, { method: "POST" });
      const { token } = await res.json();
      const url = `${window.location.origin}/share/${token}`;
      setShareUrl(url);
      // Copy to clipboard
      let success = false;
      if (navigator.clipboard && window.isSecureContext) {
        try { await navigator.clipboard.writeText(url); success = true; } catch { /* fall through */ }
      }
      if (!success) {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
        document.body.appendChild(ta); ta.focus(); ta.select();
        try { document.execCommand("copy"); success = true; } catch { /* ignore */ }
        document.body.removeChild(ta);
      }
      if (success) { setShareCopied(true); setTimeout(() => setShareCopied(false), 3000); }
    } finally {
      setShareLoading(false);
    }
  }, [task]);

  const handleDownloadMarkdown = useCallback(() => {
    const md = buildMarkdown();
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${task?.id ?? "task"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [buildMarkdown, task]);

  const isDone = task?.status === "done";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-xl overflow-hidden flex flex-col"
        style={{ width: "min(560px, calc(100vw - 24px))", maxHeight: "85vh", background: "var(--color-bg-card)", border: "1px solid var(--color-bg-border)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
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
            <div className="px-4 sm:px-5 py-3 grid gap-2" style={{ borderBottom: "1px solid var(--color-bg-border)", gridTemplateColumns: "1fr 1fr" }}>
              {[
                { label: "담당자", value: task.assigneeId },
                { label: "프로젝트", value: task.projectId },
                { label: "생성일", value: task.created ? new Date(task.created).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—" },
                { label: "마감일", value: task.due ? new Date(task.due).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span style={{ fontSize: 10, color: "var(--color-text-dimmed)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                  <p style={{ fontSize: 12, color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)", marginTop: 1 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="px-5 py-4 overflow-auto flex-1">
              {editing ? (
                <textarea
                  autoFocus
                  value={bodyDraft}
                  onChange={(e) => setBodyDraft(e.target.value)}
                  placeholder="작업 내용을 작성하세요..."
                  style={{
                    width: "100%",
                    minHeight: 160,
                    background: "var(--color-bg-hover, rgba(255,255,255,0.04))",
                    border: "1px solid var(--color-bg-border)",
                    borderRadius: 6,
                    padding: "10px 12px",
                    fontSize: 13,
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.6,
                    resize: "vertical",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              ) : task.body ? (
                <MarkdownBody content={task.body} />
              ) : (
                <p style={{ fontSize: 13, color: "var(--color-text-dimmed)" }}>내용 없음</p>
              )}
            </div>

            {/* Share bar */}
            {shareUrl && (
              <div className="px-5 py-2 flex items-center gap-2" style={{ borderTop: "1px solid var(--color-bg-border)", background: "rgba(99,102,241,0.06)" }}>
                <span style={{ fontSize: 11, color: "#6366f1", flexShrink: 0 }}>🔗</span>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--color-text-dimmed)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareUrl}</span>
                <button
                  onClick={handleShare}
                  style={{ fontSize: 11, color: shareCopied ? "#6366f1" : "var(--color-text-dimmed)", flexShrink: 0, padding: "3px 8px", borderRadius: 4, border: "1px solid var(--color-bg-border)", background: "transparent", cursor: "pointer" }}
                >
                  {shareCopied ? "✓ 복사됨" : "복사"}
                </button>
              </div>
            )}

            {/* Footer actions */}
            <div
              className="px-3 sm:px-5 py-3"
              style={{ borderTop: "1px solid var(--color-bg-border)" }}
            >
              {editing ? (
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => { setEditing(false); setBodyDraft(task.body ?? ""); }}
                    style={{ fontSize: 12, color: "var(--color-text-dimmed)", padding: "5px 12px", borderRadius: 6, border: "1px solid var(--color-bg-border)" }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveBody}
                    disabled={saving}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#fff",
                      background: "var(--color-accent, #5b6cf8)",
                      padding: "5px 16px",
                      borderRadius: 6,
                      border: "none",
                      opacity: saving ? 0.6 : 1,
                      cursor: saving ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving ? "저장 중..." : "저장"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setEditing(true)}
                      style={{ fontSize: 12, color: "var(--color-text-secondary)", padding: "5px 12px", borderRadius: 6, border: "1px solid var(--color-bg-border)", cursor: "pointer" }}
                    >
                      내용 편집
                    </button>
                    <button
                      onClick={handleCopyLink}
                      title="태스크 링크 복사"
                      style={{
                        fontSize: 11,
                        color: linkCopied ? "var(--color-accent-blue, #6366f1)" : "var(--color-text-secondary)",
                        padding: "5px 10px", borderRadius: 6,
                        border: linkCopied ? "1px solid var(--color-accent-blue, #6366f1)" : "1px solid var(--color-bg-border)",
                        background: linkCopied ? "rgba(99,102,241,0.08)" : "var(--color-bg-elevated)",
                        display: "flex", alignItems: "center", gap: 4,
                        cursor: "pointer",
                      }}
                    >
                      {linkCopied ? "✓ 복사됨" : "링크"}
                    </button>
                    <button
                      onClick={handleCopyMarkdown}
                      title="마크다운 복사"
                      style={{
                        fontSize: 11,
                        color: copied ? "var(--color-live)" : "var(--color-text-secondary)",
                        padding: "5px 10px", borderRadius: 6,
                        border: copied ? "1px solid var(--color-live)" : "1px solid var(--color-bg-border)",
                        background: copied ? "rgba(34,197,94,0.08)" : "var(--color-bg-elevated)",
                        display: "flex", alignItems: "center", gap: 4,
                        cursor: "pointer",
                      }}
                    >
                      {copied ? "✓ 복사됨" : "복사"}
                    </button>
                    <button
                      onClick={handleDownloadMarkdown}
                      title=".md 다운로드"
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-secondary)",
                        padding: "5px 10px", borderRadius: 6,
                        border: "1px solid var(--color-bg-border)",
                        background: "var(--color-bg-elevated)",
                        display: "flex", alignItems: "center", gap: 4,
                        cursor: "pointer",
                      }}
                    >
                      다운로드
                    </button>
                    <button
                      onClick={handleShare}
                      disabled={shareLoading}
                      title="공개 공유 링크 생성"
                      style={{
                        fontSize: 11,
                        color: shareCopied ? "#6366f1" : "var(--color-text-secondary)",
                        padding: "5px 10px", borderRadius: 6,
                        border: shareCopied ? "1px solid #6366f1" : "1px solid var(--color-bg-border)",
                        background: shareCopied ? "rgba(99,102,241,0.08)" : "var(--color-bg-elevated)",
                        cursor: shareLoading ? "wait" : "pointer",
                        opacity: shareLoading ? 0.6 : 1,
                        display: "flex", alignItems: "center", gap: 4,
                      }}
                    >
                      {shareLoading ? "생성 중..." : shareCopied ? "✓ 공유됨" : "공유"}
                    </button>
                  </div>
                  <button
                    onClick={handleComplete}
                    disabled={isDone || completing}
                    className="sm:ml-auto shrink-0"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: isDone ? "var(--color-text-dimmed)" : "#fff",
                      background: isDone ? "transparent" : "var(--color-live, #22c55e)",
                      padding: "5px 16px",
                      borderRadius: 6,
                      border: isDone ? "1px solid var(--color-bg-border)" : "none",
                      opacity: completing ? 0.6 : 1,
                      cursor: isDone || completing ? "not-allowed" : "pointer",
                    }}
                  >
                    {isDone ? "완료됨" : completing ? "처리 중..." : "태스크 완료"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
