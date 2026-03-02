"use client";
import { useState, useEffect } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import type { Member, Task } from "@/lib/data";

// ─── Constants ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4",
];

// ─── Idle Behaviors ─────────────────────────────────────────────────────────

const IDLE_BEHAVIORS = [
  { emoji: "☕", text: "커피 충전 중..." },
  { emoji: "💬", text: "잡담 중 ㅋㅋ"   },
  { emoji: "🚽", text: "잠깐만요..."     },
  { emoji: "😴", text: "z z z"          },
  { emoji: "📱", text: "폰만 봄"         },
  { emoji: "🎮", text: "몰래 게임 🤫"   },
  { emoji: "🍕", text: "점심 뭐먹지..."  },
  { emoji: "🪟", text: "멍때리는 중"     },
  { emoji: "🎵", text: "이어폰 끼고 춤"  },
  { emoji: "🤔", text: "............"   },
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

function IdleBubble({ memberId }: { memberId: string }) {
  const [idx, setIdx] = useState(() => hashStr(memberId) % IDLE_BEHAVIORS.length);

  useEffect(() => {
    const t = setInterval(
      () => setIdx((p) => (p + 1) % IDLE_BEHAVIORS.length),
      12000 + (hashStr(memberId) % 8000),   // 12~20s per member
    );
    return () => clearInterval(t);
  }, [memberId]);

  const { emoji, text } = IDLE_BEHAVIORS[idx];

  return (
    <div style={{
      animation: "bubble-pop 0.35s ease both",
      transform: "translateX(-50%)",
      position: "relative",
      whiteSpace: "nowrap",
    }}>
      {/* bubble content */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: "rgba(8, 12, 26, 0.92)",
        border: "1px solid rgba(80, 100, 180, 0.32)",
        borderRadius: 8, padding: "3px 9px",
        fontSize: 10, color: "#5a6a8a",
        fontFamily: "var(--font-mono)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.65)",
        animation: "bubble-float 4s ease-in-out 0.35s infinite",
      }}>
        <span>{emoji}</span>
        <span>{text}</span>
      </div>
      {/* tail */}
      <div style={{
        position: "absolute", top: "100%", left: "50%", marginLeft: -4,
        width: 0, height: 0,
        borderLeft: "4px solid transparent",
        borderRight: "4px solid transparent",
        borderTop: "5px solid rgba(80, 100, 180, 0.32)",
      }} />
    </div>
  );
}

const STATUS_COLOR: Record<Member["status"], string> = {
  active:  "#22c55e",
  away:    "#f59e0b",
  offline: "#6b7280",
};

const GRID_SLOTS = 50;

// ─── Pixel Character ───────────────────────────────────────────────────────────

const SKIN_TONES = ["#f4c89e","#e8b88a","#d4956a","#c17d52","#fce0bc","#e8c49a","#bf8b5e","#f0d0a0"];
const HAIR_COLORS = ["#1a0a00","#ffd700","#cc2211","#3d2b1f","#224488","#2d5016","#884422","#0d0d0d"];
const HAT_COLORS  = ["#cc2244","#2244cc","#228844","#884422","#6622aa","#cc8800","#116644","#cc6600"];

