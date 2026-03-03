"use client";
import { useState, useEffect, useCallback } from "react";

type FileKey = "global-claude" | "project-claude" | "memory";
type TabKey = FileKey | "mdi-config";

interface FileInfo {
  content: string;
  path: string;
  size: number;
  lastModified: string;
}

interface MdiConfigInfo {
  version: number;
  updatedAt: string;
  claudeBlock: string;
  path: string;
  size: number;
  lastModified: string;
}

const FILE_TABS: { key: FileKey; label: string }[] = [
  { key: "global-claude", label: "전역 CLAUDE.md" },
  { key: "project-claude", label: "프로젝트 CLAUDE.md" },
  { key: "memory", label: "MEMORY.md" },
];

export default function ConfigView() {
  const [activeTab, setActiveTab] = useState<TabKey>("mdi-config");
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
  const [fileLoading, setFileLoading] = useState<FileKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [localOnly, setLocalOnly] = useState(false);

  // MDI Config state
  const [mdiConfig, setMdiConfig] = useState<MdiConfigInfo | null>(null);
  const [mdiLoading, setMdiLoading] = useState(false);
  const [mdiError, setMdiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadFile = useCallback(async (key: FileKey) => {
    setFileLoading(key);
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
      setFileLoading(null);
    }
  }, []);

  const loadMdiConfig = useCallback(async () => {
    setMdiLoading(true);
    setMdiError(null);
    try {
      const res = await fetch("/api/config/mdi");
      if (!res.ok) {
        const body = await res.json();
        setMdiError(body.error ?? "불러오기 실패");
        return;
      }
      const data: MdiConfigInfo = await res.json();
      setMdiConfig(data);
    } catch {
      setMdiError("네트워크 오류");
    } finally {
      setMdiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "mdi-config") {
      loadMdiConfig();
    } else {
      loadFile(activeTab as FileKey);
    }
  }, [activeTab, loadFile, loadMdiConfig]);

  const isDirty = activeTab !== "mdi-config" && files[activeTab as FileKey]?.content !== drafts[activeTab as FileKey];

  const handleSave = async () => {
    if (activeTab === "mdi-config") return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/config/files/${activeTab}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: drafts[activeTab as FileKey] }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "저장 실패");
        return;
      }
      setFiles((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab as FileKey]
          ? { ...prev[activeTab as FileKey]!, content: drafts[activeTab as FileKey], lastModified: new Date().toISOString() }
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
    if (activeTab !== "mdi-config" && files[activeTab as FileKey]) {
      setDrafts((prev) => ({ ...prev, [activeTab]: files[activeTab as FileKey]!.content }));
    }
    setError(null);
  };

  const handleCopy = async () => {
    if (!mdiConfig?.claudeBlock) return;
    await navigator.clipboard.writeText(mdiConfig.claudeBlock);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const switchTab = (key: TabKey) => {
    setActiveTab(key);
    setError(null);
    setSaved(false);
    setLocalOnly(false);
  };

  // MDI Config tab content
  if (activeTab === "mdi-config") {
    return (
      <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "var(--color-bg-base)" }}>
        {/* Tabs */}
        <div
          className="flex items-center gap-1 px-5 py-2 border-b"
          style={{ borderColor: "var(--color-bg-border)", background: "var(--color-bg-surface)" }}
        >
          <button
            onClick={() => switchTab("mdi-config")}
            className="px-3 py-1.5 rounded text-xs font-medium transition-all"
            style={{
              background: "var(--color-bg-elevated)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-bg-border)",
            }}
          >
            MDI Config
          </button>
          {FILE_TABS.map((f) => (
            <button
              key={f.key}
              onClick={() => switchTab(f.key)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-all"
              style={{
                background: "transparent",
                color: "var(--color-text-muted)",
                border: "1px solid transparent",
              }}
            >
              {f.label}
            </button>
          ))}
          <div className="flex-1" />
          {mdiConfig && (
            <span className="text-xs" style={{ color: "var(--color-text-dimmed)", fontFamily: "var(--font-mono, monospace)" }}>
              v{mdiConfig.version} · {new Date(mdiConfig.updatedAt).toLocaleDateString("ko-KR")}
            </span>
          )}
        </div>

        {/* MDI Config Content */}
        <div className="flex flex-col flex-1 overflow-hidden px-5 py-4 gap-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 text-xs" style={{ color: "var(--color-text-dimmed)" }}>
              {mdiConfig ? (
                <>
                  <span>{(mdiConfig.size / 1024).toFixed(1)} KB</span>
                  <span className="mx-2" style={{ color: "var(--color-bg-border)" }}>·</span>
                  <span>수정: {new Date(mdiConfig.lastModified).toLocaleString("ko-KR")}</span>
                </>
              ) : mdiLoading ? (
                <span>불러오는 중...</span>
              ) : null}
            </div>
            {mdiError && (
              <span className="text-xs px-2 py-1 rounded" style={{ background: "#3f1a1a", color: "#f87171" }}>
                {mdiError}
              </span>
            )}
            {copied && (
              <span className="text-xs px-2 py-1 rounded" style={{ background: "#0f2f1a", color: "#4ade80" }}>
                복사됨 ✓
              </span>
            )}
            <button
              onClick={handleCopy}
              disabled={!mdiConfig?.claudeBlock}
              className="text-xs px-3 py-1.5 rounded font-semibold transition-all"
              style={{
                background: mdiConfig?.claudeBlock ? "var(--color-accent-blue)" : "var(--color-bg-elevated)",
                color: mdiConfig?.claudeBlock ? "#fff" : "var(--color-text-dimmed)",
                border: "1px solid transparent",
                cursor: mdiConfig?.claudeBlock ? "pointer" : "not-allowed",
              }}
            >
              클립보드 복사
            </button>
          </div>

          {/* Read-only viewer */}
          <textarea
            value={mdiConfig?.claudeBlock ?? ""}
            readOnly
            spellCheck={false}
            className="flex-1 w-full resize-none rounded p-4 text-sm outline-none"
            style={{
              background: "var(--color-bg-surface)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-bg-border)",
              fontFamily: "var(--font-mono, 'Fira Code', 'Cascadia Code', monospace)",
              fontSize: 13,
              lineHeight: 1.6,
              cursor: "text",
            }}
            placeholder={mdiLoading ? "불러오는 중..." : "설정 파일을 불러올 수 없습니다."}
          />
        </div>
      </div>
    );
  }

  // File editor tabs (local only)
  const fileKey = activeTab as FileKey;
  const fileInfo = files[fileKey];
  const currentDraft = drafts[fileKey];

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "var(--color-bg-base)" }}>
      {/* Tabs */}
      <div
        className="flex items-center gap-1 px-5 py-2 border-b"
        style={{ borderColor: "var(--color-bg-border)", background: "var(--color-bg-surface)" }}
      >
        <button
          onClick={() => switchTab("mdi-config")}
          className="px-3 py-1.5 rounded text-xs font-medium transition-all"
          style={{
            background: "transparent",
            color: "var(--color-text-muted)",
            border: "1px solid transparent",
          }}
        >
          MDI Config
        </button>
        {FILE_TABS.map((f) => (
          <button
            key={f.key}
            onClick={() => switchTab(f.key)}
            className="px-3 py-1.5 rounded text-xs font-medium transition-all"
            style={{
              background: activeTab === f.key ? "var(--color-bg-elevated)" : "transparent",
              color: activeTab === f.key ? "var(--color-text-primary)" : "var(--color-text-muted)",
              border: activeTab === f.key ? "1px solid var(--color-bg-border)" : "1px solid transparent",
            }}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        {fileInfo && !localOnly && (
          <span className="text-xs" style={{ color: "var(--color-text-dimmed)", fontFamily: "var(--font-mono, monospace)" }}>
            {fileInfo.path}
          </span>
        )}
      </div>

      {/* Local only notice */}
      {localOnly ? (
        <div className="flex flex-col flex-1 items-center justify-center gap-3" style={{ color: "var(--color-text-muted)" }}>
          <div className="text-center">
            <div className="text-2xl mb-3">🔒</div>
            <div className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
              로컬 전용 기능
            </div>
            <div className="text-xs mt-1">Vercel 환경에서는 파일 편집이 지원되지 않습니다.</div>
          </div>
          <button
            onClick={() => switchTab("mdi-config")}
            className="text-xs px-3 py-1.5 rounded font-medium"
            style={{
              background: "var(--color-accent-blue)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            MDI Config 보기
          </button>
        </div>
      ) : (
        /* Editor Area */
        <div className="flex flex-col flex-1 overflow-hidden px-5 py-4 gap-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 text-xs" style={{ color: "var(--color-text-dimmed)" }}>
              {fileInfo ? (
                <>
                  <span>{(fileInfo.size / 1024).toFixed(1)} KB</span>
                  <span className="mx-2" style={{ color: "var(--color-bg-border)" }}>·</span>
                  <span>수정: {new Date(fileInfo.lastModified).toLocaleString("ko-KR")}</span>
                </>
              ) : fileLoading === fileKey ? (
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
            onChange={(e) => setDrafts((prev) => ({ ...prev, [fileKey]: e.target.value }))}
            disabled={fileLoading === fileKey || !fileInfo}
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
            placeholder={fileLoading === fileKey ? "불러오는 중..." : "파일이 없거나 불러올 수 없습니다."}
          />
        </div>
      )}
    </div>
  );
}
