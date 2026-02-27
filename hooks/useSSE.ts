'use client';
import { useEffect, useRef } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import type { Task, Project, Member } from '@/lib/data';

export function useSSE() {
  const { setAll, updateTask, removeTask, updateProject, updateMember, setConnected } =
    useDashboardStore();
  const reconnectDelay = useRef(1000);
  const esRef = useRef<EventSource | null>(null);
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;

    function connect() {
      if (unmounted.current) return;

      const es = new EventSource('/api/events');
      esRef.current = es;

      es.addEventListener('init', (e: MessageEvent) => {
        const data = JSON.parse(e.data) as {
          tasks: Task[];
          projects: Project[];
          members: Member[];
        };
        setAll(data);
        setConnected(true);
        reconnectDelay.current = 1000; // reset backoff on success
      });

      es.addEventListener('task:update', (e: MessageEvent) => {
        updateTask(JSON.parse(e.data) as Task);
      });

      es.addEventListener('task:create', (e: MessageEvent) => {
        updateTask(JSON.parse(e.data) as Task);
      });

      es.addEventListener('task:delete', (e: MessageEvent) => {
        const { id } = JSON.parse(e.data) as { id: string };
        removeTask(id);
      });

      es.addEventListener('project:update', (e: MessageEvent) => {
        updateProject(JSON.parse(e.data) as Project);
      });

      es.addEventListener('member:update', (e: MessageEvent) => {
        updateMember(JSON.parse(e.data) as Member);
      });

      es.onerror = () => {
        es.close();
        setConnected(false);
        if (!unmounted.current) {
          setTimeout(connect, reconnectDelay.current);
          reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
        }
      };
    }

    connect();

    return () => {
      unmounted.current = true;
      esRef.current?.close();
      setConnected(false);
    };
  }, [setAll, updateTask, removeTask, updateProject, updateMember, setConnected]);
}
