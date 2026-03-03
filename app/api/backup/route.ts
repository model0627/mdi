import { NextResponse } from 'next/server';
import { mdStore } from '@/lib/mdStore';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');

function readDir(dir: string): { name: string; content: string }[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md') || f.endsWith('.json'))
    .filter(f => !f.includes('.archive'))
    .map(f => ({ name: f, content: fs.readFileSync(path.join(dir, f), 'utf-8') }));
}

export async function GET() {
  await mdStore.init();

  const zip = new JSZip();
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  // tasks/
  const tasksFolder = zip.folder('tasks')!;
  for (const { name, content } of readDir(path.join(DATA_DIR, 'tasks'))) {
    tasksFolder.file(name, content);
  }

  // projects/
  const projectsFolder = zip.folder('projects')!;
  for (const { name, content } of readDir(path.join(DATA_DIR, 'projects'))) {
    projectsFolder.file(name, content);
  }

  // team/
  const teamFolder = zip.folder('team')!;
  for (const { name, content } of readDir(path.join(DATA_DIR, 'team'))) {
    teamFolder.file(name, content);
  }

  // backup-info.json
  const tasks = Array.from(mdStore.tasks.values());
  const summary = {
    exportedAt: now.toISOString(),
    counts: {
      tasks: tasks.length,
      done: tasks.filter(t => t.status === 'done').length,
      progress: tasks.filter(t => t.status === 'progress').length,
      backlog: tasks.filter(t => t.status === 'backlog').length,
    },
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      assigneeId: t.assigneeId,
      projectId: t.projectId,
      created: t.created,
      due: t.due,
    })),
  };
  zip.file('backup-info.json', JSON.stringify(summary, null, 2));

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="mdi-backup-${dateStr}.zip"`,
      'Content-Length': String(uint8.byteLength),
    },
  });
}
