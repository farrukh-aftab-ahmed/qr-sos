import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

// Plus Jakarta Sans — clean, modern, highly legible at every size
const inter = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-inter',   // keep CSS var name — Tailwind config references it
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

// Outfit — geometric, modern, great for headings and display text
const syne = Outfit({
  subsets: ['latin'],
  variable: '--font-syne',    // keep CSS var name — Tailwind config references it
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: {
    default: 'QR-SOS — Emergency Vehicle Identification',
    template: '%s | QR-SOS',
  },
  description:
    'Instantly share your emergency info when it matters most. Place your QR-SOS sticker on your vehicle — one scan contacts your emergency people.',
  keywords: ['emergency', 'qr code', 'vehicle safety', 'accident', 'emergency contact', 'sos'],
  authors: [{ name: 'QR-SOS' }],
  openGraph: {
    title: 'QR-SOS — Emergency Vehicle Identification',
    description: 'One scan. Emergency contact. Your safety sticker.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QR-SOS',
    description: 'One scan. Emergency contact. Your safety sticker.',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'QR-SOS',
  },
};

export const viewport: Viewport = {
  themeColor: '#FF2D55',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-screen bg-sos-darker antialiased">
        {/* Capture beforeinstallprompt before React mounts — event fires very early */}
        <Script id="pwa-install-capture" strategy="beforeInteractive">{`
          window.__pwaInstallPrompt = null;
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.__pwaInstallPrompt = e;
            window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
          });
          window.addEventListener('appinstalled', function() {
            window.__pwaInstalled = true;
            window.dispatchEvent(new CustomEvent('pwa-installed'));
          });
        `}</Script>
        {/* Handle ChunkLoadError to prevent infinite reload loop */}
        <Script id="chunk-error-handler" strategy="afterInteractive">{`
          window.addEventListener('error', function(e) {
            if (e.message && e.message.includes('ChunkLoadError')) {
              console.warn('[ChunkLoadError] Caught chunk loading error, preventing reload');
              e.preventDefault();
              e.stopPropagation();
            }
          });
          window.addEventListener('unhandledrejection', function(e) {
            if (e.reason && e.reason.message && e.reason.message.includes('ChunkLoadError')) {
              console.warn('[ChunkLoadError] Caught unhandled chunk rejection, preventing reload');
              e.preventDefault();
            }
          });

          // Unregister service workers during development to prevent chunk loading issues
          if ('serviceWorker' in navigator && navigator.serviceWorker) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              registrations.forEach(function(registration) {
                console.log('[ServiceWorker] Unregistering:', registration.scope);
                registration.unregister();
              });
            });
          }
        `}</Script>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
