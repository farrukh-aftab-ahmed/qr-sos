import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = { title: 'Sign In' };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
