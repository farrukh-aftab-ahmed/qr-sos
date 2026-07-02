import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
    include: {
      emergencyContacts: { orderBy: { isPrimary: 'desc' } },
      _count: { select: { qrScans: true } },
      qrScans: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          scannerIp: true,
          scanner: { select: { name: true, profileImage: true, email: true, phone: true, qrCodeId: true } },
        },
      },
      notifications: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { read: false },
      },
    },
  });

  if (!user) return null;
  const { passwordHash, profileImagePublicId, ...safeUser } = user;

  return <DashboardClient user={safeUser} />;
}
