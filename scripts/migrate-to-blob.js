#!/usr/bin/env node
/**
 * migrate-to-blob.js
 *
 * 로컬 data/ 폴더의 .md 파일들을 Vercel Blob으로 일괄 업로드.
 * 최초 1회 실행 후에는 mdStore가 자동으로 Blob을 사용합니다.
 *
 * 사용법:
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_xxx node scripts/migrate-to-blob.js
 *
 * Vercel 대시보드 → Storage → Blob → 토큰 확인
 */

const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SEGMENTS = ['tasks', 'projects', 'team'];

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN 환경변수가 없습니다.');
    console.error('   Vercel 대시보드 → Storage → Blob → Show secret → 복사');
    process.exit(1);
  }

  let total = 0;
  for (const segment of SEGMENTS) {
    const dir = path.join(DATA_DIR, segment);
    if (!fs.existsSync(dir)) {
      console.log(`⏭  ${segment}/ 없음, 건너뜀`);
      continue;
    }

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      const pathname = `${segment}/${file}`;
      await put(pathname, content, {
        access: 'public',
        addRandomSuffix: false,
        cacheControlMaxAge: 0,
      });
      console.log(`✅ 업로드: ${pathname}`);
      total++;
    }
  }

  console.log(`\n완료: ${total}개 파일 업로드`);
}

main().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
