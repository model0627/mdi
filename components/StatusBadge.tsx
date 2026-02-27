"use client";
import { Status, statusLabel } from "@/lib/data";

interface Props {
  status: Status;
  showDot?: boolean;
}

const dotColor: Record<Status, string> = {
  backlog:   "#52525b",
  progress:  "#f59e0b",
  review:    "#a78bfa",
  done:      "#34d399",
  cancelled: "#71717a",
};

export default function StatusBadge({ status, showDot = true }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium badge-${status}`}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {showDot && (
        <span
          className="rounded-full shrink-0"
          style={{ width: 6, height: 6, background: dotColor[status] }}
        />
      )}
      {statusLabel[status]}
    </span>
  );
}
