"use client";
import { useState } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";

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
          width: 480,
          maxHeight: "70vh",
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
              className="flex items-center justify-between rounded-lg px-3 py-2.5"
              style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-bg-border)" }}
            >
              {/* Avatar + Info */}
              <div className="flex items-center gap-3">
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

              {/* Delete */}
              <div className="flex items-center gap-2">
                {confirmId === m.id ? (
                  <>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>정말요?</span>
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
