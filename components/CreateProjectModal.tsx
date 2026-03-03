"use client";
import { useState, useEffect, useCallback } from "react";

const PRESET_COLORS = [
  { value: "#4f8ef7", label: "파랑" },
  { value: "#34d399", label: "초록" },
  { value: "#f97316", label: "주황" },
  { value: "#a78bfa", label: "보라" },
  { value: "#f43f5e", label: "빨강" },
  { value: "#fbbf24", label: "노랑" },
];

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CreateProjectModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0].value);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) { setError("프로젝트 이름을 입력해주세요."); return; }
    const id = slugify(name) || `proj-${Date.now()}`;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: name.trim(), description, color, startDate, endDate }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "생성 실패");
        return;
      }
      onCreated?.();
      onClose();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }, [name, description, color, startDate, endDate, onClose, onCreated]);

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
        style={{ width: "min(480px, calc(100vw - 24px))", maxHeight: "90vh", overflow: "auto", background: "var(--color-bg-card)", border: "1px solid var(--color-bg-border)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--color-bg-border)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>
            새 프로젝트
          </h2>
          <button onClick={onClose} style={{ color: "var(--color-text-dimmed)", lineHeight: 1 }}>✕</button>
        </div>

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
              placeholder="프로젝트 이름"
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>설명</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="간단한 설명"
              style={inputStyle}
            />
          </div>

          {/* Color */}
          <div>
            <label style={labelStyle}>색상</label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  title={c.label}
                  onClick={() => setColor(c.value)}
                  style={{
                    width: 24, height: 24,
                    borderRadius: "50%",
                    background: c.value,
                    border: color === c.value ? "3px solid white" : "3px solid transparent",
                    outline: color === c.value ? `2px solid ${c.value}` : "none",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <label style={labelStyle}>시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>
            <div>
              <label style={labelStyle}>종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>
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
            {saving ? "생성 중..." : "프로젝트 생성"}
          </button>
        </div>
      </div>
    </div>
  );
}
