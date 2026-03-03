"use client";
import { useState, useEffect } from "react";

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
  {
    key: "global-claude",
    label: "전역 CLAUDE.md",
    placeholder: "~/.claude/CLAUDE.md 내용을 붙여넣으세요",
  },
  {
    key: "project-claude",
    label: "프로젝트 CLAUDE.md",
    placeholder: "mdi-dashboard/CLAUDE.md 내용을 붙여넣으세요",
  },
  {
    key: "memory",
    label: "MEMORY.md",
    placeholder: "~/.claude/projects/.../memory/MEMORY.md 내용을 붙여넣으세요",
  },
];

const LS_KEY = (key: FileKey) => `mdi-config-editor:${key}`;

export default function ConfigView() {
  const [activeTab, setActiveTab] = useState<TabKey>("mdi-config");

  // MDI Config
  const [mdiConfig, setMdiConfig] = useState<MdiConfigInfo | null>(null);
  const [mdiLoading, setMdiLoading] = useState(false);
  const [mdiError, setMdiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Local editors (localStorage)
  const [contents, setContents] = useState<Record<FileKey, string>>({
    "global-claude": "",
    "project-claude": "",
    "memory": "",
  });
  const [savedKeys, setSavedKeys] = useState<Record<FileKey, boolean>>({
    "global-claude": false,
    "project-claude": false,
    "memory": false,
  });

  // Load from localStorage on mount
  useEffect(() => {
    setContents({
      "global-claude": localStorage.getItem(LS_KEY("global-claude")) ?? "",
      "project-claude": localStorage.getItem(LS_KEY("project-claude")) ?? "",
      "memory": localStorage.getItem(LS_KEY("memory")) ?? "",
    });
  }, []);

  // Load MDI config when tab opens
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

  const handleSave = (key: FileKey) => {
    localStorage.setItem(LS_KEY(key), contents[key]);
    setSavedKeys((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setSavedKeys((prev) => ({ ...prev, [key]: false })), 2000);
  };

  const handleClear = (key: FileKey) => {
    localStorage.removeItem(LS_KEY(key));
    setContents((prev) => ({ ...prev, [key]: "" }));
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
          {/* dot if has content */}
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
              {mdiConfig
                ? `수정: ${new Date(mdiConfig.lastModified).toLocaleString("ko-KR")}`
                : mdiLoading ? "불러오는 중..." : null}
            </div>
            {mdiError && (
              <span className="text-xs px-2 py-1 rounded" style={{ background: "#3f1a1a", color: "#f87171" }}>
                {mdiError}
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
              {copied ? "복사됨 ✓" : "클립보드 복사"}
            </button>
          </div>
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
        </div>
      </div>
    );
  }

  // File editor tabs
  const fileTab = FILE_TABS.find((f) => f.key === activeTab)!;
  const fileKey = activeTab as FileKey;

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "var(--color-bg-base)" }}>
      <TabBar />
      <div className="flex flex-col flex-1 overflow-hidden px-5 py-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 text-xs" style={{ color: "var(--color-text-dimmed)" }}>
            브라우저에 저장됨 (localStorage)
          </div>
          {savedKeys[fileKey] && (
            <span className="text-xs px-2 py-1 rounded" style={{ background: "#0f2f1a", color: "#4ade80" }}>
              저장됨 ✓
            </span>
          )}
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
            className="text-xs px-3 py-1.5 rounded font-semibold transition-all"
            style={{
              background: "var(--color-accent-blue)",
              color: "#fff",
              border: "1px solid transparent",
              cursor: "pointer",
            }}
          >
            저장
          </button>
        </div>
        <textarea
          value={contents[fileKey]}
          onChange={(e) => setContents((prev) => ({ ...prev, [fileKey]: e.target.value }))}
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
          placeholder={fileTab.placeholder}
        />
      </div>
    </div>
  );
}
