import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertAdmin } from '../_lib/assert-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await assertAdmin();
  if ('error' in result) return result.error;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalQrCodes,
    totalScans,
    anonymousScans,
    registeredScans,
    newToday,
    newThisMonth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { qrCodeId: { not: null } } }),
    prisma.qrScan.count(),
    prisma.qrScan.count({ where: { scannerId: null } }),
    prisma.qrScan.count({ where: { scannerId: { not: null } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalQrCodes,
    totalScans,
    anonymousScans,
    registeredScans,
    newToday,
    newThisMonth,
  });
}
