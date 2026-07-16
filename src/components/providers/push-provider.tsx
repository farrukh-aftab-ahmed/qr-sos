'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, X, Bell } from 'lucide-react';
import { ScannerModal, type ScannerInfo } from '@/components/shared/scanner-modal';

// ── Push context ──────────────────────────────────────────────────────────────
interface PushCtx {
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
  subscribe: () => Promise<void>;
  // PWA install
  isInstalled: boolean;
  iosNeedsInstall: boolean;
  canInstallNatively: boolean;
  installApp: () => Promise<void>;
}
const PushContext = createContext<PushCtx>({
  permission: 'default',
  subscribed: false,
  subscribe: async () => {},
  isInstalled: false,
  iosNeedsInstall: false,
  canInstallNatively: false,
  installApp: async () => {},
});
export const usePush = () => useContext(PushContext);

// ── Helpers ──────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i);
  return out;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface NotificationData {
  scannerName?: string;
  scannerEmail?: string;
  scannerPhone?: string;
  scannerImage?: string | null;
  scannerQrCodeId?: string | null;
  scannerIp?: string | null;
  scannerCity?: string | null;
  scannerCountry?: string | null;
  scannerId?: string;
  isGuest?: boolean;
}

interface Toast {
  id: string;
  title: string;
  body: string;
  type?: string;
  createdAt?: string;
  data?: NotificationData;
}

// ── Toast component ───────────────────────────────────────────────────────────

