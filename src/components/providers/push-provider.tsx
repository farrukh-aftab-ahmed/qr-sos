'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, X } from 'lucide-react';
import { ScannerModal, type ScannerInfo } from '@/components/shared/scanner-modal';

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
      setModalInfo({
        scannerIp: d.scannerIp ?? null,
        scannedAt: toast.createdAt ?? new Date().toISOString(),
        isGuest:   true,
      });
    }
  }, []);

  // ── Service worker registration + push subscription ───────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const setup = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;

        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        const sub = existing ?? await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub),
        });
      } catch (err) {
        console.warn('[PushProvider] Push setup failed:', err);
      }
    };

    setup();
  }, []);

  // ── Polling: detect new notifications while dashboard is open ─────────────
  useEffect(() => {
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

        if (latest.id !== lastSeenIdRef.current) {
          lastSeenIdRef.current = latest.id;
          addToast({
            title:     latest.title,
            body:      latest.message,
            type:      latest.type,
            createdAt: latest.createdAt,
            data:      latest.data ?? {},
          });
        }
      } catch {
        // Network error — ignore
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

  return (
    <>
      {children}

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
    </>
  );
}
