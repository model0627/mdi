const WebSocket = require('ws');
const ws = new WebSocket('ws://192.168.130.36:3001/ws');
let joined = false;

ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'join', memberId: '__sync__' }));
});

ws.on('message', (d) => {
  const msg = JSON.parse(d.toString());
  console.log('수신:', JSON.stringify(msg));
  if (msg.type === 'joined' && !joined) {
    joined = true;
    ws.send(JSON.stringify({
      type: 'file:sync',
      path: 'tasks/T-SYNC-TEST.md',
      content: '---\nid: T-SYNC-TEST\ntitle: WS 싱크 테스트\nstatus: progress\npriority: low\nprojectId: mdi\nassigneeId: shawn\ncreated: 2026-02-27\n---\n'
    }));
    console.log('→ file:sync 전송');
  }
  if (msg.type === 'file:synced' || msg.type === 'error') {
    ws.close();
    process.exit(0);
  }
});

ws.on('error', (e) => console.log('WS 오류:', e.message));
setTimeout(() => { console.log('타임아웃 — 응답 없음'); process.exit(1); }, 6000);
