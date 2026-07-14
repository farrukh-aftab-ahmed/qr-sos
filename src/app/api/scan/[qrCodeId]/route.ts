import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { scanRateLimit } from '@/lib/redis';
import { sendQRScannedNotification } from '@/lib/notifications';
import { getClientIp } from '@/lib/utils';
import { getIpLocation } from '@/lib/geo';

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

  // Detect guest→login redirect: same IP already scanned this QR as a guest within the last 10 min.
  // When a visitor scans, gets the guest profile, then taps "Sign In" and logs in, the callbackUrl
  // sends them back here — which would fire a second notification. Merge those into one scan instead.
  let priorGuestScanId: string | null = null;
  if (isLoggedIn && !isSelfScan) {
    const prior = await prisma.qrScan.findFirst({
      where: {
        scannedUserId: scannedUser.id,
        scannerIp:    ip,
        scannerId:    null,  // was anonymous
        createdAt:    { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });
    priorGuestScanId = prior?.id ?? null;
  }

  // Resolve IP location for guest scans (non-blocking — used for both scan record and notification)
  let scannerCity: string | undefined;
  let scannerCountry: string | undefined;
  if (!isSelfScan && !isLoggedIn) {
    const loc = await getIpLocation(ip);
    scannerCity = loc.city;
    scannerCountry = loc.country;
  }

  const locationStr = scannerCity && scannerCountry ? `${scannerCity}, ${scannerCountry}` : undefined;

  // Log the scan — if this is a returning visitor (guest→login), upgrade the existing scan record
  // instead of creating a duplicate, and skip the notification (owner was already notified)
  let scan: { id: string };
  if (priorGuestScanId) {
    scan = await prisma.qrScan.update({
      where: { id: priorGuestScanId },
      data:  { scannerId: session!.user!.id },
      select: { id: true },
    });
  } else {
    scan = await prisma.qrScan.create({
      data: {
        scannedUserId: scannedUser.id,
        scannerId:  isLoggedIn && !isSelfScan ? session!.user!.id : null,
        scannerIp:  ip,
        location:   locationStr,
        userAgent:  req.headers.get('user-agent') || undefined,
      },
    });
  }

  // Notify owner — skip self-scans and guest→login revisits (already notified as guest)
  if (!isSelfScan && !priorGuestScanId) {
    if (isLoggedIn) {
      const scanner = await prisma.user.findUnique({
        where: { id: session!.user!.id },
        select: { name: true, email: true, phone: true, profileImage: true, qrCodeId: true },
      });
      sendQRScannedNotification(scannedUser.id, {
        scannerName:     scanner?.name,
        scannerEmail:    scanner?.email,
        scannerPhone:    scanner?.phone,
        scannerImage:    scanner?.profileImage,
        scannerQrCodeId: scanner?.qrCodeId,
        scannerId:       session!.user!.id,
      }).catch(console.error);
    } else {
      // Guest scan — pass pre-resolved location to avoid a second geolocation fetch
      sendQRScannedNotification(scannedUser.id, { scannerIp: ip, scannerCity, scannerCountry }).catch(console.error);
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
