"use client";
import { useState } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import InviteModal from "@/components/InviteModal";
import MemberManageModal from "@/components/MemberManageModal";

interface TopNavProps {
  activeView: string;
  onViewChange: (v: string) => void;
}

const views = [
  { id: "office",    label: "픽셀 오피스" },
  { id: "dashboard", label: "대시보드" },
  { id: "tasks",     label: "작업 목록" },
  { id: "kanban",    label: "칸반 보드" },
  { id: "gantt",     label: "간트 차트" },
];

export default function TopNav({ activeView, onViewChange }: TopNavProps) {
  const { projects, tasks, connected } = useDashboardStore();
  const inProgress = tasks.filter((t) => t.status === "progress").length;
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  return (
    <>
    <header
      className="flex items-center justify-between px-5 py-3 border-b"
      style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-bg-border)", height: 52 }}
    >
      {/* Left: Brand + Live */}
      <div className="flex items-center gap-3">
        <span
          className="text-base font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
        >
          팀 대시보드
        </span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: connected ? "var(--color-live)" : "var(--color-text-dimmed)" }}>
          <span
            className={connected ? "animate-pulse-live rounded-full" : "rounded-full"}
            style={{ width: 7, height: 7, background: connected ? "var(--color-live)" : "#52525b", display: "inline-block" }}
          />
          {connected ? "실시간" : "연결 중..."}
        </span>
      </div>

      {/* Center: View Tabs */}
      <nav className="flex items-center gap-1">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => onViewChange(v.id)}
            className="px-3 py-1.5 rounded text-xs font-medium transition-all duration-150"
            style={{
              fontFamily: "var(--font-display)",
              background: activeView === v.id ? "var(--color-bg-elevated)" : "transparent",
              color: activeView === v.id ? "var(--color-text-primary)" : "var(--color-text-muted)",
              border: activeView === v.id ? "1px solid var(--color-bg-border)" : "1px solid transparent",
            }}
          >
            {v.label}
          </button>
        ))}
      </nav>

      {/* Right: Stats + Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span>
            <span style={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>프로젝트</span>
            <span className="ml-1 font-bold" style={{ color: "var(--color-accent-blue)" }}>{projects.length}</span>
          </span>
          <span style={{ color: "var(--color-bg-border)" }}>|</span>
          <span>
            <span style={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>작업</span>
            <span className="ml-1 font-bold" style={{ color: "var(--color-text-primary)" }}>{tasks.length}</span>
          </span>
          <span style={{ color: "var(--color-bg-border)" }}>|</span>
          <span>
            <span style={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>진행 중</span>
            <span className="ml-1 font-bold" style={{ color: "var(--color-status-progress)" }}>{inProgress}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManageModal(true)}
            className="flex items-center gap-1.5 rounded text-xs font-semibold transition-colors"
            style={{
              height: 28,
              padding: "0 10px",
              background: "var(--color-bg-elevated)",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-bg-border)",
            }}
            title="멤버 관리"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="23" y1="18" x2="17" y2="18"/>
            </svg>
            멤버 관리
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 rounded text-xs font-semibold transition-colors"
            style={{
              height: 28,
              padding: "0 10px",
              background: "var(--color-bg-elevated)",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-bg-border)",
            }}
            title="멤버 초대"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            멤버 초대
          </button>
        </div>
      </div>
    </header>

    {showInviteModal && (
      <InviteModal onClose={() => setShowInviteModal(false)} />
    )}
    {showManageModal && (
      <MemberManageModal onClose={() => setShowManageModal(false)} />
    )}
  </>
  );
}
