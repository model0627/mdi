import path from 'path';
import fs from 'fs';
import type { Task, Project, Member } from './data';

// Dynamically import chokidar and gray-matter (Node.js only)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chokidar: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let matter: any;

const DATA_DIR = path.join(process.cwd(), 'data');

export interface SSEClient {
  id: string;
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
}

class MDStore {
  tasks = new Map<string, Task>();
  projects = new Map<string, Project>();
  members = new Map<string, Member>();
  clients = new Set<SSEClient>();
  initialized = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private watcher: any = null;
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // Lazy-load Node.js-only modules
    if (!chokidar) {
      chokidar = (await import('chokidar')).default;
    }
    if (!matter) {
      matter = (await import('gray-matter')).default;
    }

    // Initial scan
    this.scanDir(path.join(DATA_DIR, 'tasks'));
    this.scanDir(path.join(DATA_DIR, 'projects'));
    this.scanDir(path.join(DATA_DIR, 'team'));

    // Watch for changes
    this.watcher = chokidar.watch(DATA_DIR, {
      ignored: [/(^|[/\\])\../, /\.archive/],
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher
      .on('add', (fp: string) => this.scheduleParseFile(fp))
      .on('change', (fp: string) => this.scheduleParseFile(fp))
      .on('unlink', (fp: string) => this.handleUnlink(fp));
  }

  private scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (f.endsWith('.md')) {
        this.parseFile(path.join(dir, f));
      }
    }
  }

  private scheduleParseFile(filePath: string) {
    const existing = this.debounceTimers.get(filePath);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      this.debounceTimers.delete(filePath);
      this.parseFile(filePath);
    }, 150);
    this.debounceTimers.set(filePath, timer);
  }

  private parseFile(filePath: string) {
    if (!filePath.endsWith('.md')) return;
    if (!fs.existsSync(filePath)) return;

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(raw);

      const rel = path.relative(DATA_DIR, filePath);
      const segment = rel.split(path.sep)[0];

      if (segment === 'tasks') {
        const task = data as Task;
        if (!task.id) return;
        this.tasks.set(task.id, task);
        this.broadcast('task:update', task);
      } else if (segment === 'projects') {
        const project = data as Project;
        if (!project.id) return;
        this.projects.set(project.id, project);
        this.broadcast('project:update', project);
      } else if (segment === 'team') {
        const member = data as Member;
        if (!member.id) return;
        this.members.set(member.id, member);
        this.broadcast('member:update', member);
      }
    } catch (err) {
      console.error('[mdStore] parseFile error:', filePath, err);
    }
  }

  private handleUnlink(filePath: string) {
    const rel = path.relative(DATA_DIR, filePath);
    const segment = rel.split(path.sep)[0];
    const filename = path.basename(filePath, '.md');

    if (segment === 'tasks') {
      this.tasks.delete(filename);
      this.broadcast('task:delete', { id: filename });
    } else if (segment === 'projects') {
      this.projects.delete(filename);
      this.broadcast('project:delete', { id: filename });
    } else if (segment === 'team') {
      this.members.delete(filename);
      this.broadcast('member:delete', { id: filename });
    }
  }

  addClient(client: SSEClient) {
    this.clients.add(client);
  }

  removeClient(id: string) {
    for (const c of this.clients) {
      if (c.id === id) {
        this.clients.delete(c);
        break;
      }
    }
  }

  broadcast(event: string, data: unknown) {
    const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      try {
        client.controller.enqueue(client.encoder.encode(msg));
      } catch {
        this.clients.delete(client);
      }
    }
  }

  getAll() {
    return {
      tasks: Array.from(this.tasks.values()),
      projects: Array.from(this.projects.values()),
      members: Array.from(this.members.values()),
    };
  }

  writeTaskFile(task: Task) {
    const dir = path.join(DATA_DIR, 'tasks');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${task.id}.md`);

    // Determine body: new description > existing body > default placeholder
    let body = '\n\n## 설명\n\n';
    if (task.description) {
      body = `\n\n## 설명\n\n${task.description}\n`;
    } else if (fs.existsSync(filePath) && matter) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = matter(raw);
      if (parsed.content.trim()) {
        body = '\n' + parsed.content;
      }
    }

    // Strip description from frontmatter (it lives in body only)
    const { description: _desc, ...frontmatterTask } = task as Task & { description?: string };
    void _desc;

    const tmpPath = filePath + '.tmp';
    const content = buildFrontmatter(frontmatterTask as unknown as Record<string, unknown>) + body;
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, filePath);
  }

  writeTaskBodyContent(task: Task, bodyContent: string) {
    const dir = path.join(DATA_DIR, 'tasks');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${task.id}.md`);

    const { description: _desc, ...frontmatterTask } = task as Task & { description?: string };

    // If description not in task object, read existing ## 설명 section from file
    let descToWrite = _desc;
    if (!descToWrite && fs.existsSync(filePath) && matter) {
      const existing = matter(fs.readFileSync(filePath, 'utf-8')).content;
      const m = existing.match(/##\s*설명\s*\n+([\s\S]*?)(?=\n##\s|$)/);
      if (m) descToWrite = m[1].trim();
    }

    // Preserve description + append completion body (both must coexist)
    let body = '';
    if (descToWrite) body += `\n\n## 설명\n\n${descToWrite}\n`;
    if (bodyContent.trim()) body += '\n\n' + bodyContent + '\n';
    if (!body) body = '\n\n## 설명\n\n';

    const tmpPath = filePath + '.tmp';
    const content = buildFrontmatter(frontmatterTask as unknown as Record<string, unknown>) + body;
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, filePath);
  }

  async updateMemberField(memberId: string, field: string, value: string): Promise<void> {
    const filePath = path.join(DATA_DIR, 'team', `${memberId}.md`);
    if (!fs.existsSync(filePath)) return;

    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);
    data[field] = value;

    const output = matter.stringify(content, data);
    const tmp = filePath + '.tmp';
    fs.writeFileSync(tmp, output, 'utf-8');
    fs.renameSync(tmp, filePath);

    // 즉시 in-memory 업데이트 + SSE broadcast (chokidar 의존 제거)
    const updated = data as Member;
    if (updated.id) {
      this.members.set(updated.id, updated);
      this.broadcast('member:update', updated);
    }
  }

  writeMemberFile(member: Member) {
    const dir = path.join(DATA_DIR, 'team');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${member.id}.md`);
    const tmpPath = filePath + '.tmp';
    const content = buildFrontmatter(member as unknown as Record<string, unknown>) + '\n';
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, filePath);
  }

  writeProjectFile(project: Project) {
    const dir = path.join(DATA_DIR, 'projects');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${project.id}.md`);
    const tmpPath = filePath + '.tmp';
    const content = buildFrontmatter(project as unknown as Record<string, unknown>) + '\n';
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, filePath);
  }

  deleteMemberFile(id: string) {
    const filePath = path.join(DATA_DIR, 'team', `${id}.md`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  archiveTaskFile(id: string) {
    const src = path.join(DATA_DIR, 'tasks', `${id}.md`);
    const archiveDir = path.join(DATA_DIR, '.archive');
    if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
    const dst = path.join(archiveDir, `${id}.md`);
    if (fs.existsSync(src)) fs.renameSync(src, dst);
  }
}

function buildFrontmatter(obj: Record<string, unknown>): string {
  const lines = ['---'];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      lines.push(`${k}:`);
      for (const item of v) lines.push(`  - ${item}`);
    } else if (typeof v === 'number') {
      lines.push(`${k}: ${v}`);
    } else {
      lines.push(`${k}: "${v}"`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

declare global {
  // eslint-disable-next-line no-var
  var __mdStore: MDStore | undefined;
}

export const mdStore: MDStore =
  global.__mdStore ?? (global.__mdStore = new MDStore());
