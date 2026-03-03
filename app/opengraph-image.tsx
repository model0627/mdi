import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'MDI Dashboard'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// 픽셀 블록 컴포넌트
function PixelBlock({ x, y, color, size = 8 }: { x: number; y: number; color: string; size?: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: color,
      }}
    />
  )
}

export default async function Image() {
  const bg = '#0d1117'
  const green = '#39d353'
  const dimGreen = '#196127'
  const teal = '#58a6ff'
  const orange = '#f0883e'
  const purple = '#bc8cff'
  const gray = '#30363d'
  const lightGray = '#8b949e'

  // 픽셀 오피스 캐릭터 (8x8 픽셀 맵) — 머리+몸통
  const charPixels: [number, number, string][] = [
    // 캐릭터1 (초록)
    [2,2,green],[3,2,green],[4,2,green], // 머리
    [2,3,green],[3,3,green],[4,3,green],
    [3,4,green], // 목
    [2,5,green],[3,5,green],[4,5,green], // 몸
    [2,6,green],[4,6,green], // 팔
    [3,7,green],[3,8,green], // 다리
  ]

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: bg,
          position: 'relative',
          overflow: 'hidden',
          fontFamily: '"Courier New", Courier, monospace',
        }}
      >
        {/* 배경 그리드 패턴 */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`v${i}`}
            style={{
              position: 'absolute',
              left: i * 60,
              top: 0,
              width: 1,
              height: '100%',
              backgroundColor: '#161b22',
            }}
          />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <div
            key={`h${i}`}
            style={{
              position: 'absolute',
              top: i * 63,
              left: 0,
              height: 1,
              width: '100%',
              backgroundColor: '#161b22',
            }}
          />
        ))}

        {/* 좌측 — 픽셀 오피스 씬 */}
        <div
          style={{
            position: 'absolute',
            left: 60,
            top: 60,
            width: 520,
            height: 510,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 픽셀 모니터 1 */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 80,
              width: 200,
              height: 150,
              border: `4px solid ${teal}`,
              backgroundColor: '#0d1117',
              display: 'flex',
              flexDirection: 'column',
              padding: 12,
            }}
          >
            <div style={{ color: teal, fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>TASKS</div>
            {['■ MD 파일 에디터', '■ setup.sh 수정', '■ reinvite 전환'].map((t, i) => (
              <div key={i} style={{ color: i < 2 ? dimGreen : green, fontSize: 10, marginBottom: 4, display: 'flex' }}>
                {t}
              </div>
            ))}
            <div style={{ marginTop: 'auto', display: 'flex', gap: 4 }}>
              {[green, green, dimGreen].map((c, i) => (
                <div key={i} style={{ width: 8, height: 8, backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* 픽셀 모니터 2 */}
          <div
            style={{
              position: 'absolute',
              left: 220,
              top: 80,
              width: 200,
              height: 150,
              border: `4px solid ${purple}`,
              backgroundColor: '#0d1117',
              display: 'flex',
              flexDirection: 'column',
              padding: 12,
            }}
          >
            <div style={{ color: purple, fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>TEAM</div>
            {['◆ shawn', '◆ jay', '◆ alex'].map((t, i) => (
              <div key={i} style={{ color: [green, teal, orange][i], fontSize: 10, marginBottom: 4, display: 'flex' }}>
                {t}
              </div>
            ))}
            <div style={{ marginTop: 'auto', display: 'flex', gap: 4 }}>
              {[green, teal, orange].map((c, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* 책상 */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 246,
              width: 440,
              height: 12,
              backgroundColor: gray,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 258,
              width: 440,
              height: 6,
              backgroundColor: '#21262d',
            }}
          />

          {/* 픽셀 캐릭터들 (책상 앞) */}
          {/* 캐릭터 1 — 초록 */}
          {[
            [80, 280, green], [88, 280, green], [96, 280, green],
            [80, 288, green], [88, 288, green], [96, 288, green],
            [88, 296, green],
            [80, 304, green], [88, 304, green], [96, 304, green],
            [80, 312, green], [96, 312, green],
            [88, 320, green], [88, 328, green],
          ].map(([x, y, c], i) => (
            <div key={`c1_${i}`} style={{ position: 'absolute', left: x as number, top: y as number, width: 8, height: 8, backgroundColor: c as string }} />
          ))}

          {/* 캐릭터 2 — 파랑 */}
          {[
            [240, 280, teal], [248, 280, teal], [256, 280, teal],
            [240, 288, teal], [248, 288, teal], [256, 288, teal],
            [248, 296, teal],
            [240, 304, teal], [248, 304, teal], [256, 304, teal],
            [240, 312, teal], [256, 312, teal],
            [248, 320, teal], [248, 328, teal],
          ].map(([x, y, c], i) => (
            <div key={`c2_${i}`} style={{ position: 'absolute', left: x as number, top: y as number, width: 8, height: 8, backgroundColor: c as string }} />
          ))}

          {/* 캐릭터 3 — 오렌지 */}
          {[
            [360, 280, orange], [368, 280, orange], [376, 280, orange],
            [360, 288, orange], [368, 288, orange], [376, 288, orange],
            [368, 296, orange],
            [360, 304, orange], [368, 304, orange], [376, 304, orange],
            [360, 312, orange], [376, 312, orange],
            [368, 320, orange], [368, 328, orange],
          ].map(([x, y, c], i) => (
            <div key={`c3_${i}`} style={{ position: 'absolute', left: x as number, top: y as number, width: 8, height: 8, backgroundColor: c as string }} />
          ))}

          {/* 바닥선 */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 380,
              width: 440,
              height: 3,
              backgroundColor: gray,
            }}
          />

          {/* 창문 (왼쪽 상단) */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 100,
              height: 60,
              border: `3px solid ${gray}`,
              display: 'flex',
            }}
          >
            <div style={{ flex: 1, borderRight: `2px solid ${gray}`, backgroundColor: '#1a2744' }} />
            <div style={{ flex: 1, backgroundColor: '#1a2744' }} />
          </div>

          {/* 화분 */}
          <div
            style={{
              position: 'absolute',
              left: 430,
              top: 220,
              width: 20,
              height: 20,
              backgroundColor: '#6e4a2c',
              border: `2px solid #4a3020`,
            }}
          />
          {[
            [434, 204, dimGreen], [442, 200, green], [438, 196, green],
            [430, 208, dimGreen],
          ].map(([x, y, c], i) => (
            <div key={`plant_${i}`} style={{ position: 'absolute', left: x as number, top: y as number, width: 8, height: 8, backgroundColor: c as string }} />
          ))}
        </div>

        {/* 우측 — 텍스트 + 스탯 */}
        <div
          style={{
            position: 'absolute',
            right: 60,
            top: 60,
            width: 500,
            height: 510,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* MDI 픽셀 로고 텍스트 */}
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: green,
              letterSpacing: -2,
              lineHeight: 1,
              textShadow: `4px 4px 0px ${dimGreen}`,
              display: 'flex',
            }}
          >
            MDI
          </div>

          {/* 픽셀 구분선 */}
          <div style={{ display: 'flex', gap: 4, marginTop: 16, marginBottom: 20 }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} style={{ width: 16, height: 4, backgroundColor: i % 3 === 0 ? green : dimGreen }} />
            ))}
          </div>

          <div
            style={{
              fontSize: 20,
              color: lightGray,
              letterSpacing: 4,
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            Team Dashboard
          </div>

          {/* 스탯 카드들 */}
          <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
            {[
              { label: 'TASKS', value: '12', color: green },
              { label: 'TEAM', value: '4', color: teal },
              { label: 'DONE', value: '8', color: purple },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  border: `2px solid ${color}`,
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ color: lightGray, fontSize: 10, letterSpacing: 3, marginBottom: 6 }}>{label}</div>
                <div style={{ color, fontSize: 32, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* URL */}
          <div
            style={{
              marginTop: 48,
              color: dimGreen,
              fontSize: 14,
              letterSpacing: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ width: 8, height: 8, backgroundColor: green }} />
            mdi-gamma.vercel.app
          </div>
        </div>

        {/* 상단 픽셀 장식 바 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 6,
            backgroundColor: green,
            display: 'flex',
          }}
        />

        {/* 하단 픽셀 장식 바 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 3,
            backgroundColor: dimGreen,
            display: 'flex',
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
