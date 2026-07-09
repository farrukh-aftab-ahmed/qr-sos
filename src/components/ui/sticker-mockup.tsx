'use client';

import { useId } from 'react';

// Deterministic 15×15 mock QR grid with proper finder patterns
const buildMockQR = (): boolean[] => {
  const N = 15;
  const grid: boolean[] = Array(N * N).fill(false);

  const set = (r: number, c: number, v: boolean) => {
    if (r >= 0 && r < N && c >= 0 && c < N) grid[r * N + c] = v;
  };

  // Draw a 7×7 finder pattern with top-left corner at (r, c)
  const finder = (r: number, c: number) => {
    for (let dr = 0; dr < 7; dr++) {
      for (let dc = 0; dc < 7; dc++) {
        const outer = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        set(r + dr, c + dc, outer || inner);
      }
    }
  };

  finder(0, 0);   // top-left
  finder(0, 8);   // top-right
  finder(8, 0);   // bottom-left

  // Fill data area with deterministic pattern
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const inTopLeft     = r < 8 && c < 8;
      const inTopRight    = r < 8 && c >= 7;
      const inBottomLeft  = r >= 7 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;
      set(r, c, (r * 7 + c * 13 + 3) % 11 > 4);
    }
  }

  return grid;
};

const MOCK_QR = buildMockQR();
const QR_N = 15;

interface StickerMockupProps {
  className?: string;
}

export function StickerMockup({ className = '' }: StickerMockupProps) {
  const uid = useId().replace(/:/g, '-');
  const cardClip  = `card-${uid}`;
  const innerClip = `inner-${uid}`;

  return (
    <svg
      viewBox="0 0 400 628"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        <clipPath id={cardClip}>
          <rect width="400" height="628" rx="18" ry="18" />
        </clipPath>
        <clipPath id={innerClip}>
          <rect x="16" y="174" width="368" height="438" rx="14" ry="14" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${cardClip})`}>
        {/* Red background */}
        <rect width="400" height="628" fill="#C8102E" />

        {/* White circle + logo */}
        <circle cx="200" cy="60" r="40" fill="white" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <image
          href="/logo.png"
          x="155" y="18" width="90" height="84"
          preserveAspectRatio="xMidYMid meet"
        />

        {/* URL pill */}
        <rect x="20" y="112" width="360" height="52" rx="26" fill="#122040" />
        <text
          x="200" y="144"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="18" fontWeight="700"
          fill="white"
        >
          https://qr-sos.online
        </text>

        {/* White card */}
        <rect x="16" y="174" width="368" height="438" rx="14" fill="white" />

        {/* Mock QR — 15×15 grid rendered in a 340×340 nested viewport */}
        <svg x="30" y="188" width="340" height="340" viewBox={`0 0 ${QR_N} ${QR_N}`}>
          {MOCK_QR.map((dark, i) =>
            dark ? (
              <rect
                key={i}
                x={(i % QR_N) + 0.05}
                y={Math.floor(i / QR_N) + 0.05}
                width="0.9"
                height="0.9"
                fill="#111111"
              />
            ) : null
          )}
        </svg>

        {/* Black bar (clipped to inner card shape) */}
        <g clipPath={`url(#${innerClip})`}>
          <rect x="16" y="542" width="368" height="70" fill="#111111" />
          <text
            x="200" y="584"
            textAnchor="middle"
            fontFamily="Arial Black, Arial, sans-serif"
            fontSize="20" fontWeight="900"
            fill="white" letterSpacing="2"
          >
            SCAN IN EMERGENCY
          </text>
        </g>
      </g>
    </svg>
  );
}