function PixelChar({ colorIndex, animDelay = 0, idle = false }: { colorIndex: number; animDelay?: number; idle?: boolean }) {
  const body     = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  const skin     = SKIN_TONES[colorIndex % 8];
  const hair     = HAIR_COLORS[colorIndex % 8];
  const hasGlasses = colorIndex % 4 === 0;
  const hasHat     = colorIndex % 5 === 2;
  const hatColor   = HAT_COLORS[colorIndex % 8];
  const anim = idle
    ? `idle-sway ${5 + animDelay * 0.4}s ease-in-out infinite`
    : `desk-idle ${3.5 + animDelay * 0.3}s ease-in-out infinite`;

  return (
    <svg
      width="32" height="48" viewBox="0 0 16 24"
      style={{ imageRendering: "pixelated", animation: anim, animationDelay: `${animDelay}s` }}
      className="pixel-canvas"
    >
      {/* Hat */}
      {hasHat && <>
        <rect x="3" y="0" width="10" height="1" fill={hatColor} />
        <rect x="4" y="1" width="8" height="2" fill={hatColor} />
        <rect x="4" y="3" width="1" height="1" fill={hatColor} />
        <rect x="11" y="3" width="1" height="1" fill={hatColor} />
      </>}
      {/* Hair (no hat) */}
      {!hasHat && <>
        <rect x="5" y="1" width="6" height="1" fill={hair} />
        <rect x="4" y="2" width="8" height="1" fill={hair} />
        <rect x="4" y="3" width="1" height="2" fill={hair} />
        <rect x="11" y="3" width="1" height="2" fill={hair} />
      </>}
      {/* Head */}
      <rect x="4" y="2" width="8" height="6" fill={skin} />
      {!hasHat && <rect x="5" y="1" width="6" height="1" fill={skin} />}
      {/* Glasses */}
      {hasGlasses && <>
        <rect x="5" y="4" width="2" height="2" fill="#1a3a5a" />
        <rect x="6" y="5" width="1" height="1" fill="#5599cc" />
        <rect x="7" y="5" width="1" height="1" fill="#1a3a5a" />
        <rect x="8" y="4" width="2" height="2" fill="#1a3a5a" />
        <rect x="9" y="5" width="1" height="1" fill="#5599cc" />
      </>}
      {/* Eyes (no glasses) */}
      {!hasGlasses && <>
        <rect x="6" y="5" width="1" height="1" fill="#1a1a2e" />
        <rect x="9" y="5" width="1" height="1" fill="#1a1a2e" />
      </>}
      {/* Smile */}
      <rect x="7" y="7" width="2" height="1" fill="#c4896a" />
      <rect x="7" y="8" width="2" height="1" fill={skin} />
      {/* Body */}
      <rect x="4"  y="9"  width="8"  height="7"  fill={body} />
      <rect x="2"  y="9"  width="2"  height="5"  fill={body} />
      <rect x="12" y="9"  width="2"  height="5"  fill={body} />
      {/* Belt detail */}
      <rect x="4"  y="15" width="8"  height="1"  fill="rgba(0,0,0,0.25)" />
      {/* Hands */}
      <rect x="2"  y="14" width="2"  height="2"  fill={skin} />
      <rect x="12" y="14" width="2"  height="2"  fill={skin} />
      {/* Legs */}
      <rect x="5"  y="16" width="3"  height="5"  fill="#1e293b" />
      <rect x="8"  y="16" width="3"  height="5"  fill="#1e293b" />
      {/* Shoes */}
      <rect x="4"  y="21" width="4"  height="2"  fill="#0f172a" />
      <rect x="8"  y="21" width="4"  height="2"  fill="#0f172a" />
    </svg>
  );
}

// ─── Monitor ───────────────────────────────────────────────────────────────────

