"use client";

const AVATAR_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4",
];

interface AvatarProps {
  initials: string;
  colorIndex: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { wh: 24, font: 9 },
  md: { wh: 32, font: 12 },
  lg: { wh: 40, font: 15 },
};

export default function Avatar({ initials, colorIndex, size = "md", className = "" }: AvatarProps) {
  const { wh, font } = sizes[size];
  const bg = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 font-semibold ${className}`}
      style={{
        width: wh,
        height: wh,
        background: bg,
        fontSize: font,
        color: "#fff",
        fontFamily: "var(--font-display)",
        letterSpacing: "0.03em",
      }}
    >
      {initials}
    </div>
  );
}
