import { LandingNav } from '@/components/landing/landing-nav';
import { Footer } from '@/components/landing/footer';

export const metadata = { title: 'Support — QR-SOS' };

const faqs = [
  {
    q: 'How do I get my QR sticker?',
    a: 'After registering and completing your profile, go to your Dashboard and click "Download Sticker". You will get a high-quality sticker file you can print at home or at any print shop.',
  },
  {
    q: 'What size should I print the sticker?',
    a: 'We recommend printing at 8 × 10 cm (about 3 × 4 inches) for good scannability. The sticker file is vector-based so it prints crisply at any size.',
  },
  {
    q: 'Who can see my emergency information?',
    a: 'Only registered and email-verified QR-SOS users can view your emergency contacts. Anonymous scanners are prompted to create a free account first, which acts as a gating measure against random people seeing your data.',
  },
  {
    q: 'Can I change my emergency contacts after printing the sticker?',
    a: 'Yes. Your QR code links to your live profile, so you can update your contacts, medical info, and profile photo at any time from your Dashboard. The printed sticker does not need to be reprinted.',
  },
  {
    q: 'What happens if I regenerate my QR code?',
    a: 'A new QR code ID is generated. Your old printed sticker will stop working and you will need to print and apply a new one. Only do this if you believe your current code has been compromised.',
  },
  {
    q: 'I am not receiving scan notifications. What should I check?',
    a: 'Go to your Dashboard → Notifications and make sure email notifications are enabled. Also check your spam/junk folder. For push notifications, ensure your browser has granted notification permission to qr-sos.online.',
  },
  {
    q: 'Is the service free?',
    a: 'Yes. QR-SOS is free to register and use. There are no subscription fees.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Email us at support@qr-sos.online with your registered email address and we will permanently delete your account and all associated data within 7 days.',
  },
];

export default function SupportPage() {
  return (
    <main className="relative bg-sos-darker min-h-screen">
      <LandingNav />
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="font-display font-black text-4xl text-white mb-2">Support</h1>
        <p className="text-white/50 text-lg mb-12">
          Can&apos;t find your answer below?{' '}
          <a href="mailto:support@qr-sos.online" className="text-[#FF2D55] hover:underline">
            Email us
          </a>{' '}
          and we&apos;ll get back to you within 24 hours.
        </p>

        <div className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="border border-white/10 rounded-xl p-6 bg-white/[0.03]">
              <h2 className="text-white font-semibold text-base mb-2">{faq.q}</h2>
              <p className="text-white/60 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 border border-[#FF2D55]/20 rounded-xl p-8 bg-[#FF2D55]/5 text-center">
          <h2 className="text-white font-bold text-xl mb-2">Still need help?</h2>
          <p className="text-white/50 text-sm mb-5">Our support team typically replies within 24 hours.</p>
          <a
            href="mailto:support@qr-sos.online"
            className="inline-block bg-[#FF2D55] hover:bg-[#e02040] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            support@qr-sos.online
          </a>
        </div>
      </div>
      <Footer />
    </main>
  );
}
