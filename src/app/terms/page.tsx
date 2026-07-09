import { LandingNav } from '@/components/landing/landing-nav';
import { Footer } from '@/components/landing/footer';

export const metadata = { title: 'Terms of Service — QR-SOS' };

export default function TermsPage() {
  return (
    <main className="relative bg-sos-darker min-h-screen">
      <LandingNav />
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="font-display font-black text-4xl text-white mb-2">Terms of Service</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: July 2025</p>

        <div className="space-y-10 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-white font-bold text-xl mb-3">1. Acceptance of Terms</h2>
            <p>By creating an account or using QR-SOS ("the Service"), you agree to these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">2. Description of Service</h2>
            <p>QR-SOS provides a platform that allows vehicle owners to create a personal QR code sticker. When scanned, the sticker connects first responders or bystanders to the vehicle owner's emergency contacts and medical information.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">3. Your Account</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>You must provide accurate information when registering.</li>
              <li>You are responsible for keeping your login credentials secure.</li>
              <li>You must be at least 16 years old to use the Service.</li>
              <li>One account per person is permitted.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Provide false emergency contact information</li>
              <li>Use the Service to harass, stalk, or harm others</li>
              <li>Attempt to access another user's profile without their consent</li>
              <li>Reverse engineer, scrape, or abuse the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">5. Emergency Disclaimer</h2>
            <p className="font-medium text-white/90">QR-SOS is a supplemental safety tool. It is not a substitute for calling emergency services (911 or your local emergency number). In any life-threatening emergency, always call emergency services first.</p>
            <p className="mt-3">We do not guarantee that your QR code will be scanned, that scanners will act on the information, or that the Service will be available at any specific time.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">6. Intellectual Property</h2>
            <p>The QR-SOS name, logo, and platform are owned by QR-SOS. You retain ownership of any personal data you provide. You grant us a limited licence to store and display your information solely for operating the Service.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">7. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these Terms. You may delete your account at any time by contacting <a href="mailto:support@qr-sos.online" className="text-[#FF2D55] hover:underline">support@qr-sos.online</a>.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, QR-SOS is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from use of the Service.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">9. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Continued use of the Service after changes are posted constitutes acceptance of the new Terms.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">10. Contact</h2>
            <p>Questions? Email <a href="mailto:support@qr-sos.online" className="text-[#FF2D55] hover:underline">support@qr-sos.online</a>.</p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