function Monitor({ badge }: { badge: "!" | "W" | null }) {
  const border = badge === "W" ? "#7c3aed" : badge === "!" ? "#dc2626" : "#3a2810";
  const glow   = badge === "W" ? "0 0 12px 4px rgba(124,58,237,0.6), 0 0 24px 8px rgba(124,58,237,0.2)"
               : badge === "!" ? "0 0 10px 3px rgba(220,38,38,0.5)"
               : undefined;
  return (
    <div style={{
      width: 48, height: 32,
      background: "#0a0604",
      border: `2px solid ${border}`,
      borderRadius: 2,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: glow,
      imageRendering: "pixelated",
    }}>
      {/* CRT bezel inner */}
      <div style={{
        width: 40, height: 24,
        background: badge === "W" ? "#060014" : badge === "!" ? "#100004" : "#080402",
        borderRadius: 1,
        display: "flex", flexDirection: "column",
        padding: "3px 4px", gap: 2,
        position: "relative", overflow: "hidden",
      }}>
        {badge === "W" ? (
          <>
            <div style={{ height: 2, background: "#c084fc", width: "60%" }} />
            <div style={{ height: 2, background: "#7c3aed", width: "88%" }} />
            <div style={{ height: 2, background: "#a78bfa", width: "45%" }} />
            <div style={{ height: 2, background: "#6d28d9", width: "78%" }} />
            <div style={{ height: 2, background: "#ddd6fe", width: "32%" }} />
          </>
        ) : badge === "!" ? (
          <>
            <div style={{ height: 2, background: "#f87171", width: "68%" }} />
            <div style={{ height: 2, background: "#4ade80", width: "82%" }} />
            <div style={{ height: 2, background: "#fb923c", width: "42%" }} />
            <div style={{ height: 2, background: "#22d3ee", width: "92%" }} />
          </>
        ) : (
          <>
            <div style={{ height: 2, background: "#2a1808", width: "72%" }} />
            <div style={{ height: 2, background: "#2a1808", width: "52%" }} />
            <div style={{ height: 2, background: "#2a1808", width: "88%" }} />
          </>
        )}
        {/* CRT scanline overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "repeating-linear-gradient(0deg,rgba(0,0,0,0.25) 0px,rgba(0,0,0,0.25) 1px,transparent 1px,transparent 3px)",
          pointerEvents: "none",
        }} />
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

function PixelTorch() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <svg width="24" height="36" viewBox="0 0 12 18" style={{ imageRendering: "pixelated" }}>
        {/* Flame outer */}
        <rect x="3" y="0" width="6" height="5" fill="#ff6600"
          style={{ animation: "flicker-torch 0.9s ease-in-out infinite", transformOrigin: "6px 5px" }} />
        {/* Flame inner */}
        <rect x="4" y="1" width="4" height="3" fill="#ffcc00"
          style={{ animation: "flicker-torch 0.7s ease-in-out 0.15s infinite", transformOrigin: "6px 4px" }} />
        <rect x="5" y="1" width="2" height="2" fill="#ffffff" opacity="0.7" />
        {/* Torch head */}
        <rect x="2" y="5" width="8" height="3" fill="#8b6030" />
        <rect x="3" y="4" width="6" height="1" fill="#a07040" />
        {/* Handle */}
        <rect x="4" y="8" width="4" height="7" fill="#6b4820" />
        <rect x="5" y="8" width="2" height="7" fill="#5a3818" />
        {/* Mount base */}
        <rect x="1" y="15" width="10" height="3" fill="#3a2010" />
        <rect x="2" y="14" width="8" height="1" fill="#4a2e18" />
      </svg>
      {/* Glow effect */}
      <div style={{
        width: 24, height: 8,
        background: "radial-gradient(ellipse, rgba(255,160,0,0.35) 0%, transparent 70%)",
        marginTop: -10, pointerEvents: "none",
      }} />
    </div>
  );
}

function PixelBarrel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <svg width="36" height="40" viewBox="0 0 18 20" style={{ imageRendering: "pixelated" }}>
        {/* Body */}
        <rect x="3" y="2"  width="12" height="16" fill="#8b6030" />
        <rect x="2" y="4"  width="14" height="12" fill="#9a6e38" />
        {/* Hoops */}
        <rect x="1" y="4"  width="16" height="2" fill="#5a3a18" />
        <rect x="1" y="9"  width="16" height="2" fill="#5a3a18" />
        <rect x="1" y="14" width="16" height="2" fill="#5a3a18" />
        {/* Top/bottom caps */}
        <rect x="3" y="2"  width="12" height="2" fill="#7a5220" />
        <rect x="3" y="16" width="12" height="2" fill="#7a5220" />
        {/* Wood grain */}
        <rect x="5" y="4"  width="1" height="12" fill="rgba(0,0,0,0.12)" />
        <rect x="9" y="4"  width="1" height="12" fill="rgba(0,0,0,0.12)" />
        <rect x="13" y="4" width="1" height="12" fill="rgba(0,0,0,0.12)" />
        {/* Highlight */}
        <rect x="4" y="4"  width="2" height="12" fill="rgba(255,255,255,0.06)" />
      </svg>
    </div>
  );
}

