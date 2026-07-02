'use client';

import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="glass-card p-4 flex items-start gap-3 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.variant === 'destructive' ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#30D158]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {toast.title && <p className="text-white text-sm font-medium">{toast.title}</p>}
              {toast.description && <p className="text-white/60 text-xs mt-0.5">{toast.description}</p>}
            </div>
            <button onClick={() => dismiss(toast.id)} className="text-white/30 hover:text-white/60 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
