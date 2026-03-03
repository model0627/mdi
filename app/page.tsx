"use client";
import { useState, useEffect } from "react";
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
  const [view, setView] = useState<View>("dashboard");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  useSSE();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("task")) setView("tasks");
  }, []);

  const handleViewChange = (v: string) => {
    if (v !== "tasks") setProjectFilter(null);
    setView(v as View);
  };

  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", background: "var(--color-bg-base)" }}
    >
      <TopNav activeView={view} onViewChange={handleViewChange} />

      <main className="flex flex-1 overflow-hidden">
        {view === "office"    && <OfficeView />}
        {view === "dashboard" && <DashboardView onGoToTasks={(id) => { setProjectFilter(id); setView("tasks"); }} />}
        {view === "tasks"     && <TaskListView projectFilter={projectFilter} onClearFilter={() => setProjectFilter(null)} />}
        {view === "kanban"    && <KanbanView />}
        {view === "gantt"     && <GanttView />}
        {view === "config"    && <ConfigView />}
      </main>
    </div>
  );
}