function PixelBookshelf() {
  const bookColors = ["#e74c3c","#3498db","#2ecc71","#f39c12","#9b59b6","#1abc9c","#e67e22","#e91e63"];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <svg width="56" height="52" viewBox="0 0 28 26" style={{ imageRendering: "pixelated" }}>
        {/* Shelf frame */}
        <rect x="0" y="0"  width="28" height="26" fill="#5c3a18" />
        <rect x="1" y="1"  width="26" height="24" fill="#3a2010" />
        {/* Shelf planks */}
        <rect x="1" y="9"  width="26" height="2" fill="#5c3a18" />
        <rect x="1" y="18" width="26" height="2" fill="#5c3a18" />
        {/* Books row 1 */}
        {bookColors.slice(0,6).map((c, i) => (
          <rect key={i} x={2 + i * 4} y="2" width="3" height="7" fill={c} />
        ))}
        {/* Books row 2 */}
        {bookColors.slice(2,7).map((c, i) => (
          <rect key={i} x={2 + i * 4 + 1} y="11" width="3" height="7" fill={c} />
        ))}
        {/* Books row 3 (shorter) */}
        {bookColors.slice(1,5).map((c, i) => (
          <rect key={i} x={3 + i * 5} y="20" width="3" height="5" fill={c} />
        ))}
        {/* Book spines highlight */}
        {bookColors.slice(0,6).map((_, i) => (
          <rect key={i} x={2 + i * 4} y="2" width="1" height="7" fill="rgba(255,255,255,0.15)" />
        ))}
      </svg>
      <span style={{ fontSize: 9, color: "#7a5830", fontFamily: "var(--font-mono)" }}>📚 서재</span>
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

  const isIdle = !!member
    && member.status !== "offline"
    && !member.currentActivity
    && inProgress === 0
    && inReview === 0;

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

            {/* Idle bubble — floats above character head */}
            {isIdle && (
              <div style={{ position: "absolute", bottom: 71, left: "50%", zIndex: 15, pointerEvents: "none" }}>
                <IdleBubble memberId={member.id} />
              </div>
            )}

            {/* Character — z:2, in front of monitor */}
            <div style={{ position: "absolute", bottom: 19, left: "50%", transform: "translateX(-50%)", zIndex: 2 }}>
              <PixelChar
                colorIndex={member.avatarColor}
                animDelay={delay * 0.3}
                idle={isIdle}
              />
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
          background: member ? "#8b6830" : "#2a1e10",
          borderTop:   `2px solid ${member ? "#b08840" : "#3a2810"}`,
          borderLeft:  `1px solid ${member ? "#9a7238" : "#2a1e10"}`,
          borderRight: `1px solid ${member ? "#6a4e22" : "#1e160a"}`,
          borderRadius: "2px 2px 0 0",
        }}>
          {/* Pixel keyboard on desk */}
          {member && (
            <svg
              width="30" height="7" viewBox="0 0 15 3.5"
              style={{ imageRendering: "pixelated", position: "absolute", top: 2, left: "50%", transform: "translateX(-50%)" }}
            >
              <rect x="0"   y="0" width="15"  height="3.5" fill="#1a1628" rx="0.3" />
              {[0,1.8,3.6,5.4,7.2,9,10.8,12.6].map((x,i) => (
                <rect key={i} x={x + 0.3} y="0.3" width="1.2" height="1.2" fill="#2a2440" />
              ))}
              <rect x="3" y="2" width="9" height="1" fill="#2a2440" />
            </svg>
          )}
        </div>

        {/* Desk front face */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3, height: 8,
          background: member ? "#6a4e22" : "#1e160a",
          borderBottom: `1px solid ${member ? "#3a2810" : "#100a04"}`,
          borderRadius: "0 0 2px 2px",
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
  const [zoom, setZoom] = useState<number>(75);
  const slots: (Member | null)[] = [
    ...members,
    ...Array(Math.max(0, GRID_SLOTS - members.length)).fill(null),
  ];

  return (
    <div className="flex-1 overflow-auto" style={{ background: "var(--color-bg-base)" }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-2 flex items-start justify-between" style={{ borderBottom: "1px solid var(--color-bg-divider)" }}>
        <div>
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
            픽셀 오피스
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {members.filter((m) => m.status === "active").length}명 활성 · {members.length}명 총원 · 최대 {GRID_SLOTS}석
          </p>
        </div>
        {/* Zoom controls */}
        <div className="flex items-center gap-1.5" style={{ marginTop: 4 }}>
          <span style={{ fontSize: 11, color: "var(--color-text-dimmed)", fontFamily: "var(--font-mono)", marginRight: 4 }}>확대</span>
          {[50, 75, 100].map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              style={{
                fontSize: 11, padding: "3px 8px", borderRadius: 5,
                fontFamily: "var(--font-mono)",
                background: zoom === z ? "var(--color-bg-elevated)" : "transparent",
                color: zoom === z ? "var(--color-text-primary)" : "var(--color-text-dimmed)",
                border: zoom === z ? "1px solid var(--color-bg-border)" : "1px solid transparent",
                cursor: "pointer",
              }}
            >
              {z}%
            </button>
          ))}
        </div>
      </div>

      {/* Room */}
      <div className="p-5">
        <div style={{
          background: "#120a04",
          border: "3px solid #3a1e08",
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 8px 48px rgba(0,0,0,0.8), 0 0 0 1px #5a3010, inset 0 0 60px rgba(20,8,0,0.5)",
          imageRendering: "pixelated",
        }}>
          {/* ── Arcade LED Ceiling ── */}
          <div style={{
            height: 18,
            background: "linear-gradient(180deg, #120a04 0%, #1a0e06 100%)",
            borderBottom: "2px solid #3a1e08",
            display: "flex", alignItems: "center",
            paddingInline: 10, gap: 6,
            overflow: "hidden",
          }}>
            {/* LED strip: coloured dots */}
            {(["#ff2244","#ffaa00","#22ff66","#4499ff","#aa22ff","#ff6600",
               "#ff2244","#ffaa00","#22ff66","#4499ff","#aa22ff","#ff6600",
               "#ff2244","#ffaa00","#22ff66","#4499ff","#aa22ff","#ff6600",
               "#ff2244","#ffaa00","#22ff66","#4499ff","#aa22ff","#ff6600",
               "#ff2244","#ffaa00","#22ff66","#4499ff","#aa22ff","#ff6600",
               "#ff2244","#ffaa00","#22ff66","#4499ff","#aa22ff","#ff6600",
            ] as string[]).map((color, i) => (
              <div key={i} style={{
                width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                background: color,
                boxShadow: `0 0 5px 2px ${color}99`,
                animation: `blink-led ${1.8 + (i % 6) * 0.5}s ease-in-out ${(i * 0.18) % 2.5}s infinite`,
              }} />
            ))}
          </div>

          {/* ── Floor row: left-wall | desks | right-wall ── */}
          <div style={{ display: "flex", alignItems: "stretch" }}>

            {/* Left wall — torch + barrel + torch */}
            <div style={{
              width: 76, flexShrink: 0,
              background: "#1e0e06",
              backgroundImage: [
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.45) 0px, rgba(0,0,0,0.45) 1px, transparent 1px, transparent 8px)",
                "repeating-linear-gradient(90deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 14px)",
              ].join(","),
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "space-evenly",
              padding: "24px 0",
              borderRight: "2px solid #3a1e08",
            }}>
              <PixelTorch />
              <PixelBarrel />
              <PixelTorch />
            </div>

            {/* Main desk grid — warm stone tiles */}
            <div style={{
              flex: 1,
              background: "#a07840",
              backgroundImage: "repeating-conic-gradient(#906830 0% 25%, #a07840 0% 50%)",
              backgroundSize: "16px 16px",
              padding: "28px 24px 20px",
              overflow: "auto",
              /* subtle CRT scanlines */
              boxShadow: "inset 0 0 0 9999px repeating-linear-gradient(0deg,rgba(0,0,0,0.06) 0px,rgba(0,0,0,0.06) 1px,transparent 1px,transparent 3px)",
            }}>
              <div
                className="grid gap-x-5 gap-y-8"
                style={{
                  gridTemplateColumns: "repeat(10, 96px)",
                  justifyContent: "center",
                  zoom: zoom / 100,
                }}
              >
                {slots.map((m, i) => (
                  <Desk key={i} member={m} tasks={tasks} delay={i} />
                ))}
              </div>
            </div>

            {/* Right wall — torch + bookshelf + bulletin */}
            <div style={{
              width: 76, flexShrink: 0,
              background: "#1e0e06",
              backgroundImage: [
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.45) 0px, rgba(0,0,0,0.45) 1px, transparent 1px, transparent 8px)",
                "repeating-linear-gradient(90deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 14px)",
              ].join(","),
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "space-evenly",
              padding: "24px 0",
              borderLeft: "2px solid #3a1e08",
            }}>
              <PixelTorch />
              <PixelBookshelf />
              <BulletinBoard tasks={tasks} />
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
