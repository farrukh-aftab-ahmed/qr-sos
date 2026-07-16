import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function assertAdmin(): Promise<{ error: NextResponse } | { session: Awaited<ReturnType<typeof auth>> }> {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = !!(session?.user as any)?.isAdmin;

  if (!session || !isAdmin) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  return { session };
}
