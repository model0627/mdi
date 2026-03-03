import type { Metadata } from "next";
import type { Task } from "@/lib/data";

interface SharedTask extends Task {
  body?: string;
  sharedAt?: string;
}

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/share/${token}`, { cache: "no-store" });
    if (res.ok) {
      const task: SharedTask = await res.json();
      return { title: `${task.title} — MDI Dashboard` };
    }
  } catch { /* ignore */ }
  return { title: "공유된 태스크 — MDI Dashboard" };
}

const STATUS_LABELS: Record<string, string> = {
  progress: "진행 중",
  review: "리뷰 중",
  done: "완료",
  backlog: "백로그",
  cancelled: "취소",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "높음",
  medium: "중간",
  low: "낮음",
};

const STATUS_COLORS: Record<string, string> = {
  progress: "#f59e0b",
  review: "#a78bfa",
  done: "#34d399",
  backlog: "#6b7280",
  cancelled: "#ef4444",
};

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function MarkdownBody({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} style={{ color: "#94a3b8", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 20, marginBottom: 8 }}>
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("| ") && line.endsWith(" |")) {
          // simple table row — render as is
          const cells = line.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
          const isSep = cells.every(c => /^-+$/.test(c));
          if (isSep) return null;
          return (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              {cells.map((c, ci) => (
                <span key={ci} style={{ fontSize: 13, color: ci === 0 ? "#94a3b8" : "#cbd5e1", minWidth: ci === 0 ? 80 : undefined }}>{c}</span>
              ))}
            </div>
          );
        }
        if (line.startsWith("- [ ] ")) {
          return (
            <div key={i} className="flex items-start gap-2" style={{ marginBottom: 4 }}>
              <span style={{ width: 14, height: 14, border: "1.5px solid #334155", borderRadius: 3, display: "inline-block", flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 13, color: "#94a3b8" }}>{line.slice(6)}</span>
            </div>
          );
        }
        if (line.startsWith("- [x] ") || line.startsWith("- [X] ")) {
          return (
            <div key={i} className="flex items-start gap-2" style={{ marginBottom: 4 }}>
              <span style={{ width: 14, height: 14, background: "#34d399", borderRadius: 3, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <span style={{ fontSize: 13, color: "#475569", textDecoration: "line-through" }}>{line.slice(6)}</span>
            </div>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <div key={i} style={{ marginBottom: 4, paddingLeft: 12, borderLeft: "2px solid #1e293b" }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>{line.slice(2)}</span>
            </div>
          );
        }
        if (line.trim()) {
          return <p key={i} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, lineHeight: 1.7 }}>{line}</p>;
        }
        return <div key={i} style={{ height: 6 }} />;
      })}
    </div>
  );
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  let task: SharedTask | null = null;
  let error: string | null = null;

  try {
    const res = await fetch(`${base}/api/share/${token}`, { cache: "no-store" });
    if (res.ok) {
      task = await res.json();
    } else {
      error = "공유된 태스크를 찾을 수 없습니다.";
    }
  } catch {
    error = "데이터를 불러오는 중 오류가 발생했습니다.";
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #1e293b", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#0f172a"/>
            <rect x="5" y="10" width="6" height="16" rx="2" fill="#6366f1"/>
            <rect x="13" y="15" width="6" height="11" rx="2" fill="#818cf8"/>
            <rect x="21" y="19" width="6" height="7" rx="2" fill="#a5b4fc"/>
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.02em" }}>MDI Dashboard</span>
        </div>
        <span style={{ fontSize: 11, color: "#475569" }}>공유된 태스크</span>
      </header>

      {/* Content */}
      <main style={{ flex: 1, display: "flex", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 640 }}>
          {error ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>🔒</p>
              <p style={{ fontSize: 16, color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>{error}</p>
              <p style={{ fontSize: 13, color: "#475569" }}>링크가 만료되었거나 존재하지 않는 공유입니다.</p>
            </div>
          ) : task ? (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
              {/* Task Header */}
              <div style={{ padding: "24px 28px", borderBottom: "1px solid #1e293b" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "#475569", background: "#1e293b", padding: "2px 8px", borderRadius: 4 }}>
                    {task.id}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                    background: `${STATUS_COLORS[task.status] ?? "#6b7280"}22`,
                    color: STATUS_COLORS[task.status] ?? "#6b7280",
                    border: `1px solid ${STATUS_COLORS[task.status] ?? "#6b7280"}44`,
                  }}>
                    {STATUS_LABELS[task.status] ?? task.status}
                  </span>
                  <span style={{ fontSize: 11, color: "#475569", padding: "2px 8px", borderRadius: 4, background: "#1e293b" }}>
                    {PRIORITY_LABELS[task.priority] ?? task.priority}
                  </span>
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3, marginBottom: 0 }}>
                  {task.title}
                </h1>
              </div>

              {/* Meta grid */}
              <div style={{ padding: "16px 28px", borderBottom: "1px solid #1e293b", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "담당자", value: task.assigneeId || "—" },
                  { label: "프로젝트", value: task.projectId || "—" },
                  { label: "생성일", value: fmtDate(task.created) },
                  { label: "마감일", value: fmtDate(task.due) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 12, color: "#94a3b8", fontFamily: "monospace" }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Body */}
              <div style={{ padding: "20px 28px", minHeight: 80 }}>
                {task.body ? (
                  <MarkdownBody content={task.body} />
                ) : (
                  <p style={{ fontSize: 13, color: "#334155" }}>내용 없음</p>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: "14px 28px", borderTop: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "#334155" }}>
                  {task.sharedAt ? `공유됨 · ${fmtDate(task.sharedAt)}` : "MDI Dashboard"}
                </span>
                <span style={{ fontSize: 11, color: "#334155" }}>읽기 전용</span>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
