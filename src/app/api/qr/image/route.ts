import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { qrCodeId: true },
  });

  if (!user?.qrCodeId) {
    return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
  }

  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
  const host = req.headers.get('host') || req.nextUrl.host;
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || `${proto}://${host}`;
  const scanUrl = `${origin}/scan/${user.qrCodeId}`;

  const pngBuffer = await QRCode.toBuffer(scanUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    width: 300,
  });

  return new NextResponse(new Uint8Array(pngBuffer), {
    headers: {
      'Content-Type': 'image/png',
      // Cache for 1 hour on the client, revalidate in background — QR IDs rarely change
      'Cache-Control': 'private, no-cache',
    },
  });
}
