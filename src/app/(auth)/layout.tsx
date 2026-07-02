import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sos-hero flex flex-col">
      {/* Background grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,45,85,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,45,85,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 p-6">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="QR-SOS"
            width={120}
            height={120}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}
