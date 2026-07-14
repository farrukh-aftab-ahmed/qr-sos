import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { HeroSection } from '@/components/landing/hero-section';
import { HowItWorks } from '@/components/landing/how-it-works';
import { FeaturesSection } from '@/components/landing/features-section';
import { StickerPreview } from '@/components/landing/sticker-preview';
import { StatsSection } from '@/components/landing/stats-section';
import { CTASection } from '@/components/landing/cta-section';
import { LandingNav } from '@/components/landing/landing-nav';
import { Footer } from '@/components/landing/footer';

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <main className="relative overflow-hidden bg-sos-darker">
      <LandingNav />
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <StickerPreview />
      <StatsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
