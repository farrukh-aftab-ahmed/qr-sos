import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertAdmin } from '../../_lib/assert-admin';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await assertAdmin();
  if ('error' in result) return result.error;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
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
      updatedAt: true,
      emergencyContacts: {
        orderBy: { isPrimary: 'desc' },
        select: {
          id: true,
          name: true,
          phone: true,
          relationship: true,
          isPrimary: true,
          createdAt: true,
        },
      },
      qrScans: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          createdAt: true,
          scannerIp: true,
          location: true,
          userAgent: true,
          scannerId: true,
          scanner: {
            select: { name: true, email: true },
          },
        },
      },
      _count: {
        select: { qrScans: true, emergencyContacts: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await assertAdmin();
  if ('error' in result) return result.error;

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Hard-delete — cascades to all relations
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true, message: `User ${user.email} deleted` });
}
