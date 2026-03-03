"use client";
import { useState, useEffect, useCallback } from "react";

type FileKey = "global-claude" | "project-claude" | "memory";

interface FileInfo {
  content: string;
  path: string;
  size: number;
  lastModified: string;
}

const FILES: { key: FileKey; label: string; desc: string }[] = [
  { key: "global-claude", label: "전역 CLAUDE.md", desc: "~/.claude/CLAUDE.md" },
  { key: "project-claude", label: "프로젝트 CLAUDE.md", desc: "mdi-dashboard/CLAUDE.md" },
  { key: "memory", label: "MEMORY.md", desc: "~/.claude/projects/.../memory/MEMORY.md" },
];

export default function ConfigView() {
  const [activeKey, setActiveKey] = useState<FileKey>("global-claude");
  const [files, setFiles] = useState<Record<FileKey, FileInfo | null>>({
    "global-claude": null,
    "project-claude": null,
    "memory": null,
  });
  const [drafts, setDrafts] = useState<Record<FileKey, string>>({
    "global-claude": "",
    "project-claude": "",
    "memory": "",
  });
  const [loading, setLoading] = useState<FileKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [localOnly, setLocalOnly] = useState(false);

  const loadFile = useCallback(async (key: FileKey) => {
    setLoading(key);
    setError(null);
    try {
      const res = await fetch(`/api/config/files/${key}`);
      if (res.status === 503) {
        setLocalOnly(true);
        return;
      }
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "불러오기 실패");
        return;
      }
      const data: FileInfo = await res.json();
      setFiles((prev) => ({ ...prev, [key]: data }));
      setDrafts((prev) => ({ ...prev, [key]: data.content }));
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(null);
    }
  }, []);

  useEffect(() => {
    loadFile(activeKey);
  }, [activeKey, loadFile]);

  const isDirty = files[activeKey]?.content !== drafts[activeKey];

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/config/files/${activeKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: drafts[activeKey] }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "저장 실패");
        return;
      }
      // Refresh
      setFiles((prev) => ({
        ...prev,
        [activeKey]: prev[activeKey]
          ? { ...prev[activeKey]!, content: drafts[activeKey], lastModified: new Date().toISOString() }
          : null,
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("네트워크 오류");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (files[activeKey]) {
      setDrafts((prev) => ({ ...prev, [activeKey]: files[activeKey]!.content }));
    }
    setError(null);
  };

  const fileInfo = files[activeKey];
  const currentDraft = drafts[activeKey];

  if (localOnly) {
    return (
      <div className="flex flex-1 items-center justify-center" style={{ color: "var(--color-text-muted)" }}>
        <div className="text-center">
          <div className="text-2xl mb-3">🔒</div>
          <div className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
            로컬 전용 기능
          </div>
          <div className="text-xs mt-1">Vercel 환경에서는 파일 편집이 지원되지 않습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "var(--color-bg-base)" }}>
      {/* File Tabs */}
      <div
        className="flex items-center gap-1 px-3 sm:px-5 py-2 border-b overflow-x-auto scrollbar-hide"
        style={{ borderColor: "var(--color-bg-border)", background: "var(--color-bg-surface)" }}
      >
        {FILES.map((f) => (
          <button
            key={f.key}
            onClick={() => { setActiveKey(f.key); setError(null); setSaved(false); }}
            className="px-3 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap shrink-0"
            style={{
              background: activeKey === f.key ? "var(--color-bg-elevated)" : "transparent",
              color: activeKey === f.key ? "var(--color-text-primary)" : "var(--color-text-muted)",
              border: activeKey === f.key ? "1px solid var(--color-bg-border)" : "1px solid transparent",
            }}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        {/* File path info — hidden on mobile */}
        {fileInfo && (
          <span className="text-xs hidden sm:inline shrink-0" style={{ color: "var(--color-text-dimmed)", fontFamily: "var(--font-mono, monospace)" }}>
            {fileInfo.path}
          </span>
        )}
      </div>

      {/* Editor Area */}
      <div className="flex flex-col flex-1 overflow-hidden px-3 sm:px-5 py-4 gap-3">
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 text-xs" style={{ color: "var(--color-text-dimmed)" }}>
            {fileInfo ? (
              <>
                <span>{(fileInfo.size / 1024).toFixed(1)} KB</span>
                <span className="mx-2" style={{ color: "var(--color-bg-border)" }}>·</span>
                <span>수정: {new Date(fileInfo.lastModified).toLocaleString("ko-KR")}</span>
              </>
            ) : loading === activeKey ? (
              <span>불러오는 중...</span>
            ) : null}
          </div>
          {error && (
            <span className="text-xs px-2 py-1 rounded" style={{ background: "#3f1a1a", color: "#f87171" }}>
              {error}
            </span>
          )}
          {saved && (
            <span className="text-xs px-2 py-1 rounded" style={{ background: "#0f2f1a", color: "#4ade80" }}>
              저장됨 ✓
            </span>
          )}
          <button
            onClick={handleReset}
            disabled={!isDirty || saving}
            className="text-xs px-3 py-1.5 rounded transition-all"
            style={{
              background: "var(--color-bg-elevated)",
              color: isDirty ? "var(--color-text-secondary)" : "var(--color-text-dimmed)",
              border: "1px solid var(--color-bg-border)",
              cursor: isDirty ? "pointer" : "not-allowed",
              opacity: isDirty ? 1 : 0.5,
            }}
          >
            되돌리기
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || saving || !fileInfo}
            className="text-xs px-3 py-1.5 rounded font-semibold transition-all"
            style={{
              background: isDirty && fileInfo ? "var(--color-accent-blue)" : "var(--color-bg-elevated)",
              color: isDirty && fileInfo ? "#fff" : "var(--color-text-dimmed)",
              border: "1px solid transparent",
              cursor: isDirty && fileInfo ? "pointer" : "not-allowed",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>

        {/* Textarea */}
        <textarea
          value={currentDraft}
          onChange={(e) => setDrafts((prev) => ({ ...prev, [activeKey]: e.target.value }))}
          disabled={loading === activeKey || !fileInfo}
          spellCheck={false}
          className="flex-1 w-full resize-none rounded p-4 text-sm outline-none"
          style={{
            background: "var(--color-bg-surface)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-bg-border)",
            fontFamily: "var(--font-mono, 'Fira Code', 'Cascadia Code', monospace)",
            fontSize: 13,
            lineHeight: 1.6,
            caretColor: "var(--color-accent-blue)",
          }}
          placeholder={loading === activeKey ? "불러오는 중..." : "파일이 없거나 불러올 수 없습니다."}
        />
      </div>
    </div>
  );
}
