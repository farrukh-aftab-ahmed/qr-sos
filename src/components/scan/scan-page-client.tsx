'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Phone, User, AlertTriangle, LogIn, UserPlus, Eye, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ScanResult {
  scanId: string;
  isGuest: boolean;
  profile: {
    name: string;
    phone: string | null;
    profileImage: string | null;
    emergencyContact: {
      name?: string;
      phone: string;
      relationship: string;
    } | null;
  };
}

// Strip formatting chars so the OS dialer receives a clean number
function toTelHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function ScanPageClient({ qrCodeId }: { qrCodeId: string }) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchScan = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/scan/${qrCodeId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load profile');
        setResult(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchScan();
  }, [qrCodeId]);

  return (
    <div className="min-h-screen bg-sos-hero flex items-start justify-center p-4 pt-8 sm:p-6 sm:pt-12">
      {/* Background grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,45,85,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,45,85,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      {/* Pulsing glow */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ background: 'radial-gradient(ellipse at center, rgba(255,45,85,0.1) 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-5"
        >
          <Link href="/" className="inline-block">
            <Image
              src="/logo.png"
              alt="QR-SOS"
              width={140}
              height={140}
              className="h-12 w-auto object-contain mx-auto drop-shadow-[0_0_12px_rgba(255,45,85,0.3)]"
              priority
            />
          </Link>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Loading */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card p-10 text-center border border-white/10"
            >
              <motion.div
                className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Image src="/logo.png" alt="Loading" width={64} height={64} className="w-16 h-16 object-contain" />
              </motion.div>
              <p className="text-white font-medium">Loading safety profile...</p>
              <p className="text-white/40 text-sm mt-1">Please wait</p>
            </motion.div>
          )}

          {/* Error */}
          {!loading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 text-center border border-red-500/20"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-white font-bold text-xl mb-2">Profile Not Found</h2>
              <p className="text-white/50 text-sm mb-6">{error}</p>
              <Link href="/">
                <button className="sos-button px-6 py-2.5 text-sm">Go to QR-SOS</button>
              </Link>
            </motion.div>
          )}

          {/* Profile card */}
          {!loading && result?.profile && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card border border-[#FF2D55]/20 overflow-hidden"
            >
              {/* Top accent */}
              <div className="h-1.5 bg-gradient-to-r from-[#FF2D55] to-[#FF6B35]" />

              <div className="p-5 sm:p-7">
                {/* Emergency header + guest badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 min-w-0">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-[#FF2D55] flex-shrink-0"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-[#FF2D55] text-[10px] sm:text-xs font-medium tracking-widest uppercase truncate">
                      Emergency Profile Active
                    </span>
                  </div>
                  {result.isGuest && (
                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 flex-shrink-0 ml-2">
                      <Eye className="w-3 h-3 text-white/40" />
                      <span className="text-white/40 text-xs">Guest</span>
                    </div>
                  )}
                </div>

                {/* Profile info */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-[#FF2D55] to-[#FF6B35] flex-shrink-0">
                    {result.profile.profileImage ? (
                      <img
                        src={result.profile.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-7 h-7 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display font-black text-xl sm:text-2xl text-white truncate">
                      {result.profile.name}
                    </h2>
                    <p className="text-white/50 text-sm">Vehicle Owner</p>
                  </div>
                </div>

                {/* Contact numbers */}
                <div className="space-y-3 mb-4">
                  {/* Owner's phone — only for logged-in users */}
                  {result.profile.phone && (
                    <div className="bg-white/5 rounded-2xl p-4">
                      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Owner&apos;s Phone</p>
                      <a href={toTelHref(result.profile.phone)} className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-xl bg-[#30D158]/10 border border-[#30D158]/20 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-[#30D158]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[#30D158] font-mono font-bold text-base sm:text-lg group-hover:text-white transition-colors truncate">
                            {result.profile.phone}
                          </p>
                          <p className="text-white/30 text-xs">Tap to call</p>
                        </div>
                      </a>
                    </div>
                  )}

                  {/* Emergency contact */}
                  {result.profile.emergencyContact && (
                    <div className="bg-[#FF2D55]/5 border border-[#FF2D55]/20 rounded-2xl p-4">
                      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">🚨 Emergency Contact</p>
                      <a href={toTelHref(result.profile.emergencyContact.phone)} className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-xl bg-[#FF2D55]/10 border border-[#FF2D55]/20 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-[#FF2D55]" />
                        </div>
                        <div className="min-w-0">
                          {result.profile.emergencyContact.name && (
                            <p className="text-white font-semibold text-sm truncate">
                              {result.profile.emergencyContact.name}
                            </p>
                          )}
                          <p className="text-white/50 text-xs">{result.profile.emergencyContact.relationship}</p>
                          <p className="text-[#FF6B35] font-mono text-sm group-hover:text-white transition-colors truncate">
                            {result.profile.emergencyContact.phone}
                          </p>
                        </div>
                      </a>
                    </div>
                  )}
                </div>

                {/* Primary CTA */}
                <motion.a
                  href={toTelHref(result.profile.emergencyContact?.phone ?? result.profile.phone ?? '')}
                  className="sos-button w-full py-4 flex items-center justify-center gap-2 text-base"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Phone className="w-5 h-5" />
                  Call Emergency Contact
                </motion.a>
              </div>

              {/* Logged-in footer — dashboard link */}
              {!result.isGuest && (
                <div className="border-t border-white/8 px-5 sm:px-7 py-4 bg-white/[0.02]">
                  <Link href="/dashboard" className="block">
                    <motion.button
                      className="w-full py-3 border border-white/15 hover:border-white/25 rounded-xl text-white/60 hover:text-white text-sm font-medium flex items-center justify-center gap-2 transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                      <span>Go to My Dashboard</span>
                    </motion.button>
                  </Link>
                </div>
              )}

              {/* Guest footer — sign in / register */}
              {result.isGuest && (
                <div className="border-t border-white/8 px-5 sm:px-7 py-5 bg-white/[0.02]">
                  <p className="text-white/40 text-xs text-center mb-3">
                    Get your own QR-SOS sticker — it&apos;s free
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href={`/login?callbackUrl=/scan/${qrCodeId}`} className="block">
                      <motion.button
                        className="w-full py-3 border border-white/15 hover:border-white/30 rounded-xl text-white/70 hover:text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <LogIn className="w-4 h-4 flex-shrink-0" />
                        <span>Sign In</span>
                      </motion.button>
                    </Link>
                    <Link href={`/register?callbackUrl=/scan/${qrCodeId}`} className="block">
                      <motion.button
                        className="w-full py-3 border border-white/15 hover:border-white/30 rounded-xl text-white/70 hover:text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <UserPlus className="w-4 h-4 flex-shrink-0" />
                        <span>Get Sticker</span>
                      </motion.button>
                    </Link>
                  </div>
                </div>
              )}

              <div className="border-t border-white/5 px-5 sm:px-7 py-3 flex items-center justify-between">
                <p className="text-white/20 text-xs">Powered by QR-SOS</p>
                <Link href="/" className="text-[#FF2D55]/60 hover:text-[#FF2D55] text-xs transition-colors">
                  qr-sos.com
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
