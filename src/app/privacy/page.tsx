import { LandingNav } from '@/components/landing/landing-nav';
import { Footer } from '@/components/landing/footer';

export const metadata = { title: 'Privacy Policy — QR-SOS' };

export default function PrivacyPage() {
  return (
    <main className="relative bg-sos-darker min-h-screen">
      <LandingNav />
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="font-display font-black text-4xl text-white mb-2">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: July 2025</p>

        <div className="space-y-10 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-white font-bold text-xl mb-3">1. Information We Collect</h2>
            <p>When you register for QR-SOS, we collect your name, email address, phone number, and the emergency contact information you choose to provide (names, phone numbers, and relationship). We also collect profile photos and any medical notes you voluntarily add to your profile.</p>
            <p className="mt-3">When someone scans your QR code, we log the scan time and the country/region of the scanner to show you in your scan history.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To operate your emergency profile and QR code</li>
              <li>To send you scan notifications by email or push notification</li>
              <li>To display your emergency contact information to verified scanners</li>
              <li>To allow you to view your scan history</li>
              <li>To communicate service updates or security alerts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">3. Who Can See Your Data</h2>
            <p>Your emergency contact details are only visible to users who have completed registration and email verification on QR-SOS. Anonymous visitors who scan your QR code are prompted to register before any personal information is shown.</p>
            <p className="mt-3">We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">4. Data Storage & Security</h2>
            <p>Your data is stored on secure servers hosted on Google Cloud Platform. We use industry-standard encryption in transit (TLS) and at rest. Profile images are stored in Google Cloud Storage with restricted access.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">5. Your Rights</h2>
            <p>You may update or delete your profile and emergency contacts at any time from your dashboard. To permanently delete your account and all associated data, contact us at <a href="mailto:support@qr-sos.online" className="text-[#FF2D55] hover:underline">support@qr-sos.online</a>.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">6. Cookies</h2>
            <p>We use session cookies solely to keep you logged in. We do not use tracking or advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">7. Contact</h2>
            <p>Questions about this policy? Email us at <a href="mailto:support@qr-sos.online" className="text-[#FF2D55] hover:underline">support@qr-sos.online</a>.</p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
