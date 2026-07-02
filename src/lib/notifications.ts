import webpush from 'web-push';
import { Resend } from 'resend';
import { prisma } from './prisma';
import { NotificationType, Prisma } from '@prisma/client';

const resend = new Resend(process.env.RESEND_API_KEY);

if (
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_SUBJECT
) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data: data ? (data as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  });
}

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; icon?: string; data?: Record<string, unknown> }
) {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  );

  // Remove expired/invalid subscriptions
  const failedEndpoints = results
    .map((r, i) => (r.status === 'rejected' ? subscriptions[i].endpoint : null))
    .filter((e): e is string => e !== null);

  if (failedEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: failedEndpoints } },
    });
  }
}

export async function sendQRScannedNotification(
  scannedUserId: string,
  opts: {
    scannerName?: string;
    scannerEmail?: string;
    scannerPhone?: string;
    scannerImage?: string | null;
    scannerQrCodeId?: string | null;
    scannerIp?: string;
    scannerId?: string;
  } = {}
) {
  const user = await prisma.user.findUnique({ where: { id: scannedUserId } });
  if (!user) return;

  const { scannerName, scannerEmail, scannerPhone, scannerImage, scannerQrCodeId, scannerIp, scannerId } = opts;

  const title = 'Your QR Code Was Scanned';
  let message: string;
  if (scannerName) {
    message = `${scannerName} scanned your QR-SOS code`;
  } else if (scannerIp) {
    message = `Anonymous guest viewed your profile (IP: ${scannerIp})`;
  } else {
    message = 'Someone scanned your QR-SOS code';
  }

  await Promise.allSettled([
    createNotification(scannedUserId, NotificationType.QR_SCANNED, title, message, {
      scannerName,
      scannerEmail,
      scannerPhone,
      scannerImage,
      scannerQrCodeId,
      scannerIp,
      scannerId,
      isGuest: !scannerId,
    }),
    sendPushNotification(scannedUserId, {
      title,
      body: message,
      icon: '/icon-192.png',
      data: { url: '/dashboard', type: 'qr_scan' },
    }),
    user.email &&
      resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: user.email,
        subject: `🚨 ${title}`,
        html: buildQRScannedEmail(user.name, scannerName, scannerIp),
      }),
  ]);
}

export async function sendWelcomeEmail(email: string, name: string) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_placeholder')) {
    console.log(`[Dev] Welcome email skipped for ${email} — no Resend key configured`);
    return;
  }
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: '🚨 Welcome to QR-SOS — Your Safety Profile is Ready',
    html: buildWelcomeEmail(name),
  });
}

function buildQRScannedEmail(userName: string, scannerName?: string, scannerIp?: string): string {
  const scannerLine = scannerName
    ? `<strong>${scannerName}</strong> has scanned`
    : scannerIp
    ? `An anonymous guest (IP: <code style="color:#FF6B35;">${scannerIp}</code>) has scanned`
    : 'Someone scanned';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:Arial,sans-serif;background:#0A0A0F;color:#fff;padding:40px;">
  <div style="max-width:600px;margin:0 auto;background:linear-gradient(135deg,#1a0a2e,#0A0A0F);border:1px solid rgba(255,45,85,0.3);border-radius:16px;padding:40px;">
    <h1 style="color:#FF2D55;margin:0 0 8px;font-size:24px;">QR Code Scanned</h1>
    <p style="color:#ccc;font-size:16px;">Hi <strong style="color:#fff;">${userName}</strong>,</p>
    <p style="color:#ccc;font-size:16px;">${scannerLine} your QR-SOS emergency code.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:block;background:linear-gradient(135deg,#FF2D55,#FF6B35);color:white;text-decoration:none;padding:16px;border-radius:12px;text-align:center;font-weight:bold;font-size:16px;margin-top:24px;">View Dashboard</a>
  </div>
</body>
</html>`;
}

function buildWelcomeEmail(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:Arial,sans-serif;background:#0A0A0F;color:#fff;padding:40px;">
  <div style="max-width:600px;margin:0 auto;background:linear-gradient(135deg,#1a0a2e,#0A0A0F);border:1px solid rgba(255,45,85,0.3);border-radius:16px;padding:40px;">
    <h1 style="font-size:32px;font-weight:900;letter-spacing:6px;color:#FF2D55;">QR-SOS</h1>
    <p style="color:#ccc;font-size:16px;">Hi <strong style="color:#fff;">${name}</strong>, welcome to QR-SOS!</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:block;background:linear-gradient(135deg,#FF2D55,#FF6B35);color:white;text-decoration:none;padding:16px;border-radius:12px;text-align:center;font-weight:bold;font-size:16px;margin-top:24px;">Go to Dashboard</a>
  </div>
</body>
</html>`;
}
