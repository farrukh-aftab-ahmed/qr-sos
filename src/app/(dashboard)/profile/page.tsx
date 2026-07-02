import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfileClient } from '@/components/dashboard/profile-client';

export const metadata: Metadata = { title: 'My Profile' };

export default async function ProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
    include: { emergencyContacts: { orderBy: { isPrimary: 'desc' } } },
  });
  if (!user) return null;
  const { passwordHash, profileImagePublicId, ...safeUser } = user;
  return <ProfileClient user={safeUser} />;
}
