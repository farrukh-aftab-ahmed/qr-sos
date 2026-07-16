import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertAdmin } from '../_lib/assert-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const result = await assertAdmin();
  if ('error' in result) return result.error;

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '20')));
  const search = req.nextUrl.searchParams.get('search')?.trim() || '';

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profileImage: true,
        qrCode: true,
        qrCodeId: true,
        isActive: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: {
            qrScans: true,
            emergencyContacts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
