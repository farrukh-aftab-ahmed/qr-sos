import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const cursor = searchParams.get('cursor');

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = notifications.length > limit;
  const items = hasMore ? notifications.slice(0, limit) : notifications;

  return NextResponse.json({
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
    unreadCount: await prisma.notification.count({
      where: { userId: session.user.id, read: false },
    }),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ids } = await req.json();

  if (ids === 'all') {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });
  } else if (Array.isArray(ids)) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, id: { in: ids } },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}
