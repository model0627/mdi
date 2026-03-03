"use client";
import { useState, useEffect, useCallback } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

type FileKey = "global-claude" | "project-claude" | "memory";
type TabKey = "mdi-config" | FileKey;

interface MdiConfigInfo {
  version: number;
  updatedAt: string;
  claudeBlock: string;
  size: number;
  lastModified: string;
}

const FILE_TABS: { key: FileKey; label: string; placeholder: string }[] = [
  { key: "global-claude",  label: "전역 CLAUDE.md",     placeholder: "~/.claude/CLAUDE.md 내용을 붙여넣으세요" },
  { key: "project-claude", label: "프로젝트 CLAUDE.md", placeholder: "mdi-dashboard/CLAUDE.md 내용을 붙여넣으세요" },
  { key: "memory",         label: "MEMORY.md",           placeholder: "~/.claude/projects/.../memory/MEMORY.md 내용을 붙여넣으세요" },
];

const LS_KEY = (key: FileKey) => `mdi-config-editor:${key}`;

function PreviewToggle({ preview, onChange }: { preview: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex rounded overflow-hidden" style={{ border: "1px solid var(--color-bg-border)" }}>
      {(["preview", "raw"] as const).map((mode) => {
        const active = mode === "preview" ? preview : !preview;
        return (
          <button key={mode} onClick={() => onChange(mode === "preview")}
            className="text-xs px-2.5 py-1 transition-all"
            style={{
              background: active ? "var(--color-bg-elevated)" : "transparent",
              color: active ? "var(--color-text-primary)" : "var(--color-text-muted)",
              cursor: "pointer",
            }}
          >
            {mode === "preview" ? "미리보기" : "원문"}
          </button>
        );
      })}
    </div>
  );
}

// Try server first, fall back to localStorage
async function loadContent(key: FileKey): Promise<{ content: string; source: "server" | "local" }> {
  try {
    const res = await fetch(`/api/config/editor/${key}`);
    if (res.ok) {
      const { content } = await res.json() as { content: string };
      // Sync to localStorage as backup
      if (content) localStorage.setItem(LS_KEY(key), content);
      return { content, source: "server" };
    }
  } catch { /* fallthrough */ }
  return { content: localStorage.getItem(LS_KEY(key)) ?? "", source: "local" };
}

