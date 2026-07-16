import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertAdmin } from '../../../_lib/assert-admin';

export const dynamic = 'force-dynamic';

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

  // Clear the QR code without deleting the user
  await prisma.user.update({
    where: { id },
    data: { qrCode: null, qrCodeId: null },
  });

  return NextResponse.json({ success: true, message: `QR code cleared for ${user.email}` });
}
