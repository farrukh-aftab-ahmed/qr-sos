import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { PushProvider } from '@/components/providers/push-provider';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  console.log('[DashboardLayout] Session:', session?.user?.email);

  if (!session) {
    console.log('[DashboardLayout] No session, redirecting to login');
    redirect('/login?callbackUrl=/dashboard');
  }

  return (
    <PushProvider>
      <div className="min-h-screen bg-sos-darker">
        <div className="fixed inset-0 bg-[linear-gradient(rgba(255,45,85,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,45,85,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
        <DashboardNav />
        <main className="relative z-10 pt-20 pb-12 px-4 sm:px-6 max-w-6xl mx-auto">
          {children}
        </main>
      </div>
    </PushProvider>
  );
}