async function saveContent(key: FileKey, content: string): Promise<"server" | "local"> {
  try {
    const res = await fetch(`/api/config/editor/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      localStorage.setItem(LS_KEY(key), content); // keep local in sync
      return "server";
    }
  } catch { /* fallthrough */ }
  localStorage.setItem(LS_KEY(key), content);
  return "local";
}

export default function ConfigView() {
  const [activeTab, setActiveTab] = useState<TabKey>("mdi-config");
  const [previewMode, setPreviewMode] = useState(true); // default: preview

  // MDI Config
  const [mdiConfig, setMdiConfig] = useState<MdiConfigInfo | null>(null);
  const [mdiLoading, setMdiLoading] = useState(false);
  const [mdiError, setMdiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Editor state
  const [contents, setContents] = useState<Record<FileKey, string>>({ "global-claude": "", "project-claude": "", "memory": "" });
  const [sources, setSources] = useState<Record<FileKey, "server" | "local" | null>>({ "global-claude": null, "project-claude": null, "memory": null });
  const [loading, setLoading] = useState<FileKey | null>(null);
  const [savedTab, setSavedTab] = useState<{ key: FileKey; source: "server" | "local" } | null>(null);

  // Load MDI config
  useEffect(() => {
    if (activeTab !== "mdi-config") return;
    setMdiLoading(true);
    setMdiError(null);
    fetch("/api/config/mdi")
      .then((r) => r.json())
      .then((data: MdiConfigInfo) => setMdiConfig(data))
      .catch(() => setMdiError("불러오기 실패"))
      .finally(() => setMdiLoading(false));
  }, [activeTab]);

  // Load editor content when tab switches
  const loadTab = useCallback(async (key: FileKey) => {
    if (sources[key] !== null) return; // already loaded
    setLoading(key);
    const { content, source } = await loadContent(key);
    setContents((prev) => ({ ...prev, [key]: content }));
    setSources((prev) => ({ ...prev, [key]: source }));
    setLoading(null);
  }, [sources]);

  useEffect(() => {
    if (activeTab !== "mdi-config") loadTab(activeTab as FileKey);
  }, [activeTab, loadTab]);

  const handleSave = async (key: FileKey) => {
    const source = await saveContent(key, contents[key]);
    setSources((prev) => ({ ...prev, [key]: source }));
    setSavedTab({ key, source });
    setTimeout(() => setSavedTab(null), 2500);
  };

  const handleClear = (key: FileKey) => {
    localStorage.removeItem(LS_KEY(key));
    setContents((prev) => ({ ...prev, [key]: "" }));
    setSources((prev) => ({ ...prev, [key]: null }));
  };

  const handleCopy = async () => {
    if (!mdiConfig?.claudeBlock) return;
    await navigator.clipboard.writeText(mdiConfig.claudeBlock);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TabBar = () => (
    <div
      className="flex items-center gap-1 px-5 py-2 border-b"
      style={{ borderColor: "var(--color-bg-border)", background: "var(--color-bg-surface)" }}
    >
      <button
        onClick={() => setActiveTab("mdi-config")}
        className="px-3 py-1.5 rounded text-xs font-medium transition-all"
        style={{
          background: activeTab === "mdi-config" ? "var(--color-bg-elevated)" : "transparent",
          color: activeTab === "mdi-config" ? "var(--color-text-primary)" : "var(--color-text-muted)",
          border: activeTab === "mdi-config" ? "1px solid var(--color-bg-border)" : "1px solid transparent",
        }}
      >
        MDI Config
      </button>
      {FILE_TABS.map((f) => (
        <button
          key={f.key}
          onClick={() => setActiveTab(f.key)}
          className="px-3 py-1.5 rounded text-xs font-medium transition-all"
          style={{
            background: activeTab === f.key ? "var(--color-bg-elevated)" : "transparent",
            color: activeTab === f.key ? "var(--color-text-primary)" : "var(--color-text-muted)",
            border: activeTab === f.key ? "1px solid var(--color-bg-border)" : "1px solid transparent",
          }}
        >
          {f.label}
          {contents[f.key] && activeTab !== f.key && (
            <span
              className="inline-block w-1.5 h-1.5 rounded-full ml-1.5 mb-0.5"
              style={{ background: "var(--color-accent-blue)", verticalAlign: "middle" }}
            />
          )}
        </button>
      ))}
      <div className="flex-1" />
      {activeTab === "mdi-config" && mdiConfig && (
        <span className="text-xs" style={{ color: "var(--color-text-dimmed)" }}>
          v{mdiConfig.version} · {(mdiConfig.size / 1024).toFixed(1)} KB
        </span>
      )}
    </div>
  );

  // MDI Config tab
  if (activeTab === "mdi-config") {
    return (
      <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "var(--color-bg-base)" }}>
        <TabBar />
        <div className="flex flex-col flex-1 overflow-hidden px-5 py-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 text-xs" style={{ color: "var(--color-text-dimmed)" }}>
              {mdiConfig ? `수정: ${new Date(mdiConfig.lastModified).toLocaleString("ko-KR")}` : mdiLoading ? "불러오는 중..." : null}
            </div>
            {mdiError && (
              <span className="text-xs px-2 py-1 rounded" style={{ background: "#3f1a1a", color: "#f87171" }}>{mdiError}</span>
            )}
            <PreviewToggle preview={previewMode} onChange={setPreviewMode} />
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
              {copied ? "복사됨 ✓" : "클립보드 복사"}
            </button>
          </div>
          {previewMode ? (
            <div className="flex-1 overflow-y-auto rounded p-4" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)" }}>
              {mdiConfig?.claudeBlock
                ? <MarkdownRenderer content={mdiConfig.claudeBlock} />
                : <span style={{ fontSize: 13, color: "var(--color-text-dimmed)" }}>{mdiLoading ? "불러오는 중..." : "내용이 없습니다."}</span>
              }
            </div>
          ) : (
            <textarea
              value={mdiConfig?.claudeBlock ?? ""}
              readOnly
              spellCheck={false}
              className="flex-1 w-full resize-none rounded p-4 outline-none"
              style={{
                background: "var(--color-bg-surface)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-bg-border)",
                fontFamily: "var(--font-mono, 'Fira Code', 'Cascadia Code', monospace)",
                fontSize: 13,
                lineHeight: 1.6,
              }}
              placeholder={mdiLoading ? "불러오는 중..." : "설정 파일을 불러올 수 없습니다."}
            />
          )}
        </div>
      </div>
    );
  }

  // File editor tab
  const fileTab = FILE_TABS.find((f) => f.key === activeTab)!;
  const fileKey = activeTab as FileKey;
  const isLoading = loading === fileKey;
  const source = sources[fileKey];
  const isSaved = savedTab?.key === fileKey;

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "var(--color-bg-base)" }}>
      <TabBar />
      <div className="flex flex-col flex-1 overflow-hidden px-5 py-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 text-xs" style={{ color: "var(--color-text-dimmed)" }}>
            {isLoading ? "불러오는 중..." : source === "server" ? "서버 저장 (영구)" : source === "local" ? "브라우저 저장 (로컬)" : ""}
          </div>
          {isSaved && (
            <span className="text-xs px-2 py-1 rounded" style={{ background: "#0f2f1a", color: "#4ade80" }}>
              {savedTab?.source === "server" ? "서버에 저장됨 ✓" : "브라우저에 저장됨 ✓"}
            </span>
          )}
          <PreviewToggle preview={previewMode} onChange={setPreviewMode} />
          <button
            onClick={() => handleClear(fileKey)}
            disabled={!contents[fileKey]}
            className="text-xs px-3 py-1.5 rounded transition-all"
            style={{
              background: "var(--color-bg-elevated)",
              color: contents[fileKey] ? "var(--color-text-secondary)" : "var(--color-text-dimmed)",
              border: "1px solid var(--color-bg-border)",
              cursor: contents[fileKey] ? "pointer" : "not-allowed",
              opacity: contents[fileKey] ? 1 : 0.5,
            }}
          >
            초기화
          </button>
          <button
            onClick={() => handleSave(fileKey)}
            className="text-xs px-3 py-1.5 rounded font-semibold"
            style={{ background: "var(--color-accent-blue)", color: "#fff", border: "1px solid transparent", cursor: "pointer" }}
          >
            저장
          </button>
        </div>
        {previewMode && contents[fileKey] ? (
          <div className="flex-1 overflow-y-auto rounded p-4" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)" }}>
            <MarkdownRenderer content={contents[fileKey]} />
          </div>
        ) : (
          <textarea
            value={contents[fileKey]}
            onChange={(e) => setContents((prev) => ({ ...prev, [fileKey]: e.target.value }))}
            disabled={isLoading}
            spellCheck={false}
            className="flex-1 w-full resize-none rounded p-4 outline-none"
            style={{
              background: "var(--color-bg-surface)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-bg-border)",
              fontFamily: "var(--font-mono, 'Fira Code', 'Cascadia Code', monospace)",
              fontSize: 13,
              lineHeight: 1.6,
              caretColor: "var(--color-accent-blue)",
            }}
            placeholder={isLoading ? "불러오는 중..." : fileTab.placeholder}
          />
        )}
      </div>
    </div>
  );
}
