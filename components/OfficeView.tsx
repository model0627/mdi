"use client";
import { useState } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import type { Member, Task } from "@/lib/data";

// ─── Constants ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4",
];

const STATUS_COLOR: Record<Member["status"], string> = {
  active:  "#22c55e",
  away:    "#f59e0b",
  offline: "#6b7280",
};

const GRID_SLOTS = 8;

// ─── Pixel Character ───────────────────────────────────────────────────────────

function PixelChar({ colorIndex, animDelay = 0 }: { colorIndex: number; animDelay?: number }) {
  const body = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  const skin = "#f4c89e";
  const hair = ["#2d1b0e","#1a0a00","#3d2b1f","#0d0d0d","#4a3728","#1e1208","#2d1b0e","#3d2b1f"][colorIndex % 8];
  return (
    <svg
      width="32" height="48" viewBox="0 0 16 24"
      style={{ imageRendering: "pixelated", animation: `desk-idle ${3.5 + animDelay * 0.3}s ease-in-out infinite`, animationDelay: `${animDelay}s` }}
      className="pixel-canvas"
    >
      <rect x="5" y="1" width="6" height="1" fill={hair} />
      <rect x="4" y="2" width="8" height="1" fill={hair} />
      <rect x="4" y="3" width="1" height="2" fill={hair} />
      <rect x="11" y="3" width="1" height="2" fill={hair} />
      <rect x="4" y="2" width="8" height="6" fill={skin} />
      <rect x="5" y="1" width="6" height="1" fill={skin} />
      <rect x="6"  y="5" width="1" height="1" fill="#1a1a2e" />
      <rect x="9"  y="5" width="1" height="1" fill="#1a1a2e" />
      <rect x="7"  y="7" width="2" height="1" fill="#c4896a" />
      <rect x="7"  y="8" width="2" height="1" fill={skin} />
      <rect x="4"  y="9"  width="8"  height="7"  fill={body} />
      <rect x="2"  y="9"  width="2"  height="5"  fill={body} />
      <rect x="12" y="9"  width="2"  height="5"  fill={body} />
      <rect x="2"  y="14" width="2"  height="2"  fill={skin} />
      <rect x="12" y="14" width="2"  height="2"  fill={skin} />
      <rect x="5"  y="16" width="3"  height="5"  fill="#1e293b" />
      <rect x="8"  y="16" width="3"  height="5"  fill="#1e293b" />
      <rect x="4"  y="21" width="4"  height="2"  fill="#0f172a" />
      <rect x="8"  y="21" width="4"  height="2"  fill="#0f172a" />
    </svg>
  );
}

// ─── Monitor ───────────────────────────────────────────────────────────────────

