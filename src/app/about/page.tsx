import { LandingNav } from '@/components/landing/landing-nav';
import { Footer } from '@/components/landing/footer';
import Image from 'next/image';

export const metadata = { title: 'About — QR-SOS' };

export default function AboutPage() {
  return (
    <main className="relative bg-sos-darker min-h-screen">
      <LandingNav />
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">

        <div className="text-center mb-16">
          <Image
            src="/logo.png"
            alt="QR-SOS"
            width={80}
            height={80}
            className="mx-auto mb-6 w-20 h-20 object-contain"
          />
          <h1 className="font-display font-black text-4xl text-white mb-4">About QR-SOS</h1>
          <p className="text-white/50 text-lg leading-relaxed">
            A simple idea: your vehicle should be able to speak for you when you can&apos;t.
          </p>
        </div>

        <div className="space-y-10 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-white font-bold text-xl mb-3">The Problem We Solve</h2>
            <p>
              Every year, thousands of people are involved in road accidents or medical emergencies
              where they are unable to communicate. First responders and bystanders have no quick
              way to identify the person, find their emergency contacts, or learn about critical
              medical conditions like allergies or blood type.
            </p>
            <p className="mt-3">
              ICE ("In Case of Emergency") contacts buried in a phone are locked behind a passcode.
              Paper documents in a glove box are rarely found. QR-SOS changes that.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">How It Works</h2>
            <p>
              You register, fill in your emergency contacts and optional medical notes, and download
              a personalised QR sticker. You print it, laminate it, and stick it on your vehicle —
              windscreen, bumper, or helmet.
            </p>
            <p className="mt-3">
              In an emergency, anyone with a smartphone can scan the code. They are taken to your
              profile page (after quick verification) and can immediately call your emergency
              contacts or pass your medical info to paramedics. You get a real-time notification
              every time your code is scanned.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">Our Principles</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><span className="text-white font-medium">Privacy first.</span> Your data is never sold. Scanners must verify their identity before seeing your contacts.</li>
              <li><span className="text-white font-medium">Always free.</span> Safety should not be paywalled.</li>
              <li><span className="text-white font-medium">Reliability.</span> The service is hosted on enterprise-grade infrastructure so it is available when it matters most.</li>
              <li><span className="text-white font-medium">Simplicity.</span> One scan. No app download required for the scanner.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">Contact</h2>
            <p>
              We are a small team passionate about road safety. Reach us any time at{' '}
              <a href="mailto:support@qr-sos.online" className="text-[#FF2D55] hover:underline">
                support@qr-sos.online
              </a>.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
