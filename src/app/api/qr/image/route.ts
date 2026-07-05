import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { qrCodeId: true, paymentStatus: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const isPaid = user.paymentStatus === 'completed' || user.paymentStatus === 'paid' || user.paymentStatus === 'active';
  if (!isPaid) {
    return NextResponse.json({ error: 'Payment Required' }, { status: 402 });
  }

  if (!user.qrCodeId) {
    return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
  }

  // Use the request origin so the QR URL always matches the host the browser
  // is currently on (works for localhost AND LAN IP without env changes).
  const origin = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
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