function Monitor({ badge }: { badge: "!" | "W" | null }) {
  const border = badge === "W" ? "#4f46e5" : badge === "!" ? "#be123c" : "#252545";
  const glow   = badge === "W" ? "0 0 14px 4px rgba(99,102,241,0.45)"
               : badge === "!" ? "0 0 10px 3px rgba(244,63,94,0.3)"
               : undefined;
  return (
    <div style={{
      width: 48, height: 32,
      background: "#090d1a",
      border: `2px solid ${border}`,
      borderRadius: 3,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: glow,
    }}>
      <div style={{
        width: 40, height: 24,
        background: badge === "W" ? "#040c1e" : "#060810",
        borderRadius: 1,
        display: "flex", flexDirection: "column",
        padding: "3px 4px", gap: 2,
      }}>
        {badge === "W" ? (
          <>
            <div style={{ height: 2, background: "#a78bfa", borderRadius: 1, width: "60%" }} />
            <div style={{ height: 2, background: "#6366f1", borderRadius: 1, width: "85%" }} />
            <div style={{ height: 2, background: "#818cf8", borderRadius: 1, width: "45%" }} />
            <div style={{ height: 2, background: "#4f46e5", borderRadius: 1, width: "75%" }} />
            <div style={{ height: 2, background: "#c4b5fd", borderRadius: 1, width: "30%" }} />
          </>
        ) : badge === "!" ? (
          <>
            <div style={{ height: 2, background: "#f43f5e", borderRadius: 1, width: "65%" }} />
            <div style={{ height: 2, background: "#22c55e", borderRadius: 1, width: "80%" }} />
            <div style={{ height: 2, background: "#f43f5e", borderRadius: 1, width: "40%" }} />
            <div style={{ height: 2, background: "#22c55e", borderRadius: 1, width: "90%" }} />
          </>
        ) : (
          <>
            <div style={{ height: 2, background: "#1a2235", borderRadius: 1, width: "70%" }} />
            <div style={{ height: 2, background: "#1a2235", borderRadius: 1, width: "50%" }} />
            <div style={{ height: 2, background: "#1a2235", borderRadius: 1, width: "85%" }} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Task Tooltip ──────────────────────────────────────────────────────────────

function TaskTooltip({ member, tasks }: { member: Member; tasks: Task[] }) {
  const active = tasks.filter(
    (t) => t.assigneeId === member.id && t.status !== "done" && t.status !== "cancelled"
  );
  return (
    <div style={{
      position: "absolute", bottom: "calc(100% + 10px)", left: "50%", transform: "translateX(-50%)",
      background: "#0d1425", border: "1px solid #1e3050",
      borderRadius: 8, padding: "10px 12px",
      zIndex: 200, minWidth: 170,
      boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
      pointerEvents: "none",
    }}>
      {/* header */}
      <div style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0", fontFamily: "var(--font-display)" }}>
          {member.name}
        </span>
        <span style={{ fontSize: 9, color: "#64748b", marginLeft: 6, fontFamily: "var(--font-mono)" }}>
          {member.role}
        </span>
      </div>
      {/* current activity */}
      {member.currentActivity && (
        <div style={{ fontSize: 10, color: "#c4b5fd", marginBottom: 5, fontFamily: "var(--font-mono)", display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ color: "#7c3aed" }}>▶</span>
          {member.currentActivity}
        </div>
      )}
      {/* task list */}
      {active.length > 0 ? active.slice(0, 4).map((t) => (
        <div key={t.id} style={{ fontSize: 10, color: "#94a3b8", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{
            width: 6, height: 6, borderRadius: 1, flexShrink: 0,
            background: t.status === "review" ? "#f43f5e" : t.status === "progress" ? "#f59e0b" : "#475569",
          }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {t.title}
          </span>
        </div>
      )) : (
        <div style={{ fontSize: 10, color: "#334155", fontFamily: "var(--font-mono)" }}>작업 없음</div>
      )}
      {/* arrow */}
      <div style={{
        position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
        borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
        borderTop: "6px solid #1e3050",
      }} />
    </div>
  );
}

// ─── Pixel Decorations ─────────────────────────────────────────────────────────

function PixelPlant({ scale = 1 }: { scale?: number }) {
  return (
    <svg width={20 * scale} height={28 * scale} viewBox="0 0 10 14" style={{ imageRendering: "pixelated" }}>
      <rect x="2" y="10" width="6" height="4" fill="#7c4e28" />
      <rect x="3" y="9"  width="4" height="1" fill="#a06030" />
      <rect x="4" y="5"  width="2" height="5" fill="#2d5016" />
      <rect x="1" y="5"  width="3" height="3" fill="#4a9e26" />
      <rect x="6" y="4"  width="3" height="3" fill="#3a7d1e" />
      <rect x="2" y="2"  width="6" height="4" fill="#56b831" />
      <rect x="3" y="1"  width="4" height="2" fill="#4a9e26" />
    </svg>
  );
}

function PixelCoffeeStation() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width="52" height="44" viewBox="0 0 26 22" style={{ imageRendering: "pixelated" }}>
        {/* counter */}
        <rect x="0" y="14" width="26" height="8" fill="#5c4020" />
        <rect x="0" y="13" width="26" height="1" fill="#8b6035" />
        {/* machine */}
        <rect x="2" y="5"  width="9" height="9"  fill="#1e2030" />
        <rect x="3" y="6"  width="7" height="7"  fill="#141825" />
        <rect x="4" y="7"  width="3" height="2"  fill="#0a1628" />
        <rect x="4" y="7"  width="1" height="1"  fill="#22c55e" />
        <rect x="7" y="11" width="1" height="3"  fill="#2a2a4a" />
        {/* cup */}
        <rect x="13" y="10" width="6" height="4" fill="#f0ece8" />
        <rect x="12" y="11" width="1" height="2" fill="#f0ece8" />
        <rect x="14" y="11" width="3" height="2" fill="#c07828" />
        {/* steam */}
        <rect x="15" y="7"  width="1" height="2" fill="rgba(200,200,200,0.5)" />
        <rect x="17" y="6"  width="1" height="2" fill="rgba(200,200,200,0.35)" />
        <rect x="14" y="5"  width="1" height="1" fill="rgba(200,200,200,0.25)" />
      </svg>
      <span style={{ fontSize: 9, color: "#4a5568", fontFamily: "var(--font-mono)" }}>☕ 카페</span>
    </div>
  );
}

function BulletinBoard({ tasks }: { tasks: Task[] }) {
  const inProgress = tasks.filter((t) => t.status === "progress").length;
  const inReview   = tasks.filter((t) => t.status === "review").length;
  const done       = tasks.filter((t) => t.status === "done").length;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{
        width: 56, background: "#8b6914", border: "3px solid #5c4010",
        borderRadius: 3, padding: "6px 6px 8px",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.35)",
      }}>
        {/* pin */}
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#c00", margin: "0 auto 4px" }} />
        {/* post-its */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {inProgress > 0 && (
            <div style={{ width: 20, height: 20, background: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#78350f", boxShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>
              {inProgress}
            </div>
          )}
          {inReview > 0 && (
            <div style={{ width: 20, height: 20, background: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#7f1d1d", boxShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>
              {inReview}
            </div>
          )}
          {done > 0 && (
            <div style={{ width: 20, height: 20, background: "#86efac", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#14532d", boxShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>
              {done}
            </div>
          )}
          <div style={{ width: 20, height: 20, background: "#93c5fd", opacity: 0.5 }} />
        </div>
      </div>
      <span style={{ fontSize: 9, color: "#4a5568", fontFamily: "var(--font-mono)" }}>📋 현황판</span>
    </div>
  );
}

// ─── Desk ──────────────────────────────────────────────────────────────────────

function Desk({ member, tasks, delay }: { member: Member | null; tasks: Task[]; delay: number }) {
  const [hovered, setHovered] = useState(false);

  const mtasks     = member ? tasks.filter((t) => t.assigneeId === member.id) : [];
  const inProgress = mtasks.filter((t) => t.status === "progress").length;
  const inReview   = mtasks.filter((t) => t.status === "review").length;

  let badge: "!" | "W" | null = null;
  let activityText = "";

  if (member) {
    if (inReview > 0) {
      badge = "!";
      activityText = `${inReview}개 리뷰 대기`;
    } else if (member.currentActivity) {
      badge = "W";
      activityText = member.currentActivity;
    } else if (inProgress > 0) {
      activityText = `${inProgress}개 진행 중`;
    }
  }

  const statusColor = member ? STATUS_COLOR[member.status] : undefined;

  return (
    <div
      className="animate-slide-in-up"
      style={{ animationDelay: `${delay * 0.08}s`, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}
      onMouseEnter={() => member && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip */}
      {hovered && member && <TaskTooltip member={member} tasks={tasks} />}

      {/* Name + status dot */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        marginBottom: 6, height: 16,
        fontFamily: "var(--font-display)", fontSize: 11,
        color: member ? "var(--color-text-secondary)" : "transparent",
        fontWeight: 600,
      }}>
        {member && (
          <span style={{
            width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
            background: statusColor,
            boxShadow: member.status === "active" ? `0 0 6px ${statusColor}` : undefined,
          }} />
        )}
        <span style={{ whiteSpace: "nowrap" }}>{member?.name ?? "　"}</span>
      </div>

      {/* Desk container — z-layering: monitor(1) < char(2) < desk-surface(3) */}
      <div style={{ position: "relative", width: 96, height: 100 }}>

        {member ? (
          <>
            {/* Glow behind active character */}
            {badge === "W" && (
              <div style={{
                position: "absolute", top: 30, left: "50%", transform: "translateX(-50%)",
                width: 54, height: 36, borderRadius: "50%",
                background: "#7c3aed", opacity: 0.18, filter: "blur(10px)",
                pointerEvents: "none",
              }} />
            )}

            {/* Monitor — z:1, shows above desk, behind character */}
            <div style={{ position: "absolute", top: 2, left: "50%", transform: "translateX(-50%)", zIndex: 1 }}>
              <Monitor badge={badge} />
              {/* Stand */}
              <div style={{ width: 6, height: 5, background: "#1e2040", margin: "0 auto" }} />
            </div>

            {/* Status badge on monitor top-right */}
            {badge && (
              <div style={{
                position: "absolute", top: 0, left: "calc(50% + 12px)", zIndex: 5,
                width: 16, height: 16, borderRadius: "50%",
                background: badge === "!" ? "#f43f5e" : "#a78bfa",
                color: "#fff", fontSize: 8, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-mono)",
                boxShadow: badge === "W" ? "0 0 6px rgba(167,139,250,0.9)" : "0 0 6px rgba(244,63,94,0.9)",
              }}>
                {badge}
              </div>
            )}

            {/* Character — z:2, in front of monitor */}
            <div style={{ position: "absolute", bottom: 19, left: "50%", transform: "translateX(-50%)", zIndex: 2 }}>
              <PixelChar colorIndex={member.avatarColor} animDelay={delay * 0.3} />
            </div>
          </>
        ) : (
          /* Empty seat silhouette */
          <div style={{ position: "absolute", bottom: 19, left: "50%", transform: "translateX(-50%)", opacity: 0.12, zIndex: 2 }}>
            <svg width="32" height="48" viewBox="0 0 16 24" style={{ imageRendering: "pixelated" }}>
              <rect x="5" y="2" width="6" height="6" fill="#8898cc" />
              <rect x="4" y="9" width="8" height="6" fill="#8898cc" />
              <rect x="2" y="9" width="2" height="5" fill="#8898cc" />
              <rect x="12" y="9" width="2" height="5" fill="#8898cc" />
              <rect x="5" y="15" width="3" height="5" fill="#8898cc" />
              <rect x="8" y="15" width="3" height="5" fill="#8898cc" />
            </svg>
          </div>
        )}

        {/* Desk top surface — z:3 covers char legs */}
        <div style={{
          position: "absolute", bottom: 7, left: 0, right: 0, zIndex: 3, height: 12,
          background: member ? "#7c5c2e" : "#2a2e4a",
          borderTop:   `2px solid ${member ? "#a07840" : "#3a3e60"}`,
          borderLeft:  `1px solid ${member ? "#8a6835" : "#32365a"}`,
          borderRight: `1px solid ${member ? "#5c4020" : "#22264a"}`,
          borderRadius: "3px 3px 0 0",
        }}>
          {member && (
            <div style={{
              position: "absolute", top: 3, left: "50%", transform: "translateX(-50%)",
              width: 28, height: 4, background: "#5a4018", borderRadius: 1,
            }} />
          )}
        </div>

        {/* Desk front face */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3, height: 8,
          background: member ? "#5c4020" : "#22263e",
          borderBottom: `1px solid ${member ? "#3a2810" : "#161930"}`,
          borderRadius: "0 0 3px 3px",
        }} />
      </div>

      {/* Activity label */}
      <div style={{
        marginTop: 8, fontSize: 10, textAlign: "center",
        color: badge === "W" ? "#c4b5fd" : badge === "!" ? "#fda4af" : "var(--color-text-muted)",
        fontFamily: "var(--font-mono)", minHeight: 14,
        maxWidth: 96, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        fontWeight: badge ? 600 : 400,
        cursor: member ? "pointer" : "default",
      }}>
        {activityText}
      </div>
    </div>
  );
}

// ─── Office View ───────────────────────────────────────────────────────────────

export default function OfficeView() {
  const { members, tasks } = useDashboardStore();
  const slots: (Member | null)[] = [
    ...members,
    ...Array(Math.max(0, GRID_SLOTS - members.length)).fill(null),
  ];

  return (
    <div className="flex-1 overflow-auto" style={{ background: "var(--color-bg-base)" }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-2" style={{ borderBottom: "1px solid var(--color-bg-divider)" }}>
        <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
          픽셀 오피스
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {members.filter((m) => m.status === "active").length}명 활성 · {members.length}명 총원
        </p>
      </div>

      {/* Room */}
      <div className="p-5">
        <div style={{
          background: "#111827",
          border: "2px solid #1f2d4a",
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6), inset 0 0 80px rgba(0,0,20,0.4)",
        }}>
          {/* Ceiling lights */}
          <div style={{
            height: 14, background: "linear-gradient(180deg, #1a2545 0%, #151e38 100%)",
            borderBottom: "1px solid #1f2d4a",
            display: "flex", alignItems: "center", justifyContent: "space-around",
            paddingInline: 80,
          }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{
                width: 36, height: 5, background: "rgba(180,210,255,0.18)",
                borderRadius: 2, boxShadow: "0 0 8px 3px rgba(140,180,255,0.12)",
              }} />
            ))}
          </div>

          {/* Floor row: left-wall | desks | right-wall */}
          <div style={{ display: "flex", alignItems: "stretch" }}>

            {/* Left wall — plants + coffee */}
            <div style={{
              width: 76, flexShrink: 0,
              backgroundImage: "repeating-conic-gradient(#16213a 0% 25%, #1b2a48 0% 50%)",
              backgroundSize: "28px 28px",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "space-evenly",
              padding: "20px 0",
              borderRight: "1px solid #1f2d4a",
            }}>
              <PixelPlant scale={1.5} />
              <PixelCoffeeStation />
              <PixelPlant scale={1.2} />
            </div>

            {/* Main desk grid */}
            <div style={{
              flex: 1,
              backgroundImage: "repeating-conic-gradient(#16213a 0% 25%, #1b2a48 0% 50%)",
              backgroundSize: "28px 28px",
              padding: "28px 24px 20px",
            }}>
              <div
                className="grid gap-x-6 gap-y-10"
                style={{ gridTemplateColumns: "repeat(4, 96px)", justifyContent: "center" }}
              >
                {slots.map((m, i) => (
                  <Desk key={i} member={m} tasks={tasks} delay={i} />
                ))}
              </div>
            </div>

            {/* Right wall — plants + bulletin board */}
            <div style={{
              width: 76, flexShrink: 0,
              backgroundImage: "repeating-conic-gradient(#16213a 0% 25%, #1b2a48 0% 50%)",
              backgroundSize: "28px 28px",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "space-evenly",
              padding: "20px 0",
              borderLeft: "1px solid #1f2d4a",
            }}>
              <PixelPlant scale={1.3} />
              <BulletinBoard tasks={tasks} />
              <PixelPlant scale={1.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pb-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-xs" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>범례:</span>
        {[
          { badge: "!", label: "리뷰 대기", color: "#f43f5e" },
          { badge: "W", label: "코딩 중",   color: "#a78bfa" },
        ].map(({ badge, label, color }) => (
          <span key={badge} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <span className="rounded-full flex items-center justify-center text-white font-bold" style={{ width: 14, height: 14, fontSize: 7, background: color }}>
              {badge}
            </span>
            {label}
          </span>
        ))}
        <span className="flex items-center gap-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
          {(["active","away","offline"] as const).map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLOR[s], display: "inline-block" }} />
              {{ active: "활성", away: "자리비움", offline: "오프라인" }[s]}
            </span>
          ))}
        </span>
        <span className="text-xs ml-auto" style={{ color: "var(--color-text-dimmed)", fontFamily: "var(--font-mono)" }}>
          마우스 올리면 작업 확인
        </span>
      </div>
    </div>
  );
}
