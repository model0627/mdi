"use client";
import { Priority, priorityLabel } from "@/lib/data";

const colors: Record<Priority, string> = {
  low:      "#6b7280",
  medium:   "#f97316",
  high:     "#fb923c",
  critical: "#f43f5e",
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className="text-xs font-semibold"
      style={{ color: colors[priority], fontFamily: "var(--font-mono)" }}
    >
      {priorityLabel[priority]}
    </span>
  );
}
