import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = subscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 422 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    update: { p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth },
    create: {
      userId: session.user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { endpoint } = await req.json();
  await prisma.pushSubscription.deleteMany({
    where: { userId: session.user.id, endpoint },
  });

  return NextResponse.json({ success: true });
}
