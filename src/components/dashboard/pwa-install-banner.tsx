'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share, X, Smartphone } from 'lucide-react';
import { usePush } from '@/components/providers/push-provider';

export function PWAInstallBanner() {
  const { isInstalled, iosNeedsInstall, canInstallNatively, installApp } = usePush();
  const [dismissed, setDismissed] = useState(false);

  const show = !dismissed && !isInstalled && (iosNeedsInstall || canInstallNatively);
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="relative overflow-hidden rounded-2xl border border-[#30D158]/20 bg-[#30D158]/5">
          {/* top accent */}
          <div className="h-0.5 bg-gradient-to-r from-[#30D158] to-[#34C759]" />

          <div className="p-4 flex items-start gap-4">
            {/* icon */}
            <div className="w-10 h-10 rounded-xl bg-[#30D158]/10 border border-[#30D158]/20 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-[#30D158]" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">
                Install QR-SOS as an app
              </p>
              <p className="text-white/50 text-xs mt-0.5 mb-3">
                Get instant scan alerts and faster access — even when offline.
              </p>

              {/* Android / Desktop — native install button */}
              {canInstallNatively && (
                <button
                  onClick={installApp}
                  className="inline-flex items-center gap-2 bg-[#30D158] hover:bg-[#28b84a] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Install App
                </button>
              )}

              {/* iOS — manual steps */}
              {iosNeedsInstall && !canInstallNatively && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-white/60 text-xs">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                    Tap the
                    <span className="inline-flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-white/80">
                      <Share className="w-3 h-3" /> Share
                    </span>
                    button in Safari
                  </div>
                  <div className="flex items-center gap-2 text-white/60 text-xs">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                    Tap <span className="text-white/80 font-medium">"Add to Home Screen"</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60 text-xs">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                    Open QR-SOS from your home screen and allow notifications
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setDismissed(true)}
              className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5 text-white/30" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
