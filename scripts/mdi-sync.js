#!/usr/bin/env node
/**
 * MDI Data Sync — 로컬 data/ 변경을 WebSocket으로 서버에 즉시 반영
 *
 * Usage:
 *   node scripts/mdi-sync.js [serverUrl]
 *   node scripts/mdi-sync.js ws://192.168.130.36:3001/ws
 *
 * 실행하면 data/ 디렉토리를 감시하다가 변경이 생길 때마다
 * 서버로 파일을 전송합니다. git pull 없이 즉시 반영됩니다.
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const SERVER_URL = process.argv[2] || 'ws://192.168.130.36:80/ws';
const DATA_DIR = path.resolve(__dirname, '../data');
const RECONNECT_DELAY = 3000;

let ws = null;
let watcher = null;
let ready = false;
const pendingQueue = [];

function log(msg) {
  console.log(`[mdi-sync] ${new Date().toLocaleTimeString()} ${msg}`);
}

function send(msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  } else {
    pendingQueue.push(msg);
  }
}

function flushQueue() {
  while (pendingQueue.length > 0 && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(pendingQueue.shift()));
  }
}

function relPath(fullPath) {
  return path.relative(DATA_DIR, fullPath).replace(/\\/g, '/');
}

function isAllowed(fp) {
  if (!fp.endsWith('.md')) return false;
  if (fp.includes('..')) return false;
  if (fp.startsWith('.archive')) return false;
  return fp.startsWith('tasks/') || fp.startsWith('projects/') || fp.startsWith('team/');
}

function syncFile(fullPath) {
  const rel = relPath(fullPath);
  if (!isAllowed(rel)) return;
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    send({ type: 'file:sync', path: rel, content });
    log(`→ sync  ${rel}`);
  } catch {
    // file may have been deleted right after change event
  }
}

function deleteFile(fullPath) {
  const rel = relPath(fullPath);
  if (!isAllowed(rel)) return;
  send({ type: 'file:delete', path: rel });
  log(`→ delete ${rel}`);
}

async function startWatcher() {
  const { default: chokidar } = await import('chokidar');
  watcher = chokidar.watch(DATA_DIR, {
    ignored: [/(^|[/\\])\./, /\.archive/],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
  });

  watcher
    .on('add',    fp => syncFile(fp))
    .on('change', fp => syncFile(fp))
    .on('unlink', fp => deleteFile(fp));

  log(`Watching ${DATA_DIR}`);
}

function connect() {
  ws = new WebSocket(SERVER_URL);

  ws.on('open', () => {
    ready = true;
    log(`Connected → ${SERVER_URL}`);
    ws.send(JSON.stringify({ type: 'join', memberId: '__sync__' }));
    flushQueue();
  });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'file:synced')  log(`✅ synced  ${msg.path}`);
      if (msg.type === 'file:deleted') log(`✅ deleted ${msg.path}`);
    } catch { /* ignore */ }
  });

  ws.on('close', () => {
    ready = false;
    log(`Disconnected. Reconnecting in ${RECONNECT_DELAY / 1000}s...`);
    setTimeout(connect, RECONNECT_DELAY);
  });

  ws.on('error', (err) => {
    log(`Error: ${err.message}`);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  log('Shutting down...');
  if (watcher) watcher.close();
  if (ws) ws.close();
  process.exit(0);
});

(async () => {
  log(`MDI Data Sync starting...`);
  log(`Server : ${SERVER_URL}`);
  log(`Data   : ${DATA_DIR}`);
  await startWatcher();
  connect();
})();
