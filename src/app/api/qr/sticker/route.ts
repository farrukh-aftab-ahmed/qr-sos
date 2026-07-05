import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateQRStickerSVG } from '@/lib/qr-generator';

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { qrCodeId: true, name: true, profileImage: true, paymentStatus: true },
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

  // Derive origin from the request so the QR URL matches the host the user
  // is currently on (works for localhost AND LAN IP without env changes).
  const { origin } = new URL(req.url);

  const svg = await generateQRStickerSVG({
    qrCodeId: user.qrCodeId,
    userName: user.name,
    profileImageUrl: user.profileImage || undefined,
    appUrl: origin,
  });

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Content-Disposition': 'attachment; filename="qr-sos-sticker.svg"',
      'Cache-Control': 'private, no-cache',
    },
  });
}
