'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Shield, Bell, Eye, Download, RefreshCw, Phone, Users,
         Activity, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { getInitials, timeAgo } from '@/lib/utils';
import { ScannerModal, type ScannerInfo } from '@/components/shared/scanner-modal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Scanner {
  name: string;
  profileImage: string | null;
  email: string;
  phone: string;
  qrCodeId?: string | null;
}

interface Scan {
  id: string;
  createdAt: Date;
  scannerIp: string | null;
  scanner: Scanner | null;
}

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string | null;
  qrCodeId: string | null;
  emergencyContacts: EmergencyContact[];
  qrScans: Scan[];
  notifications: Notification[];
  _count: { qrScans: number };
}

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};


// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function DashboardClient({ user }: { user: User }) {
  const [downloading, setDownloading]     = useState(false);
  const [selectedScan, setSelectedScan]   = useState<Scan | null>(null);

  const scannerInfo: ScannerInfo | null = selectedScan
    ? {
        name:         selectedScan.scanner?.name,
        email:        selectedScan.scanner?.email,
        phone:        selectedScan.scanner?.phone,
        profileImage: selectedScan.scanner?.profileImage,
        qrCodeId:     selectedScan.scanner?.qrCodeId,
        scannerIp:    selectedScan.scannerIp,
        scannedAt:    selectedScan.createdAt,
        isGuest:      !selectedScan.scanner,
      }
    : null;

  const handleDownloadSticker = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/qr/sticker');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qr-sos-sticker.svg';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const primaryContact =
    user.emergencyContacts.find((c) => c.isPrimary) || user.emergencyContacts[0];

  return (
    <>
      {/* ── Scanner Profile Modal ── */}
      {scannerInfo && (
        <ScannerModal info={scannerInfo} onClose={() => setSelectedScan(null)} />
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-black text-3xl text-white">
              Hey, {user.name.split(' ')[0]} 👋
            </h1>
            <p className="text-white/40 mt-1">Your safety profile is active and protected.</p>
          </div>
          <motion.div
            className="flex items-center gap-2 bg-[#30D158]/10 border border-[#30D158]/30 rounded-full px-3 py-1.5"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-2 h-2 rounded-full bg-[#30D158]" />
            <span className="text-[#30D158] text-xs font-medium">Profile Active</span>
          </motion.div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Scans',        value: user._count.qrScans,          icon: Eye,    color: '#FF2D55' },
            { label: 'Emergency Contacts', value: user.emergencyContacts.length, icon: Users,  color: '#FF6B35' },
            { label: 'Recent Alerts',      value: user.notifications.length,     icon: Bell,   color: '#FFD60A' },
            { label: 'Profile Status',     value: 'Active',                      icon: Shield, color: '#30D158' },
          ].map((stat) => (
            <motion.div key={stat.label} variants={itemVariants} className="glass-card p-5 hover:border-white/15 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/40 text-xs">{stat.label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                  <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                </div>
              </div>
              <div className="font-display font-black text-2xl" style={{ color: stat.color }}>
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* QR Code Card */}
          <motion.div variants={itemVariants} className="glass-card p-6 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#FF2D55]" />
                Your QR Code
              </h2>
            </div>

            {user.qrCodeId ? (
              <div className="flex flex-col items-center">
                <div className="relative p-4 bg-white rounded-2xl shadow-[0_0_40px_rgba(255,45,85,0.15)] mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/api/qr/image" alt="Your QR Code" width={160} height={160} className="rounded-lg" />
                  <motion.div
                    className="absolute inset-0 border-2 border-[#FF2D55]/30 rounded-2xl"
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <p className="text-white/40 text-xs text-center mb-4">
                  ID: <span className="font-mono text-white/60">{user.qrCodeId.slice(-8).toUpperCase()}</span>
                </p>
                <motion.button
                  onClick={handleDownloadSticker}
                  disabled={downloading}
                  className="sos-button w-full py-2.5 text-sm flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {downloading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                    : <><Download className="w-4 h-4" /> Download Sticker</>}
                </motion.button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-white/30">
                <QrCode className="w-12 h-12 mb-3" />
                <p className="text-sm">No QR code found</p>
              </div>
            )}
          </motion.div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Primary Emergency Contact */}
            <motion.div variants={itemVariants} className="glass-card p-6">
              <h2 className="font-bold text-white flex items-center gap-2 mb-4">
                <Phone className="w-4 h-4 text-[#FF6B35]" />
                Primary Emergency Contact
              </h2>
              {primaryContact ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B35]/20 to-[#FF2D55]/20 border border-[#FF6B35]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#FF6B35] font-bold text-sm">{getInitials(primaryContact.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold">{primaryContact.name}</p>
                    <p className="text-white/50 text-sm">{primaryContact.relationship}</p>
                    <p className="text-[#FF6B35] text-sm font-mono">{primaryContact.phone}</p>
                  </div>
                  <a
                    href={`tel:${primaryContact.phone}`}
                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#30D158]/10 border border-[#30D158]/20 flex items-center justify-center hover:bg-[#30D158]/20 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#30D158]" />
                  </a>
                </div>
              ) : (
                <p className="text-white/30 text-sm">No emergency contacts added yet.</p>
              )}

              {user.emergencyContacts.length > 1 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-white/30 text-xs mb-2">Additional contacts ({user.emergencyContacts.length - 1})</p>
                  <div className="flex gap-2 flex-wrap">
                    {user.emergencyContacts.slice(1).map((c) => (
                      <div key={c.id} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5">
                        <span className="text-white/60 text-xs">{c.name}</span>
                        <span className="text-white/30 text-xs">·</span>
                        <span className="text-white/40 text-xs">{c.relationship}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* ── Recent Scans ── */}
            <motion.div variants={itemVariants} className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#64D2FF]" />
                  Recent Scans
                </h2>
                <span className="text-white/30 text-xs">{user._count.qrScans} total</span>
              </div>

              {user.qrScans.length > 0 ? (
                <div className="space-y-2">
                  {user.qrScans.map((scan, i) => (
                    <motion.button
                      key={scan.id}
                      type="button"
                      onClick={() => setSelectedScan(scan)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/7 active:bg-white/10 transition-colors cursor-pointer group text-left"
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-[#64D2FF]/20 to-[#BF5AF2]/20 border border-[#64D2FF]/20 flex items-center justify-center flex-shrink-0">
                        {scan.scanner?.profileImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={scan.scanner.profileImage}
                            alt={scan.scanner.name}
                            className="w-full h-full object-cover"
                          />
                        ) : scan.scanner ? (
                          <span className="text-white text-xs font-bold">
                            {getInitials(scan.scanner.name)}
                          </span>
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-[#64D2FF]" />
                        )}
                      </div>

                      {/* Name + sub-label */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {scan.scanner?.name || 'Anonymous user'}
                        </p>
                        <p className="text-white/30 text-xs">scanned your code</p>
                      </div>

                      {/* Time + chevron hint */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-white/30 text-xs">{timeAgo(scan.createdAt)}</span>
                        <div className="w-5 h-5 rounded-full bg-white/5 group-hover:bg-[#64D2FF]/15 flex items-center justify-center transition-colors">
                          <Eye className="w-3 h-3 text-white/20 group-hover:text-[#64D2FF] transition-colors" />
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white/20">
                  <Eye className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No scans yet</p>
                  <p className="text-xs mt-1">Place your sticker on your vehicle to get started</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Profile summary */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar + info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#FF2D55] to-[#FF6B35] flex-shrink-0 shadow-[0_0_20px_rgba(255,45,85,0.2)]">
                {user.profileImage ? (
                  <Image src={user.profileImage} alt="Profile" width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                    {getInitials(user.name)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-bold text-lg truncate">{user.name}</h3>
                <p className="text-white/50 text-sm truncate">{user.email}</p>
                <p className="text-white/50 text-sm">{user.phone}</p>
              </div>
            </div>
            {/* Edit button — always on its own line on mobile, inline on sm+ */}
            <a
              href="/profile"
              className="flex-shrink-0 self-start sm:self-center px-4 py-2 border border-white/10 hover:border-white/20 rounded-xl text-white/60 hover:text-white text-sm transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Edit Profile
            </a>
          </div>
        </motion.div>

      </motion.div>
    </>
  );
}
