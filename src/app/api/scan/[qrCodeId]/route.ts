import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { scanRateLimit } from '@/lib/redis';
import { sendQRScannedNotification } from '@/lib/notifications';
import { getClientIp } from '@/lib/utils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ qrCodeId: string }> }
) {
  const ip = getClientIp(req);
  const { success } = await scanRateLimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const session = await auth();
  const { qrCodeId } = await params;

  const scannedUser = await prisma.user.findUnique({
    where: { qrCodeId },
    include: {
      emergencyContacts: {
        where: { isPrimary: true },
        take: 1,
      },
    },
  });

  if (!scannedUser) {
    return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
  }

  if (!scannedUser.isActive) {
    return NextResponse.json({ error: 'This profile is deactivated' }, { status: 410 });
  }

  const isLoggedIn = !!session?.user?.id;
  const isSelfScan = isLoggedIn && session!.user!.id === scannedUser.id;

  // Log the scan (always — guest scans recorded with null scannerId)
  const scan = await prisma.qrScan.create({
    data: {
      scannedUserId: scannedUser.id,
      scannerId: isLoggedIn && !isSelfScan ? session!.user!.id : null,
      scannerIp: ip,
      userAgent: req.headers.get('user-agent') || undefined,
    },
  });

  // Notify owner (non-blocking, skip self-scans)
  if (!isSelfScan) {
    if (isLoggedIn) {
      const scanner = await prisma.user.findUnique({
        where: { id: session!.user!.id },
        select: { name: true, email: true, phone: true, profileImage: true, qrCodeId: true },
      });
      sendQRScannedNotification(scannedUser.id, {
        scannerName:    scanner?.name,
        scannerEmail:   scanner?.email,
        scannerPhone:   scanner?.phone,
        scannerImage:   scanner?.profileImage,
        scannerQrCodeId: scanner?.qrCodeId,
        scannerId:      session!.user!.id,
      }).catch(console.error);
    } else {
      // Guest scan — send IP so owner can see who viewed anonymously
      sendQRScannedNotification(scannedUser.id, { scannerIp: ip }).catch(console.error);
    }
  }

  const primaryContact = scannedUser.emergencyContacts[0];

  return NextResponse.json({
    scanId: scan.id,
    isGuest: !isLoggedIn,
    profile: {
      // Guests see phone + emergency contacts only — owner name/photo are private
      ...(isLoggedIn ? { name: scannedUser.name } : {}),
      phone: scannedUser.phone,
      profileImage: isLoggedIn ? scannedUser.profileImage : null,
      emergencyContact: primaryContact
        ? {
            // Guests see phone + relationship only — contact name is private
            ...(isLoggedIn ? { name: primaryContact.name } : {}),
            phone: primaryContact.phone,
            relationship: primaryContact.relationship,
          }
        : null,
    },
  });
}
