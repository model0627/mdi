import path from 'path';
import fs from 'fs';
import type { Task, Project, Member } from './data';

// Dynamically imported (Node.js only)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chokidar: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let matter: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _blobPut: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _blobList: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _blobDel: any;

const IS_VERCEL = process.env.VERCEL === '1';
// Local data dir (used for local dev + initial blob seeding)
const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');

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

    if (!matter) {
      matter = (await import('gray-matter')).default;
    }

    if (IS_VERCEL) {
      // ── Vercel Blob mode ──────────────────────────────────────
      const blobModule = await import('@vercel/blob');
      _blobPut = blobModule.put;
      _blobList = blobModule.list;
      _blobDel = blobModule.del;

      // Seed Blob from bundle if team data is missing (first deploy)
      const { blobs: teamBlobs } = await _blobList({ prefix: 'team/' });
      if (teamBlobs.length === 0) {
        await this.seedBlobFromBundle();
      }

      // Load all data into in-memory cache
      await this.scanBlob('tasks');
      await this.scanBlob('projects');
      await this.scanBlob('team');
    } else {
      // ── Local filesystem mode ──────────────────────────────────
      if (!chokidar) {
        chokidar = (await import('chokidar')).default;
      }

      this.scanDir(path.join(LOCAL_DATA_DIR, 'tasks'));
      this.scanDir(path.join(LOCAL_DATA_DIR, 'projects'));
      this.scanDir(path.join(LOCAL_DATA_DIR, 'team'));

      this.watcher = chokidar.watch(LOCAL_DATA_DIR, {
        ignored: [/(^|[/\\])\../, /\.archive/],
        persistent: true,
        ignoreInitial: true,
      });

      this.watcher
        .on('add', (fp: string) => this.scheduleParseFile(fp))
        .on('change', (fp: string) => this.scheduleParseFile(fp))
        .on('unlink', (fp: string) => this.handleUnlink(fp));
    }
  }

  // ─── Blob helpers ────────────────────────────────────────────

  private async seedBlobFromBundle() {
    for (const segment of ['tasks', 'projects', 'team'] as const) {
      const dir = path.join(LOCAL_DATA_DIR, segment);
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith('.md')) continue;
        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
        await _blobPut(`${segment}/${file}`, content, {
          access: 'public',
          addRandomSuffix: false,
          cacheControlMaxAge: 0,
        });
      }
    }
  }

  private async scanBlob(segment: string) {
    const allBlobs: Array<{ url: string; pathname: string }> = [];
    let cursor: string | undefined;

    do {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await _blobList({ prefix: `${segment}/`, cursor });
      allBlobs.push(...result.blobs);
      cursor = result.cursor;
      if (!result.hasMore) break;
    } while (cursor);

    for (const blob of allBlobs) {
      if (!blob.pathname.endsWith('.md')) continue;
      const res = await fetch(blob.url, { cache: 'no-store' });
      if (!res.ok) continue;
      const raw = await res.text();
      this.parseRaw(raw, segment);
    }
  }

  private parseRaw(raw: string, segment: string) {
    try {
      const { data } = matter(raw);
      if (segment === 'tasks') {
        const task = data as Task;
        if (!task.id) return;
        this.tasks.set(task.id, task);
      } else if (segment === 'projects') {
        const project = data as Project;
        if (!project.id) return;
        this.projects.set(project.id, project);
      } else if (segment === 'team') {
        const member = data as Member;
        if (!member.id) return;
        this.members.set(member.id, member);
      }
    } catch (err) {
      console.error('[mdStore] parseRaw error:', err);
    }
  }

  private async blobPutFile(pathname: string, content: string) {
    await _blobPut(pathname, content, {
      access: 'public',
      addRandomSuffix: false,
      cacheControlMaxAge: 0,
    });
  }

  private async blobReadFile(pathname: string): Promise<string | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { blobs } = await _blobList({ prefix: pathname });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const match = blobs.find((b: any) => b.pathname === pathname);
    if (!match) return null;
    const res = await fetch(match.url, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.text();
  }

  // ─── Filesystem helpers (local dev) ─────────────────────────

  private scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.md')) this.parseFile(path.join(dir, f));
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
      const rel = path.relative(LOCAL_DATA_DIR, filePath);
      const segment = rel.split(path.sep)[0];

      this.parseRaw(raw, segment);

      if (segment === 'tasks') {
        const task = data as Task;
        if (task.id) this.broadcast('task:update', task);
      } else if (segment === 'projects') {
        const project = data as Project;
        if (project.id) this.broadcast('project:update', project);
      } else if (segment === 'team') {
        const member = data as Member;
        if (member.id) this.broadcast('member:update', member);
      }
    } catch (err) {
      console.error('[mdStore] parseFile error:', filePath, err);
    }
  }

  private handleUnlink(filePath: string) {
    const rel = path.relative(LOCAL_DATA_DIR, filePath);
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

  // ─── SSE ────────────────────────────────────────────────────

  addClient(client: SSEClient) {
    this.clients.add(client);
  }

  removeClient(id: string) {
    for (const c of this.clients) {
      if (c.id === id) { this.clients.delete(c); break; }
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

  // ─── Write: Task ─────────────────────────────────────────────

  async writeTaskFile(task: Task): Promise<void> {
    const { description: _desc, ...frontmatterTask } = task as Task & { description?: string };
    const body = _desc ? `\n\n## 설명\n\n${_desc}\n` : '\n\n## 설명\n\n';
    const content = buildFrontmatter(frontmatterTask as unknown as Record<string, unknown>) + body;

    if (IS_VERCEL) {
      await this.blobPutFile(`tasks/${task.id}.md`, content);
    } else {
      const dir = path.join(LOCAL_DATA_DIR, 'tasks');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, `${task.id}.md`);
      const tmp = filePath + '.tmp';
      fs.writeFileSync(tmp, content, 'utf8');
      fs.renameSync(tmp, filePath);
    }
  }

  async writeTaskBodyContent(task: Task, bodyContent: string): Promise<void> {
    const { description: _desc, ...frontmatterTask } = task as Task & { description?: string };

    let descToWrite = _desc;
    if (!descToWrite && !IS_VERCEL) {
      const filePath = path.join(LOCAL_DATA_DIR, 'tasks', `${task.id}.md`);
      if (fs.existsSync(filePath)) {
        const existing = matter(fs.readFileSync(filePath, 'utf-8')).content;
        const m = existing.match(/##\s*설명\s*\n+([\s\S]*?)(?=\n##\s|$)/);
        if (m) descToWrite = m[1].trim();
      }
    }

    let body = '';
    if (descToWrite) body += `\n\n## 설명\n\n${descToWrite}\n`;
    if (bodyContent.trim()) body += '\n\n' + bodyContent + '\n';
    if (!body) body = '\n\n## 설명\n\n';

    const content = buildFrontmatter(frontmatterTask as unknown as Record<string, unknown>) + body;

    if (IS_VERCEL) {
      await this.blobPutFile(`tasks/${task.id}.md`, content);
    } else {
      const dir = path.join(LOCAL_DATA_DIR, 'tasks');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, `${task.id}.md`);
      const tmp = filePath + '.tmp';
      fs.writeFileSync(tmp, content, 'utf8');
      fs.renameSync(tmp, filePath);
    }
  }

  async readTaskBody(id: string): Promise<string> {
    if (IS_VERCEL) {
      const raw = await this.blobReadFile(`tasks/${id}.md`);
      if (!raw) return '';
      return matter(raw).content.trim();
    } else {
      const filePath = path.join(LOCAL_DATA_DIR, 'tasks', `${id}.md`);
      if (!fs.existsSync(filePath)) return '';
      return matter(fs.readFileSync(filePath, 'utf-8')).content.trim();
    }
  }

  // ─── Write: Member ───────────────────────────────────────────

  async updateMemberField(memberId: string, field: string, value: string): Promise<void> {
    if (IS_VERCEL) {
      const raw = await this.blobReadFile(`team/${memberId}.md`) ?? '';
      const { data, content } = matter(raw);
      data[field] = value;
      const output = matter.stringify(content, data);
      await this.blobPutFile(`team/${memberId}.md`, output);
      const updated = data as Member;
      if (updated.id) {
        this.members.set(updated.id, updated);
        this.broadcast('member:update', updated);
      }
    } else {
      const filePath = path.join(LOCAL_DATA_DIR, 'team', `${memberId}.md`);
      if (!fs.existsSync(filePath)) return;
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);
      data[field] = value;
      const output = matter.stringify(content, data);
      const tmp = filePath + '.tmp';
      fs.writeFileSync(tmp, output, 'utf-8');
      fs.renameSync(tmp, filePath);
      const updated = data as Member;
      if (updated.id) {
        this.members.set(updated.id, updated);
        this.broadcast('member:update', updated);
      }
    }
  }

  async writeMemberFile(member: Member): Promise<void> {
    const content = buildFrontmatter(member as unknown as Record<string, unknown>) + '\n';
    if (IS_VERCEL) {
      await this.blobPutFile(`team/${member.id}.md`, content);
    } else {
      const dir = path.join(LOCAL_DATA_DIR, 'team');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, `${member.id}.md`);
      const tmp = filePath + '.tmp';
      fs.writeFileSync(tmp, content, 'utf8');
      fs.renameSync(tmp, filePath);
    }
  }

  deleteMemberFile(id: string): void {
    if (IS_VERCEL) {
      _blobList({ prefix: `team/${id}.md` })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ blobs }: { blobs: any[] }) => {
          if (blobs.length > 0) _blobDel(blobs.map((b: { url: string }) => b.url));
        })
        .catch(console.error);
    } else {
      const filePath = path.join(LOCAL_DATA_DIR, 'team', `${id}.md`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }

  // ─── Write: Project ──────────────────────────────────────────

  writeProjectFile(project: Project): void {
    const content = buildFrontmatter(project as unknown as Record<string, unknown>) + '\n';
    if (IS_VERCEL) {
      this.blobPutFile(`projects/${project.id}.md`, content).catch(console.error);
    } else {
      const dir = path.join(LOCAL_DATA_DIR, 'projects');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, `${project.id}.md`);
      const tmp = filePath + '.tmp';
      fs.writeFileSync(tmp, content, 'utf8');
      fs.renameSync(tmp, filePath);
    }
  }

  archiveTaskFile(id: string): void {
    if (IS_VERCEL) {
      this.blobReadFile(`tasks/${id}.md`)
        .then(async (raw) => {
          if (!raw) return;
          await this.blobPutFile(`.archive/${id}.md`, raw);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { blobs } = await _blobList({ prefix: `tasks/${id}.md` });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const match = blobs.find((b: any) => b.pathname === `tasks/${id}.md`);
          if (match) await _blobDel(match.url);
        })
        .catch(console.error);
    } else {
      const src = path.join(LOCAL_DATA_DIR, 'tasks', `${id}.md`);
      const archiveDir = path.join(LOCAL_DATA_DIR, '.archive');
      if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
      if (fs.existsSync(src)) fs.renameSync(src, path.join(archiveDir, `${id}.md`));
    }
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
