import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertAdmin } from '../_lib/assert-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const result = await assertAdmin();
  if ('error' in result) return result.error;

  const range = req.nextUrl.searchParams.get('range') || '30d';
  const type = req.nextUrl.searchParams.get('type') || 'all'; // all | anonymous | registered

  const now = new Date();
  let startDate: Date;
  let groupBy: 'day' | 'month';

  if (range === '7d') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    groupBy = 'day';
  } else if (range === '12m') {
    startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    groupBy = 'month';
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    groupBy = 'day';
  }

  const whereClause: Record<string, unknown> = {
    createdAt: { gte: startDate },
  };
  if (type === 'anonymous') whereClause.scannerId = null;
  if (type === 'registered') whereClause.scannerId = { not: null };

  const scans = await prisma.qrScan.findMany({
    where: whereClause,
    select: { createdAt: true, scannerId: true },
    orderBy: { createdAt: 'asc' },
  });

  const buckets: Record<string, { anonymous: number; registered: number; total: number }> = {};

  // Pre-fill buckets
  if (groupBy === 'day') {
    const cursor = new Date(startDate);
    while (cursor <= now) {
      const key = cursor.toISOString().slice(0, 10);
      buckets[key] = { anonymous: 0, registered: 0, total: 0 };
      cursor.setDate(cursor.getDate() + 1);
    }
  } else {
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (cursor <= now) {
      const key = cursor.toISOString().slice(0, 7);
      buckets[key] = { anonymous: 0, registered: 0, total: 0 };
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  for (const s of scans) {
    const key = groupBy === 'day'
      ? s.createdAt.toISOString().slice(0, 10)
      : s.createdAt.toISOString().slice(0, 7);
    if (key in buckets) {
      buckets[key].total++;
      if (s.scannerId) {
        buckets[key].registered++;
      } else {
        buckets[key].anonymous++;
      }
    }
  }

  const data = Object.entries(buckets).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  return NextResponse.json({ range, groupBy, type, data });
}