function ScanToast({
  toast,
  onDismiss,
  onClick,
}: {
  toast: Toast;
  onDismiss: () => void;
  onClick?: () => void;
}) {
  const isQrScan = toast.type === 'QR_SCANNED';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      className="w-80 max-w-[calc(100vw-2rem)]"
    >
      <div className="relative overflow-hidden rounded-2xl border border-[#FF2D55]/25 bg-[#0e0e16] shadow-[0_8px_40px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,45,85,0.08)]">
        {/* top accent */}
        <div className="h-0.5 bg-gradient-to-r from-[#FF2D55] to-[#FF6B35]" />

        <div
          className={`p-4 flex items-start gap-3 ${isQrScan && onClick ? 'cursor-pointer' : ''}`}
          onClick={isQrScan && onClick ? onClick : undefined}
        >
          {/* icon */}
          <div className="w-9 h-9 rounded-xl bg-[#FF2D55]/12 border border-[#FF2D55]/20 flex items-center justify-center flex-shrink-0">
            <QrCode className="w-4 h-4 text-[#FF2D55]" />
          </div>

          {/* text */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">{toast.title}</p>
            <p className="text-white/55 text-xs mt-1 leading-relaxed">{toast.body}</p>
            {isQrScan && onClick && (
              <p className="text-[#64D2FF]/60 text-[10px] mt-1">Tap to view scanner profile</p>
            )}
          </div>

          {/* dismiss */}
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-colors mt-0.5"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5 text-white/35" />
          </button>
        </div>

        {/* countdown bar */}
        <div className="h-0.5 bg-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-[#FF2D55] to-[#FF6B35]"
            initial={{ scaleX: 1, originX: 0 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 6, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function PushProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modalInfo, setModalInfo] = useState<ScannerInfo | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstallNatively, setCanInstallNatively] = useState(false);
  const deferredInstallPrompt = useRef<Event & { prompt: () => Promise<void> } | null>(null);
  const lastSeenIdRef = useRef<string | null>(null);
  const dismissTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev.slice(-2), { id, ...toast }]);

    dismissTimers.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete dismissTimers.current[id];
    }, 6000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    clearTimeout(dismissTimers.current[id]);
    delete dismissTimers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const openScannerModal = useCallback((toast: Toast) => {
    const d = toast.data ?? {};
    if (!toast.type || toast.type !== 'QR_SCANNED') return;

    if (d.scannerName) {
      setModalInfo({
        name:         d.scannerName,
        email:        d.scannerEmail,
        phone:        d.scannerPhone,
        profileImage: d.scannerImage,
        qrCodeId:     d.scannerQrCodeId,
        scannerIp:    null,
        scannedAt:    toast.createdAt ?? new Date().toISOString(),
        isGuest:      false,
      });
    } else {
      const location = d.scannerCity && d.scannerCountry
        ? `${d.scannerCity}, ${d.scannerCountry}`
        : null;
      setModalInfo({
        scannerIp:       d.scannerIp ?? null,
        scannerLocation: location,
        scannedAt:       toast.createdAt ?? new Date().toISOString(),
        isGuest:         true,
      });
    }
  }, []);

  // ── Register service worker + sync current permission state ──────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect iOS not installed as PWA — push requires Home Screen app on iOS <17
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isIOS && !isStandalone && !('PushManager' in window)) {
      setIosNeedsInstall(true);
      setPermission('unsupported');
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported');
      return;
    }

    // Skip service worker registration during development to prevent chunk loading issues
    if (process.env.NODE_ENV === 'development') {
      console.log('[PushProvider] Skipping service worker registration in development');
      return;
    }

    // Register SW silently (no permission prompt here — must come from user tap)
    navigator.serviceWorker.register('/sw.js').catch(() => {});

    // Sync current permission state
    setPermission(Notification.permission);

    // If already granted, reuse or restore existing subscription silently
    if (Notification.permission === 'granted') {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;
      navigator.serviceWorker.ready.then(async (reg) => {
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          setSubscribed(true);
          // Re-save in case it was lost from DB
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(existing),
          });
        }
      }).catch(() => {});
    }
  }, []);

  // ── PWA install detection ─────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already installed if running in standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    // Capture Android/desktop native install prompt
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredInstallPrompt.current = e as Event & { prompt: () => Promise<void> };
      setCanInstallNatively(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // Clear prompt once installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setCanInstallNatively(false);
      deferredInstallPrompt.current = null;
    });

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredInstallPrompt.current) return;
    await deferredInstallPrompt.current.prompt();
    deferredInstallPrompt.current = null;
    setCanInstallNatively(false);
  }, []);

  // ── subscribe — must be called from a user-gesture handler ───────────────
  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
      setSubscribed(true);
    } catch (err) {
      console.warn('[PushProvider] Push subscribe failed:', err);
    }
  }, []);

  // ── Polling: detect new notifications while dashboard is open ─────────────
  useEffect(() => {
    // Temporarily disabled to debug refresh loop
    console.log('[PushProvider] Notification polling disabled for debugging');
    return;

    const poll = async () => {
      try {
        const res = await fetch('/api/notifications?limit=1');
        if (!res.ok) return;
        const data = await res.json();
        const latest = data.items?.[0];
        if (!latest) return;

        if (lastSeenIdRef.current === null) {
          lastSeenIdRef.current = latest.id;
          return;
        }

        // Only dispatch event if we have a genuinely new notification
        if (latest.id !== lastSeenIdRef.current) {
          lastSeenIdRef.current = latest.id;
          addToast({
            title:     latest.title,
            body:      latest.message,
            type:      latest.type,
            createdAt: latest.createdAt,
            data:      latest.data ?? {},
          });
          // Signal dashboard to increment its scan count live
          if (latest.type === 'QR_SCANNED') {
            window.dispatchEvent(new CustomEvent('qr-scan-new'));
          }
        }
      } catch (err) {
        // Network error — ignore
        console.warn('[PushProvider] Polling error:', err);
      }
    };

    poll();
    const interval = setInterval(poll, 10_000);
    return () => clearInterval(interval);
  }, [addToast]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(dismissTimers.current).forEach(clearTimeout);
    };
  }, []);

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const showBanner = !bannerDismissed && permission === 'default' && !subscribed;

  return (
    <PushContext.Provider value={{ permission, subscribed, subscribe, isInstalled, iosNeedsInstall, canInstallNatively, installApp }}>
      {children}

      {/* ── Enable-notifications banner (shown until user taps or dismisses) ── */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[9980]"
          >
            <div className="relative overflow-hidden rounded-2xl border border-[#FF2D55]/25 bg-[#0e0e16] shadow-[0_8px_40px_rgba(0,0,0,0.85)]">
              <div className="h-0.5 bg-gradient-to-r from-[#FF2D55] to-[#FF6B35]" />
              <div className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FF2D55]/12 border border-[#FF2D55]/20 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-[#FF2D55]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">Enable scan alerts</p>
                  <p className="text-white/55 text-xs mt-0.5">Get notified instantly when your QR is scanned</p>
                  <button
                    onClick={subscribe}
                    className="mt-2 bg-[#FF2D55] hover:bg-[#e02040] text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                  >
                    Allow notifications
                  </button>
                </div>
                <button
                  onClick={() => setBannerDismissed(true)}
                  className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5 text-white/35" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanner profile modal — sits above toasts */}
      {modalInfo && (
        <ScannerModal info={modalInfo} onClose={() => setModalInfo(null)} />
      )}

      {/* In-app toast stack — bottom-right */}
      <div
        className="fixed bottom-5 right-4 z-[9990] flex flex-col-reverse gap-2 items-end pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ScanToast
                toast={toast}
                onDismiss={() => dismissToast(toast.id)}
                onClick={toast.type === 'QR_SCANNED' ? () => { dismissToast(toast.id); openScannerModal(toast); } : undefined}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </PushContext.Provider>
  );
}
