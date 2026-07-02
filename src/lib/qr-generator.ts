import QRCode from 'qrcode';

export interface QRStickerOptions {
  qrCodeId: string;
  userName: string;
  profileImageUrl?: string;
  appUrl?: string;
}

export async function generateQRDataURL(qrCodeId: string, appUrl?: string): Promise<string> {
  const scanUrl = `${appUrl || process.env.NEXT_PUBLIC_APP_URL}/scan/${qrCodeId}`;
  return QRCode.toDataURL(scanUrl, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
    width: 300,
  });
}

export async function generateQRStickerSVG(options: QRStickerOptions): Promise<string> {
  const { qrCodeId, userName, appUrl } = options;
  const scanUrl = `${appUrl || process.env.NEXT_PUBLIC_APP_URL}/scan/${qrCodeId}`;

  const qrSvgString = await QRCode.toString(scanUrl, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    color: { dark: '#0A0A0F', light: '#FFFFFF' },
    width: 200,
  });

  const viewBoxMatch = qrSvgString.match(/viewBox="([^"]+)"/);
  const qrViewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 37 37';

  const qrInner = qrSvgString
    .replace(/<\?xml[^?]*\?>/g, '')
    .replace(/<!DOCTYPE[^>]*>/g, '')
    .replace(/<svg[^>]*>/g, '')
    .replace(/<\/svg>/g, '')
    .trim();

  const firstName = userName.split(' ')[0];
  const displayId = qrCodeId.slice(-6).toUpperCase();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="520" viewBox="0 0 400 520"
     xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>

    <!-- Card background -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   style="stop-color:#0d0d14"/>
      <stop offset="100%" style="stop-color:#160a28"/>
    </linearGradient>

    <!-- SOS icon / title fill -->
    <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   style="stop-color:#FF2D55"/>
      <stop offset="100%" style="stop-color:#FF6B35"/>
    </linearGradient>

    <!--
      BORDER GRADIENT  — top-to-bottom so the top edge is a UNIFORM bright red
      and the bottom edge is a uniform orange.  A horizontal gradient would make
      the left side red and the right side yellow, which looks asymmetric.
    -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   style="stop-color:#FF2D55"/>
      <stop offset="60%"  style="stop-color:#FF6B35"/>
      <stop offset="100%" style="stop-color:#cc4a1a"/>
    </linearGradient>

    <!-- Glow for title / SOS icon -->
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>

    <!-- Drop-shadow for QR white card -->
    <filter id="qrShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="3" stdDeviation="10"
                    flood-color="#FF2D55" flood-opacity="0.2"/>
    </filter>

    <!--
      TOP ACCENT clip — clip the red bar to the exact card shape so its
      top corners perfectly follow the outer card's rx=24 curve.
    -->
    <clipPath id="cardClip">
      <rect x="0" y="0" width="400" height="520" rx="24" ry="24"/>
    </clipPath>

  </defs>

  <!-- ════════════════════════════════════════════════════════
       CARD  —  two-fill-rects border technique
       Outer (rx=24) filled with border gradient → 4 px ring visible.
       Inner (rx=20, inset 4 px) filled with dark background.
       No stroke used, so nothing clips at the SVG viewport edge.
  ═════════════════════════════════════════════════════════════ -->
  <rect x="0" y="0" width="400" height="520" rx="24" ry="24" fill="url(#borderGrad)"/>
  <rect x="4" y="4" width="392" height="512" rx="20" ry="20" fill="url(#bgGrad)"/>

  <!--
    TOP ACCENT BAR — drawn AFTER the background, clipped to the outer card
    shape so its top corners are perfectly rounded and match the card.
    Height 8 px creates a clear top accent without dominating.
  -->
  <rect x="0" y="0" width="400" height="8" fill="url(#redGrad)"
        clip-path="url(#cardClip)"/>

  <!-- ═════════════
       SOS ICON
  ══════════════ -->
  <g transform="translate(200, 64)">
    <circle cx="0" cy="0" r="38" fill="none" stroke="#FF2D55" stroke-width="1" opacity="0.18"/>
    <circle cx="0" cy="0" r="28" fill="none" stroke="#FF2D55" stroke-width="1" opacity="0.36"/>
    <circle cx="0" cy="0" r="20" fill="url(#redGrad)" filter="url(#glow)"/>
    <rect x="-2.5" y="-10" width="5"  height="20" rx="2" fill="white"/>
    <rect x="-10"  y="-2.5" width="20" height="5" rx="2" fill="white"/>
  </g>

  <!-- ═════════════
       TITLE
  ══════════════ -->
  <text x="200" y="122"
        text-anchor="middle"
        font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="26"
        fill="url(#redGrad)" filter="url(#glow)" letter-spacing="6">QR-SOS</text>
  <text x="200" y="142"
        text-anchor="middle"
        font-family="Arial, sans-serif" font-size="9"
        fill="#666666" letter-spacing="4">EMERGENCY IDENTIFICATION</text>

  <!-- ════════════════════════════════════════════════════════
       QR CODE CARD  —  same two-fill-rects technique
       Outer (rx=18, borderGrad) + Inner (rx=15, white, inset 2 px).
  ═════════════════════════════════════════════════════════════ -->
  <g transform="translate(88, 158)">
    <rect x="0" y="0" width="224" height="224" rx="18" ry="18"
          fill="url(#borderGrad)" filter="url(#qrShadow)"/>
    <rect x="2" y="2" width="220" height="220" rx="16" ry="16" fill="white"/>
    <!--
      Nested SVG keeps the qrcode library's viewBox (e.g. "0 0 41 41").
      196×196 px display area with 12 px padding on each side.
    -->
    <svg x="12" y="12" width="200" height="200" viewBox="${qrViewBox}">
      ${qrInner}
    </svg>
  </g>

  <!-- ═════════════
       SCAN BADGE
  ══════════════ -->
  <g transform="translate(200, 404)">
    <rect x="-108" y="-15" width="216" height="30" rx="15" ry="15"
          fill="rgba(255,45,85,0.10)"
          stroke="#FF2D55" stroke-width="1" stroke-dasharray="4,3"/>
    <text text-anchor="middle" y="5"
          font-family="Arial, sans-serif" font-size="10"
          fill="#FF6B35" letter-spacing="2.5">SCAN IN EMERGENCY</text>
  </g>

  <!-- Divider -->
  <line x1="60" y1="424" x2="340" y2="424"
        stroke="rgba(255,255,255,0.06)" stroke-width="1"/>

  <!-- ═════════════
       NAME + ID
  ══════════════ -->
  <text x="200" y="450"
        text-anchor="middle"
        font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="19"
        fill="white">${firstName.toUpperCase()}</text>

  <text x="200" y="470"
        text-anchor="middle"
        font-family="Courier New, monospace" font-size="10"
        fill="#484848" letter-spacing="2">ID: ${displayId}</text>

  <text x="200" y="490"
        text-anchor="middle"
        font-family="Arial, sans-serif" font-size="9"
        fill="#3a3a3a" letter-spacing="1">qr-sos.com</text>

  <!-- ═════════════
       CORNER BRACKETS
  ══════════════ -->
  <g fill="none" stroke="#FF2D55" stroke-width="2" opacity="0.4">
    <path d="M20,20 L20,36 M20,20 L36,20"/>
    <path d="M380,20 L364,20 M380,20 L380,36"/>
    <path d="M20,500 L20,484 M20,500 L36,500"/>
    <path d="M380,500 L364,500 M380,500 L380,484"/>
  </g>

</svg>`;
}
