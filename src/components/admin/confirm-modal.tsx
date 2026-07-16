'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={onCancel}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md rounded-2xl bg-[#12121a] border border-white/10 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-base font-bold text-white">{title}</h3>
                </div>
                <button
                  onClick={onCancel}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5">
                <p className="text-sm text-white/60 leading-relaxed">{description}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 p-5 pt-0">
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white/80 rounded-xl hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="px-5 py-2 text-sm font-bold text-white bg-red-500/80 hover:bg-red-500 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Deleting...' : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
