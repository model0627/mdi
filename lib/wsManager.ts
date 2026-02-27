import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { mdStore } from './mdStore';

const DATA_DIR = path.join(process.cwd(), 'data');
const ALLOWED_PREFIXES = ['tasks/', 'projects/', 'team/'];

interface AgentClient {
  memberId: string;
  ws: WebSocket;
  lastSeen: number;
}

class WSManager {
  private clients = new Map<string, AgentClient>(); // memberId → client
  private wss: WebSocketServer | null = null;
  initialized = false;

  init(wss: WebSocketServer) {
    if (this.initialized) return;
    this.initialized = true;
    this.wss = wss;

    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      // req used for future auth/query-param extraction
      void req;
      let memberId: string | null = null;

      ws.on('message', async (raw) => {
        try {
          const msg = JSON.parse(raw.toString());

          if (msg.type === 'join') {
            memberId = msg.memberId as string;
            this.clients.set(memberId, { memberId, ws, lastSeen: Date.now() });
            // Set member status to active
            await mdStore.updateMemberField(memberId, 'status', 'active');
            ws.send(JSON.stringify({ type: 'joined', memberId }));
          }

          if (msg.type === 'activity' && memberId) {
            await mdStore.updateMemberField(memberId, 'currentActivity', msg.text || '');
            this.clients.get(memberId)!.lastSeen = Date.now();
          }

          if (msg.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
            if (memberId) this.clients.get(memberId)!.lastSeen = Date.now();
          }

          // File sync: write file to data/ → chokidar picks up → SSE broadcast
          if (msg.type === 'file:sync' && msg.path && msg.content !== undefined) {
            const relPath = msg.path as string;
            const isAllowed = ALLOWED_PREFIXES.some(p => relPath.startsWith(p));
            if (isAllowed && relPath.endsWith('.md') && !relPath.includes('..')) {
              const fullPath = path.join(DATA_DIR, relPath);
              fs.mkdirSync(path.dirname(fullPath), { recursive: true });
              fs.writeFileSync(fullPath, msg.content as string, 'utf-8');
              ws.send(JSON.stringify({ type: 'file:synced', path: relPath }));
            }
          }

          if (msg.type === 'file:delete' && msg.path) {
            const relPath = msg.path as string;
            const isAllowed = ALLOWED_PREFIXES.some(p => relPath.startsWith(p));
            if (isAllowed && relPath.endsWith('.md') && !relPath.includes('..')) {
              const fullPath = path.join(DATA_DIR, relPath);
              if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
              ws.send(JSON.stringify({ type: 'file:deleted', path: relPath }));
            }
          }
        } catch {
          // ignore malformed messages
        }
      });

      ws.on('close', async () => {
        if (memberId) {
          this.clients.delete(memberId);
          // Auto-clear activity and set offline on disconnect
          await mdStore.updateMemberField(memberId, 'currentActivity', '');
          await mdStore.updateMemberField(memberId, 'status', 'offline');
        }
      });

      ws.on('error', () => {
        if (memberId) this.clients.delete(memberId);
      });
    });
  }

  // Push a notification to a specific member's Claude Code agent
  notify(memberId: string, event: object) {
    const client = this.clients.get(memberId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(event));
    }
  }

  // Broadcast to all connected agents
  broadcastToAgents(event: object) {
    const payload = JSON.stringify(event);
    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    }
  }

  getConnectedMembers(): string[] {
    return Array.from(this.clients.keys());
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __wsManager: WSManager | undefined;
}

export const wsManager = global.__wsManager ?? (global.__wsManager = new WSManager());
