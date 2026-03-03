"use client";
import { useState, useCallback } from "react";

interface InviteData {
  token: string;
  memberId: string;
  memberName: string;
  role: string;
  createdBy: string;
  expiresAt: string;
}

function getDaysLeft(expiresAt: string): number {
  const now = new Date();
  const exp = new Date(expiresAt);
  const diff = exp.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function InvitePageClient({ invite }: { invite: InviteData }) {
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const command = `curl -fsSL ${baseUrl}/api/invites/${invite.token}/setup.sh | bash`;
  const daysLeft = getDaysLeft(invite.expiresAt);

  const handleCopy = useCallback(async () => {
    let success = false;
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(command); success = true; } catch { /* fall through */ }
    }
    if (!success) {
      const ta = document.createElement("textarea");
      ta.value = command;
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
      document.body.appendChild(ta); ta.focus(); ta.select();
      try { document.execCommand("copy"); success = true; } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
    if (success) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }, [command]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "var(--color-bg-base)" }}
    >
      <div
        className="rounded-2xl flex flex-col gap-6 w-full"
        style={{
          maxWidth: 560,
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-bg-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          padding: "40px 40px",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              fontFamily: "var(--font-display)",
              color: "var(--color-text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            MDI Dashboard
          </span>
        </div>

        {/* Greeting */}
        <div className="flex flex-col items-center gap-1 text-center">
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text-primary)" }}>
            👋 {invite.memberName}님, 팀에 초대되었습니다!
          </p>
          <div className="flex items-center gap-4 mt-2" style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            <span>
              역할:{" "}
              <span style={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>
                {invite.role}
              </span>
            </span>
            <span style={{ color: "var(--color-bg-border)" }}>|</span>
            <span>
              초대자:{" "}
              <span style={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>
                {invite.createdBy}
              </span>
            </span>
          </div>
        </div>

        {/* Divider + instruction */}
        <div>
          <div
            className="flex items-center gap-3 mb-4"
            style={{ color: "var(--color-text-dimmed)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-display)" }}
          >
            <div style={{ flex: 1, height: 1, background: "var(--color-bg-border)" }} />
            연결 방법
            <div style={{ flex: 1, height: 1, background: "var(--color-bg-border)" }} />
          </div>

          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 12 }}>
            터미널에서 아래 커맨드를 실행하세요:
          </p>

          {/* Command box */}
          <div
            className="rounded-lg p-4 flex flex-col gap-3"
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid var(--color-bg-border)",
              fontFamily: "monospace",
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "var(--color-text-secondary)",
                wordBreak: "break-all",
                lineHeight: 1.6,
              }}
            >
              {command}
            </span>
          </div>

          {/* Copy button */}
          <div className="flex justify-center mt-3">
            <button
              onClick={handleCopy}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                background: copied ? "var(--color-live, #22c55e)" : "var(--color-accent, #5b6cf8)",
                padding: "8px 24px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              {copied ? "복사됨 ✓" : "커맨드 복사"}
            </button>
          </div>
        </div>

        {/* Expiry warning */}
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-3"
          style={{
            background: daysLeft <= 1 ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.08)",
            border: `1px solid ${daysLeft <= 1 ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.2)"}`,
          }}
        >
          <span style={{ fontSize: 14 }}>⚠️</span>
          <span style={{ fontSize: 12, color: daysLeft <= 1 ? "#f87171" : "#fbbf24" }}>
            유효기간: {formatDate(invite.expiresAt)}{" "}
            ({daysLeft > 0 ? `${daysLeft}일 남음` : "오늘 만료"})
          </span>
        </div>
      </div>
    </div>
  );
}
