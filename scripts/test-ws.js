#!/usr/bin/env node
// MDI WebSocket 연결 테스트
// Usage: node scripts/test-ws.js [wsUrl] [memberId]
// Example: node scripts/test-ws.js wss://mdi.yourteam.com/ws shawn

const WebSocket = require('ws');

const wsUrl    = process.argv[2] || 'ws://localhost:3001/ws';
const memberId = process.argv[3] || 'test';
const TIMEOUT  = 10000;

let passed = 0;
let failed = 0;

function ok(msg)   { console.log(`  ✅ ${msg}`); passed++; }
function fail(msg) { console.log(`  ❌ ${msg}`); failed++; }
function info(msg) { console.log(`     ${msg}`); }

console.log('');
console.log('─────────────────────────────────────────');
console.log('  MDI WebSocket 연결 테스트');
console.log(`  URL      : ${wsUrl}`);
console.log(`  Member   : ${memberId}`);
console.log('─────────────────────────────────────────');

const timer = setTimeout(() => {
  fail(`타임아웃 (${TIMEOUT / 1000}s) — 서버 응답 없음`);
  printResult();
  process.exit(1);
}, TIMEOUT);

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  ok('TCP/WS 연결 성공');

  // Test 1: join
  info(`join 전송 → memberId: ${memberId}`);
  ws.send(JSON.stringify({ type: 'join', memberId }));
});

ws.on('message', (data) => {
  let msg;
  try { msg = JSON.parse(data.toString()); } catch { return; }

  if (msg.type === 'joined') {
    ok(`join 확인 응답 수신 (memberId: ${msg.memberId})`);

    // Test 2: activity update
    info('activity 업데이트 전송...');
    ws.send(JSON.stringify({ type: 'activity', text: 'WSS 테스트 중' }));

    setTimeout(() => {
      // Test 3: activity clear
      info('activity 초기화 전송...');
      ws.send(JSON.stringify({ type: 'activity', text: '' }));
      ok('activity 송수신 완료');

      // Done
      ws.close();
    }, 400);
  } else if (msg.type === 'pong') {
    ok('ping/pong 확인');
  }
});

ws.on('close', () => {
  clearTimeout(timer);
  printResult();
  process.exit(failed > 0 ? 1 : 0);
});

ws.on('error', (err) => {
  clearTimeout(timer);
  fail(`연결 실패 — ${err.message}`);
  console.log('');
  console.log('  확인 사항:');
  if (wsUrl.startsWith('wss://')) {
    console.log('   1. 도메인 A 레코드가 VPS IP로 설정되어 있는지');
    console.log('   2. SSL 인증서가 발급되었는지 (scripts/setup-vps.sh)');
    console.log('   3. docker compose가 실행 중인지: docker compose ps');
    console.log('   4. 443 포트 방화벽 개방 여부');
  } else {
    console.log('   1. 로컬 서버 실행 여부: npm run dev');
    console.log('   2. 포트 충돌 여부: lsof -i :3001');
  }
  printResult();
  process.exit(1);
});

function printResult() {
  console.log('');
  console.log('─────────────────────────────────────────');
  console.log(`  결과: ✅ ${passed}개 통과  ❌ ${failed}개 실패`);
  console.log('─────────────────────────────────────────');
  console.log('');
}
