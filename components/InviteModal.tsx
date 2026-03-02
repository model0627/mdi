"use client";
import { useState, useEffect, useCallback } from "react";

interface InviteResponse {
  token: string;
  inviteUrl: string;
  memberId: string;
  memberName: string;
  expiresAt: string;
}

const AVATAR_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#10b981",
  "#f97316",
];

const EXPIRE_OPTIONS = [
  { value: 1, label: "1일" },
  { value: 3, label: "3일" },
  { value: 7, label: "7일" },
  { value: 30, label: "30일" },
];

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const n = name.trim();
  return n.length >= 2 ? (n[0] + n[1]).toUpperCase() : n.toUpperCase();
}

export default function InviteModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [role, setRole] = useState("");
  const [avatarColorIdx, setAvatarColorIdx] = useState(0);
  const [expireDays, setExpireDays] = useState(7);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<InviteResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) { setError("이름을 입력해주세요."); return; }
    if (!memberId.trim()) { setError("멤버 ID를 입력해주세요."); return; }
    if (!/^[a-z0-9-]+$/.test(memberId)) { setError("멤버 ID는 영문 소문자, 숫자, 하이픈만 허용됩니다."); return; }
    if (!role.trim()) { setError("역할을 입력해주세요."); return; }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberName: name.trim(),
          memberId: memberId.trim(),
          initials: deriveInitials(name),
          role: role.trim(),
          avatarColor: avatarColorIdx,
          expiresInDays: expireDays,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "초대 생성 실패");
        return;
      }
      setResult(data as InviteResponse);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }, [name, memberId, role, avatarColorIdx, expireDays]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result.inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result]);

  const inputStyle = {
    width: "100%",
    background: "var(--color-bg-hover, rgba(255,255,255,0.04))",
    border: "1px solid var(--color-bg-border)",
    borderRadius: 6,
    padding: "7px 10px",
    fontSize: 13,
    color: "var(--color-text-primary)",
    outline: "none",
    fontFamily: "inherit",
  } as React.CSSProperties;

  const labelStyle = {
    fontSize: 10,
    color: "var(--color-text-dimmed)",
    fontFamily: "var(--font-display)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    display: "block",
    marginBottom: 4,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-xl flex flex-col"
        style={{ width: 480, background: "var(--color-bg-card)", border: "1px solid var(--color-bg-border)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--color-bg-border)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>
            멤버 초대
          </h2>
          <button onClick={onClose} style={{ color: "var(--color-text-dimmed)", lineHeight: 1 }}>✕</button>
        </div>

        {result ? (
          /* 생성 완료 상태 */
          <div className="px-5 py-6 flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div style={{ fontSize: 32 }}>🎉</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
                초대 링크가 생성되었습니다
              </p>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                {result.memberName}님에게 아래 링크를 공유하세요
              </p>
            </div>

            <div
              className="rounded-lg p-3 flex items-center gap-2"
              style={{ background: "var(--color-bg-hover, rgba(255,255,255,0.04))", border: "1px solid var(--color-bg-border)" }}
            >
              <span
                className="flex-1 truncate"
                style={{ fontSize: 12, color: "var(--color-text-secondary)", fontFamily: "monospace" }}
              >
                {result.inviteUrl}
              </span>
              <button
                onClick={handleCopy}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: copied ? "var(--color-live, #22c55e)" : "var(--color-accent, #5b6cf8)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {copied ? "복사됨 ✓" : "복사"}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                style={{
                  fontSize: 12, fontWeight: 600, color: "#fff",
                  background: "var(--color-accent, #5b6cf8)",
                  padding: "5px 20px", borderRadius: 6, border: "none",
                  cursor: "pointer",
                }}
              >
                닫기
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="px-5 py-4 flex flex-col gap-4">
              {/* Name */}
              <div>
                <label style={labelStyle}>이름 *</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                  placeholder="홍길동"
                  style={inputStyle}
                />
              </div>

              {/* Member ID */}
              <div>
                <label style={labelStyle}>멤버 ID *</label>
                <input
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="hong-gildong"
                  style={inputStyle}
                />
              </div>

              {/* Role */}
              <div>
                <label style={labelStyle}>역할 *</label>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="백엔드 개발자"
                  style={inputStyle}
                />
              </div>

              {/* Avatar Color */}
              <div>
                <label style={labelStyle}>아바타 색상</label>
                <div className="flex items-center gap-2">
                  {AVATAR_COLORS.map((c, i) => (
                    <button
                      key={c}
                      title={c}
                      onClick={() => setAvatarColorIdx(i)}
                      style={{
                        width: 24, height: 24,
                        borderRadius: "50%",
                        background: c,
                        border: avatarColorIdx === i ? "3px solid white" : "3px solid transparent",
                        outline: avatarColorIdx === i ? `2px solid ${c}` : "none",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Expire Days */}
              <div>
                <label style={labelStyle}>유효 기간</label>
                <select
                  value={expireDays}
                  onChange={(e) => setExpireDays(Number(e.target.value))}
                  style={{ ...inputStyle, colorScheme: "dark" }}
                >
                  {EXPIRE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {error && (
                <p style={{ fontSize: 12, color: "#f43f5e" }}>{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 flex items-center justify-end gap-2" style={{ borderTop: "1px solid var(--color-bg-border)" }}>
              <button
                onClick={onClose}
                style={{ fontSize: 12, color: "var(--color-text-dimmed)", padding: "5px 12px", borderRadius: 6, border: "1px solid var(--color-bg-border)" }}
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{
                  fontSize: 12, fontWeight: 600, color: "#fff",
                  background: "var(--color-accent, #5b6cf8)",
                  padding: "5px 20px", borderRadius: 6, border: "none",
                  opacity: saving ? 0.6 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "생성 중..." : "초대 링크 생성"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
