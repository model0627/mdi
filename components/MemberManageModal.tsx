"use client";
import { useState } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { Copy, RefreshCw } from "lucide-react";

const AVATAR_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4",
];

const STATUS_LABEL: Record<string, string> = {
  active: "활성",
  away: "자리비움",
  offline: "오프라인",
};

const STATUS_COLOR: Record<string, string> = {
  active: "#22c55e",
  away: "#f59e0b",
  offline: "#6b7280",
};

interface Props {
  onClose: () => void;
}

export default function MemberManageModal({ onClose }: Props) {
  const { members, removeMember } = useDashboardStore();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [setupPopup, setSetupPopup] = useState<{ id: string; inviteUrl: string; setupUrl: string } | null>(null);
  const [copiedWhat, setCopiedWhat] = useState<"curl" | "url" | null>(null);

  async function handleReinvite(id: string) {
    setCopyingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/team/${id}/reinvite`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as { inviteUrl: string; setupUrl: string };
      setSetupPopup({ id, inviteUrl: data.inviteUrl, setupUrl: data.setupUrl });
    } catch (e) {
      setError(e instanceof Error ? e.message : "링크 생성 실패");
    } finally {
      setCopyingId(null);
    }
  }

  function copyToClipboard(text: string, which: "curl" | "url") {
    const doIt = () => {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(doIt);
    } else {
      doIt();
    }
    setCopiedWhat(which);
    setTimeout(() => setCopiedWhat(null), 2000);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      removeMember(id);
      setConfirmId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-xl flex flex-col"
        style={{
          width: "min(480px, calc(100vw - 24px))",
          maxHeight: "85vh",
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-bg-border)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-bg-border)" }}
        >
          <h2
            className="text-sm font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
          >
            멤버 관리
          </h2>
          <button
            onClick={onClose}
            style={{ color: "var(--color-text-dimmed)", fontSize: 18, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {members.length === 0 && (
            <p className="text-xs text-center py-8" style={{ color: "var(--color-text-dimmed)" }}>
              멤버가 없습니다
            </p>
          )}
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-start sm:items-center justify-between gap-2 flex-wrap rounded-lg px-3 py-2.5"
              style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-bg-border)" }}
            >
              {/* Avatar + Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0"
                  style={{
                    width: 32, height: 32,
                    background: AVATAR_COLORS[m.avatarColor % AVATAR_COLORS.length],
                    fontSize: 11,
                  }}
                >
                  {m.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}
                    >
                      {m.name}
                    </span>
                    <span
                      className="flex items-center gap-1 text-xs"
                      style={{ color: STATUS_COLOR[m.status] ?? "#6b7280" }}
                    >
                      <span
                        style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: STATUS_COLOR[m.status] ?? "#6b7280",
                          display: "inline-block",
                        }}
                      />
                      {STATUS_LABEL[m.status] ?? m.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {m.role}
                    </span>
                    <span className="text-xs" style={{ color: "var(--color-text-dimmed)", fontFamily: "var(--font-mono)" }}>
                      @{m.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                {/* Reinvite */}
                <button
                  onClick={() => handleReinvite(m.id)}
                  disabled={copyingId === m.id}
                  title="setup 링크 재발급"
                  className="flex items-center gap-1 text-xs rounded px-2 py-1 transition-colors"
                  style={{
                    background: setupPopup?.id === m.id ? "rgba(99,102,241,0.15)" : "transparent",
                    color: setupPopup?.id === m.id ? "#818cf8" : "var(--color-text-dimmed)",
                    border: `1px solid ${setupPopup?.id === m.id ? "#818cf8" : "var(--color-bg-border)"}`,
                    cursor: copyingId === m.id ? "not-allowed" : "pointer",
                    opacity: copyingId === m.id ? 0.6 : 1,
                  }}
                >
                  {copyingId === m.id ? (
                    <RefreshCw size={11} className="animate-spin" />
                  ) : (
                    <><Copy size={11} /><span>초대링크</span></>
                  )}
                </button>

                {confirmId === m.id ? (
                  <>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>진짜에요?</span>
                    <button
                      onClick={() => handleDelete(m.id)}
                      disabled={deleting === m.id}
                      className="text-xs rounded px-2 py-1 font-semibold"
                      style={{
                        background: "#ef4444",
                        color: "#fff",
                        opacity: deleting === m.id ? 0.6 : 1,
                        cursor: deleting === m.id ? "not-allowed" : "pointer",
                      }}
                    >
                      {deleting === m.id ? "삭제 중..." : "삭제"}
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="text-xs rounded px-2 py-1"
                      style={{
                        background: "var(--color-bg-border)",
                        color: "var(--color-text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmId(m.id)}
                    className="text-xs rounded px-2 py-1 transition-colors"
                    style={{
                      background: "transparent",
                      color: "var(--color-text-dimmed)",
                      border: "1px solid var(--color-bg-border)",
                      cursor: "pointer",
                    }}
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Setup popup */}
        {setupPopup && (
          <div
            className="mx-4 mb-3 rounded-lg flex flex-col gap-2 p-3"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.3)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: "#818cf8" }}>
                setup 링크 발급됨
              </span>
              <button
                onClick={() => setSetupPopup(null)}
                style={{ color: "var(--color-text-dimmed)", fontSize: 14, lineHeight: 1, cursor: "pointer" }}
              >
                ×
              </button>
            </div>
            {/* curl command */}
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--color-text-dimmed)" }}>터미널 자동 설정 (권장)</p>
              <div className="flex items-center gap-0 rounded overflow-hidden" style={{ border: "1px solid var(--color-bg-border)" }}>
                <code
                  className="flex-1 text-xs px-2 py-2"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    color: "var(--color-text-secondary)",
                    fontFamily: "monospace",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {`curl -fsSL ${setupPopup.setupUrl} | bash`}
                </code>
                <button
                  onClick={() => copyToClipboard(`curl -fsSL ${setupPopup.setupUrl} | bash`, "curl")}
                  style={{
                    fontSize: 11, fontWeight: 600, flexShrink: 0, padding: "8px 12px", border: "none", cursor: "pointer",
                    background: copiedWhat === "curl" ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)",
                    color: copiedWhat === "curl" ? "#4ade80" : "#fff",
                    transition: "background 0.2s, color 0.2s",
                  }}
                >
                  {copiedWhat === "curl" ? "✓" : "복사"}
                </button>
              </div>
            </div>
            {/* invite URL */}
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--color-text-dimmed)" }}>웹 초대 링크</p>
              <div className="flex items-center gap-0 rounded overflow-hidden" style={{ border: "1px solid var(--color-bg-border)" }}>
                <code
                  className="flex-1 text-xs px-2 py-2"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    color: "var(--color-text-secondary)",
                    fontFamily: "monospace",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {setupPopup.inviteUrl}
                </code>
                <button
                  onClick={() => copyToClipboard(setupPopup.inviteUrl, "url")}
                  style={{
                    fontSize: 11, fontWeight: 600, flexShrink: 0, padding: "8px 12px", border: "none", cursor: "pointer",
                    background: copiedWhat === "url" ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)",
                    color: copiedWhat === "url" ? "#4ade80" : "#fff",
                    transition: "background 0.2s, color 0.2s",
                  }}
                >
                  {copiedWhat === "url" ? "✓" : "복사"}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="px-5 pb-3 text-xs" style={{ color: "#f87171" }}>
            오류: {error}
          </div>
        )}

        {/* Footer */}
        <div
          className="px-5 py-3 flex justify-end"
          style={{ borderTop: "1px solid var(--color-bg-border)" }}
        >
          <button
            onClick={onClose}
            className="text-xs rounded px-4 py-1.5 font-medium"
            style={{
              background: "var(--color-bg-elevated)",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-bg-border)",
              cursor: "pointer",
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
