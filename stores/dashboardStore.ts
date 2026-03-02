import { create } from 'zustand';
import type { Task, Project, Member } from '@/lib/data';

interface DashboardState {
  tasks: Task[];
  projects: Project[];
  members: Member[];
  connected: boolean;
  setAll: (data: { tasks: Task[]; projects: Project[]; members: Member[] }) => void;
  updateTask: (task: Task) => void;
  addTask: (task: Task) => void;
  removeTask: (id: string) => void;
  updateProject: (project: Project) => void;
  updateMember: (member: Member) => void;
  removeMember: (id: string) => void;
  setConnected: (v: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  tasks: [],
  projects: [],
  members: [],
  connected: false,

  setAll: (data) =>
    set({ tasks: data.tasks, projects: data.projects, members: data.members }),

  updateTask: (task) =>
    set((s) => ({
      tasks: s.tasks.some((t) => t.id === task.id)
        ? s.tasks.map((t) => (t.id === task.id ? task : t))
        : [...s.tasks, task],
    })),

  addTask: (task) =>
    set((s) => ({ tasks: [...s.tasks, task] })),

  removeTask: (id) =>
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

  updateProject: (project) =>
    set((s) => ({
      projects: s.projects.some((p) => p.id === project.id)
        ? s.projects.map((p) => (p.id === project.id ? project : p))
        : [...s.projects, project],
    })),

  updateMember: (member) =>
    set((s) => ({
      members: s.members.some((m) => m.id === member.id)
        ? s.members.map((m) => (m.id === member.id ? member : m))
        : [...s.members, member],
    })),

  removeMember: (id) =>
    set((s) => ({ members: s.members.filter((m) => m.id !== id) })),

  setConnected: (v) => set({ connected: v }),
}));
