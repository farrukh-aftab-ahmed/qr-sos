import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { UserDetailClient } from '@/components/admin/user-detail-client';

export const metadata: Metadata = { title: 'User Details – Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  if (!user) notFound();

  // Serialize dates for the client component
  const serialized = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    emergencyContacts: user.emergencyContacts.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
    qrScans: user.qrScans.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
    })),
  };

  return <UserDetailClient user={serialized} />;
}
