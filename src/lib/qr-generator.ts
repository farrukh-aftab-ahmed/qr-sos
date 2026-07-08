import QRCode from 'qrcode';

export interface QRStickerOptions {
  qrCodeId: string;
  userName: string;
  profileImageUrl?: string;
  appUrl?: string;
  logoDataUrl?: string;
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
  const { qrCodeId, userName, appUrl, logoDataUrl } = options;
  const scanUrl = `${appUrl || process.env.NEXT_PUBLIC_APP_URL}/scan/${qrCodeId}`;

  const qrSvgString = await QRCode.toString(scanUrl, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' },
    width: 340,
  });

  const viewBoxMatch = qrSvgString.match(/viewBox="([^"]+)"/);
  const qrViewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 37 37';

  const qrInner = qrSvgString
    .replace(/<\?xml[^?]*\?>/g, '')
    .replace(/<!DOCTYPE[^>]*>/g, '')
    .replace(/<svg[^>]*>/g, '')
    .replace(/<\/svg>/g, '')
    .trim();

  // Card dimensions: 400 × 520
  // Logo  : x=155, y=18, w=90, h=84   (516:484 ≈ 1.07 ratio → 90×84)
  // URL   : x=20,  y=113, w=360, h=52  rx=26
  // QR    : x=16,  y=175, w=368, h=272 rx=18  (inner pad 14px)
  // Bar   : x=0,   y=447, w=400, h=73

  const logoSection = logoDataUrl
    ? `<circle cx="200" cy="60" r="40" fill="white"/>
       <image href="${logoDataUrl}"
               x="155" y="18" width="90" height="84"
               preserveAspectRatio="xMidYMid meet"/>`
    : `<circle cx="200" cy="60" r="40" fill="white"/>
       <circle cx="200" cy="60" r="42" fill="#1C3C70"/>
       <text x="200" y="72" text-anchor="middle"
             font-family="Arial Black,Arial,sans-serif" font-weight="900"
             font-size="28" fill="white">QR</text>
       <text x="200" y="93" text-anchor="middle"
             font-family="Arial Black,Arial,sans-serif" font-weight="900"
             font-size="16" fill="white" letter-spacing="3">SOS</text>`;

  // Layout (400×520, rx=18):
  //   16px red margin on ALL sides of the combined white+black card
  //   Logo       : y=18  h=84  → ends y=102
  //   URL pill   : y=112 h=52  → ends y=164
  //   Combined   : x=16  y=174 w=368 h=330 rx=14  → ends y=504  (16px red below)
  //     White QR : y=174 h=260 → ends y=434
  //     Black bar: y=434 h=70  → ends y=504  (clipped to combined shape)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="520" viewBox="0 0 400 520"
     xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <clipPath id="card">
      <rect width="400" height="520" rx="18" ry="18"/>
    </clipPath>
    <!-- clips the black bar to the combined white+black rounded rect -->
    <clipPath id="qrCard">
      <rect x="16" y="174" width="368" height="330" rx="14" ry="14"/>
    </clipPath>
  </defs>

  <g clip-path="url(#card)">

    <!-- ── Red background ── -->
    <rect width="400" height="520" fill="#C8102E"/>

    <!-- ── Logo ── -->
    ${logoSection}

    <!-- ── URL pill ── -->
    <rect x="20" y="112" width="360" height="52" rx="26" fill="#122040"/>
    <text x="200" y="144"
          text-anchor="middle"
          font-family="Arial, Helvetica, sans-serif"
          font-size="18" font-weight="700"
          fill="white" letter-spacing="0.3">https://qr-sos.online</text>

    <!-- ── Combined white+black card (16px red on all 4 sides) ── -->
    <!-- White QR area -->
    <rect x="16" y="174" width="368" height="330" rx="14" fill="white"/>
    <svg x="30" y="188" width="340" height="232" viewBox="${qrViewBox}">
      ${qrInner}
    </svg>

    <!-- Black bar clipped to the same rounded rect so bottom corners are rounded -->
    <g clip-path="url(#qrCard)">
      <rect x="16" y="434" width="368" height="70" fill="#111111"/>
      <text x="200" y="476"
            text-anchor="middle"
            font-family="Arial Black, Arial, sans-serif"
            font-size="20" font-weight="900"
            fill="white" letter-spacing="2">SCAN IN EMERGENCY</text>
    </g>

  </g>
</svg>`;
}
