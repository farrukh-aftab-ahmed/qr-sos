'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, Phone, Mail, Clock, UserCircle2, Wifi, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { getInitials, timeAgo } from '@/lib/utils';

export interface ScannerInfo {
  name?: string;
  email?: string;
  phone?: string;
  profileImage?: string | null;
  qrCodeId?: string | null;
  scannerIp?: string | null;
  scannedAt: Date | string;
  isGuest: boolean;
}

interface Props {
  info: ScannerInfo;
  onClose: () => void;
}

function ModalContent({ info, onClose }: Props) {
  const { name, email, phone, profileImage, qrCodeId, scannerIp, scannedAt, isGuest } = info;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <motion.div
        className="relative z-10 w-full max-w-xs"
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass-card p-5 border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white/60" />
          </button>

          <p className="text-[#64D2FF] text-[10px] font-medium tracking-widest uppercase mb-4">
            Scanner Profile
          </p>

          {!isGuest && name ? (
            <>
              {/* Avatar + name */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-[#64D2FF]/30 to-[#BF5AF2]/30 border border-white/10 flex items-center justify-center flex-shrink-0">
                  {profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profileImage} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-lg">{getInitials(name)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-base truncate">{name}</h3>
                  <p className="text-white/40 text-xs">Registered QR-SOS user</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                {email && (
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/4 border border-white/6">
                    <div className="w-7 h-7 rounded-lg bg-[#64D2FF]/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-3.5 h-3.5 text-[#64D2FF]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white/40 text-[10px]">Email</p>
                      <p className="text-white text-xs font-medium truncate">{email}</p>
                    </div>
                    <a
                      href={`mailto:${email}`}
                      className="w-7 h-7 rounded-lg bg-[#64D2FF]/10 hover:bg-[#64D2FF]/25 flex items-center justify-center transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3 text-[#64D2FF]" />
                    </a>
                  </div>
                )}

                {phone && (
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/4 border border-white/6">
                    <div className="w-7 h-7 rounded-lg bg-[#30D158]/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-3.5 h-3.5 text-[#30D158]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white/40 text-[10px]">Phone</p>
                      <p className="text-white text-xs font-medium">{phone}</p>
                    </div>
                    <a
                      href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                      className="w-7 h-7 rounded-lg bg-[#30D158]/15 hover:bg-[#30D158]/30 flex items-center justify-center transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-3 h-3 text-[#30D158]" />
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/4 border border-white/6">
                  <div className="w-7 h-7 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-3.5 h-3.5 text-[#FF6B35]" />
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px]">Scanned</p>
                    <p className="text-white text-xs font-medium">{timeAgo(scannedAt)}</p>
                  </div>
                </div>
              </div>

              {/* View their emergency profile */}
              {qrCodeId && (
                <Link
                  href={`/scan/${qrCodeId}`}
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full py-2.5 mb-3 rounded-xl bg-[#64D2FF]/10 hover:bg-[#64D2FF]/20 border border-[#64D2FF]/20 hover:border-[#64D2FF]/40 text-[#64D2FF] hover:text-white text-xs font-medium transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Their Emergency Profile
                </Link>
              )}
            </>
          ) : (
            /* Anonymous */
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <UserCircle2 className="w-7 h-7 text-white/25" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">Anonymous Guest</h3>
                  <p className="text-white/40 text-xs">No QR-SOS account</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {scannerIp && (
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FF6B35]/8 border border-[#FF6B35]/15">
                    <div className="w-7 h-7 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                      <Wifi className="w-3.5 h-3.5 text-[#FF6B35]" />
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px]">IP Address</p>
                      <p className="text-white text-xs font-mono font-medium">{scannerIp}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/4 border border-white/6">
                  <div className="w-7 h-7 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-3.5 h-3.5 text-[#FF6B35]" />
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px]">Scanned</p>
                    <p className="text-white text-xs font-medium">{timeAgo(scannedAt)}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-xs transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ScannerModal({ info, onClose }: Props) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      <ModalContent info={info} onClose={onClose} />
    </AnimatePresence>,
    document.body
  );
}
