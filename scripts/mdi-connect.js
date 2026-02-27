#!/usr/bin/env node
// scripts/mdi-connect.js
// Usage: node scripts/mdi-connect.js <memberId> [serverUrl]
// Example: node scripts/mdi-connect.js shawn ws://localhost:3001/ws

const WebSocket = require('ws');
const readline = require('readline');

const memberId = process.argv[2];
const serverUrl = process.argv[3] || 'ws://localhost:3001/ws';

if (!memberId) {
  console.error('Usage: node scripts/mdi-connect.js <memberId> [serverUrl]');
  process.exit(1);
}

let ws;
let reconnectDelay = 1000;

function connect() {
  ws = new WebSocket(serverUrl);

  ws.on('open', () => {
    console.log(`[MDI] Connected as ${memberId}`);
    reconnectDelay = 1000;
    ws.send(JSON.stringify({ type: 'join', memberId }));

    // Heartbeat every 25s
    const hb = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
    }, 25000);
    ws.once('close', () => clearInterval(hb));
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'task_assigned') {
        console.log(`[MDI] 📋 새 작업 배정: ${msg.task.title} (${msg.task.priority})`);
      }
      if (msg.type === 'task_review') {
        console.log(`[MDI] 👀 리뷰 요청: ${msg.task.title}`);
      }
      if (msg.type === 'notification') {
        console.log(`[MDI] 🔔 ${msg.message}`);
      }
    } catch {}
  });

  ws.on('close', () => {
    console.log(`[MDI] Disconnected. Reconnecting in ${reconnectDelay / 1000}s...`);
    setTimeout(connect, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
  });

  ws.on('error', (err) => {
    console.error('[MDI] WS error:', err.message);
  });
}

// Accept commands from stdin: "set <text>" or "clear"
const rl = readline.createInterface({ input: process.stdin, terminal: false });
rl.on('line', (line) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('set ')) {
    const text = trimmed.slice(4);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'activity', text }));
    }
  } else if (trimmed === 'clear') {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'activity', text: '' }));
    }
  }
});

connect();
