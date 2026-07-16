import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertAdmin } from '../_lib/assert-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const result = await assertAdmin();
  if ('error' in result) return result.error;

  const range = req.nextUrl.searchParams.get('range') || '30d';

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

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: startDate } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const buckets: Record<string, number> = {};

  // Pre-fill buckets with zeros
  if (groupBy === 'day') {
    const cursor = new Date(startDate);
    while (cursor <= now) {
      const key = cursor.toISOString().slice(0, 10);
      buckets[key] = 0;
      cursor.setDate(cursor.getDate() + 1);
    }
  } else {
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (cursor <= now) {
      const key = cursor.toISOString().slice(0, 7);
      buckets[key] = 0;
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  for (const u of users) {
    const key = groupBy === 'day'
      ? u.createdAt.toISOString().slice(0, 10)
      : u.createdAt.toISOString().slice(0, 7);
    if (key in buckets) buckets[key]++;
  }

  const data = Object.entries(buckets).map(([date, count]) => ({ date, count }));

  return NextResponse.json({ range, groupBy, data });
}
