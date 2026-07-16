import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin/admin-nav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = !!(session?.user as any)?.isAdmin;

  console.log('[AdminLayout] Session:', session?.user?.email, 'IsAdmin:', isAdmin);

  if (!session) {
    console.log('[AdminLayout] No session, redirecting to login');
    redirect('/login?callbackUrl=/admin/dashboard');
  }
  if (!isAdmin) {
    console.log('[AdminLayout] Not admin, redirecting to dashboard');
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#08080e]">
      {/* Subtle grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,45,85,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,45,85,0.015)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
      <AdminNav />
      <main className="relative z-10 lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
