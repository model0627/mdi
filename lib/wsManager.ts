import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { mdStore } from './mdStore';

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
