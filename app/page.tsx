"use client";
import { useState } from "react";
import TopNav from "@/components/TopNav";
import OfficeView from "@/components/OfficeView";
import DashboardView from "@/components/DashboardView";
import TaskListView from "@/components/TaskListView";
import GanttView from "@/components/GanttView";
import KanbanView from "@/components/KanbanView";
import ConfigView from "@/components/ConfigView";
import { useSSE } from "@/hooks/useSSE";

type View = "office" | "dashboard" | "tasks" | "kanban" | "gantt" | "config";

export default function Page() {
  const [view, setView] = useState<View>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("task")) return "tasks";
    }
    return "dashboard";
  });
  useSSE();

  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", background: "var(--color-bg-base)" }}
    >
      <TopNav activeView={view} onViewChange={(v) => setView(v as View)} />

      <main className="flex flex-1 overflow-hidden">
        {view === "office"    && <OfficeView />}
        {view === "dashboard" && <DashboardView />}
        {view === "tasks"     && <TaskListView />}
        {view === "kanban"    && <KanbanView />}
        {view === "gantt"     && <GanttView />}
        {view === "config"    && <ConfigView />}
      </main>
    </div>
  );
}
