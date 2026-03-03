"use client";
import { useState, useEffect } from "react";

interface MdiConfigInfo {
  version: number;
  updatedAt: string;
  claudeBlock: string;
  size: number;
  lastModified: string;
}

export default function ConfigView() {
  const [config, setConfig] = useState<MdiConfigInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/config/mdi")
      .then((r) => r.json())
      .then((data: MdiConfigInfo) => setConfig(data))
      .catch(() => setError("불러오기 실패"))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async () => {
    if (!config?.claudeBlock) return;
    await navigator.clipboard.writeText(config.claudeBlock);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "var(--color-bg-base)" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-3 border-b"
        style={{ borderColor: "var(--color-bg-border)", background: "var(--color-bg-surface)" }}
      >
        <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
          MDI Config — claudeBlock
        </span>
        <div className="flex-1" />
        {config && (
          <span className="text-xs" style={{ color: "var(--color-text-dimmed)" }}>
            v{config.version} · {(config.size / 1024).toFixed(1)} KB · {new Date(config.lastModified).toLocaleString("ko-KR")}
          </span>
        )}
        {error && (
          <span className="text-xs px-2 py-1 rounded" style={{ background: "#3f1a1a", color: "#f87171" }}>
            {error}
          </span>
        )}
        <button
          onClick={handleCopy}
          disabled={!config?.claudeBlock}
          className="text-xs px-3 py-1.5 rounded font-semibold transition-all"
          style={{
            background: config?.claudeBlock ? "var(--color-accent-blue)" : "var(--color-bg-elevated)",
            color: config?.claudeBlock ? "#fff" : "var(--color-text-dimmed)",
            border: "1px solid transparent",
            cursor: config?.claudeBlock ? "pointer" : "not-allowed",
          }}
        >
          {copied ? "복사됨 ✓" : "클립보드 복사"}
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 overflow-hidden px-5 py-4">
        <textarea
          value={config?.claudeBlock ?? ""}
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
          placeholder={loading ? "불러오는 중..." : "설정 파일을 불러올 수 없습니다."}
        />
      </div>
    </div>
  );
}
