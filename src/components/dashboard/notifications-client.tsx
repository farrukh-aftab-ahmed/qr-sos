'use client';

import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Eye, CheckCheck, QrCode } from 'lucide-react';
import { useState } from 'react';
import { timeAgo } from '@/lib/utils';
import { ScannerModal, type ScannerInfo } from '@/components/shared/scanner-modal';

interface NotificationData {
  scannerName?: string;
  scannerEmail?: string;
  scannerPhone?: string;
  scannerImage?: string | null;
  scannerQrCodeId?: string | null;
  scannerIp?: string;
  scannerId?: string;
  isGuest?: boolean;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: NotificationData;
}

async function fetchNotifications() {
  const res = await fetch('/api/notifications?limit=50');
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

async function fetchScannerProfile(userId: string) {
  const res = await fetch(`/api/scanner/${userId}`);
  if (!res.ok) return null;
  return res.json() as Promise<{ name: string; email: string; phone: string; profileImage: string | null; qrCodeId: string | null }>;
}

const typeIcons: Record<string, { icon: typeof QrCode; color: string }> = {
  QR_SCANNED:      { icon: QrCode, color: '#64D2FF' },
  WELCOME:         { icon: Bell,   color: '#30D158' },
  PROFILE_UPDATED: { icon: Eye,    color: '#FF6B35' },
};

export function NotificationsClient() {
  const qc = useQueryClient();
  const [modalInfo, setModalInfo] = useState<ScannerInfo | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: async (ids: string[] | 'all') => {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) markReadMutation.mutate([n.id]);
    if (n.type !== 'QR_SCANNED') return;

    const d = n.data ?? {};

    // Registered scanner — scannerName is the reliable signal
    if (d.scannerName) {
      // If this notification already has stored email/phone (new format), show immediately
      if (d.scannerEmail || d.scannerPhone) {
        setModalInfo({
          name:         d.scannerName,
          email:        d.scannerEmail,
          phone:        d.scannerPhone,
          profileImage: d.scannerImage,
          qrCodeId:     d.scannerQrCodeId,
          scannerIp:    null,
          scannedAt:    n.createdAt,
          isGuest:      false,
        });
        return;
      }

      // Older notification — try fetching from API if we have the ID
      if (d.scannerId) {
        setLoadingId(n.id);
        try {
          const profile = await fetchScannerProfile(d.scannerId);
          setModalInfo({
            name:         profile?.name ?? d.scannerName,
            email:        profile?.email,
            phone:        profile?.phone,
            profileImage: profile?.profileImage,
            qrCodeId:     profile?.qrCodeId,
            scannerIp:    null,
            scannedAt:    n.createdAt,
            isGuest:      false,
          });
        } catch {
          setModalInfo({ name: d.scannerName, scannedAt: n.createdAt, isGuest: false });
        } finally {
          setLoadingId(null);
        }
      } else {
        // Very old notification — no ID stored, just show name
        setModalInfo({ name: d.scannerName, scannedAt: n.createdAt, isGuest: false });
      }
      return;
    }

    // Anonymous guest — show IP if available
    setModalInfo({
      scannerIp: d.scannerIp ?? null,
      scannedAt: n.createdAt,
      isGuest:   true,
    });
  };

  const notifications: Notification[] = data?.items || [];
  const unreadCount: number = data?.unreadCount || 0;

  return (
    <>
      {modalInfo && (
        <ScannerModal info={modalInfo} onClose={() => setModalInfo(null)} />
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-black text-3xl text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-white/40 mt-1">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <motion.button
              onClick={() => markReadMutation.mutate('all')}
              className="flex items-center gap-2 px-4 py-2 glass-card text-white/60 hover:text-white text-sm border border-white/10 hover:border-white/20 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </motion.button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-card p-4 h-20 shimmer" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Bell className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No notifications yet</p>
            <p className="text-white/20 text-sm mt-1">You&apos;ll be notified when someone scans your QR code</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n, i) => {
              const typeInfo = typeIcons[n.type] || { icon: Bell, color: '#FF2D55' };
              const isQrScan = n.type === 'QR_SCANNED';
              const isLoadingThis = loadingId === n.id;

              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleNotificationClick(n)}
                  className={`glass-card p-4 flex items-start gap-4 transition-all ${
                    isQrScan ? 'cursor-pointer hover:border-[#64D2FF]/25 hover:bg-white/[0.03]' : 'cursor-default'
                  } ${!n.read ? 'border-[#FF2D55]/20 bg-[#FF2D55]/3' : ''}`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${typeInfo.color}15`, border: `1px solid ${typeInfo.color}30` }}
                  >
                    {isLoadingThis ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                    ) : (
                      <typeInfo.icon className="w-5 h-5" style={{ color: typeInfo.color }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium text-sm">{n.title}</p>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-[#FF2D55] flex-shrink-0" />}
                    </div>
                    <p className="text-white/50 text-xs mt-0.5">{n.message}</p>
                    {isQrScan && (
                      <p className="text-[#64D2FF]/60 text-xs mt-1">Tap to view scanner profile</p>
                    )}
                  </div>
                  <span className="text-white/25 text-xs flex-shrink-0">{timeAgo(n.createdAt)}</span>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </>
  );
}
