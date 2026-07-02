import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

  const scans = await prisma.qrScan.findMany({
    where: { scannedUserId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      scanner: { select: { name: true, profileImage: true } },
    },
  });

  const total = await prisma.qrScan.count({ where: { scannedUserId: session.user.id } });

  return NextResponse.json({ scans, total });
}
