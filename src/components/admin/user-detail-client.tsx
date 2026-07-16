'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Trash2, QrCode, Mail, Phone, Calendar, Shield, MapPin,
  Globe, User as UserIcon, Heart, Scan,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from './confirm-modal';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  createdAt: string;
}

interface QrScan {
  id: string;
  createdAt: string;
  scannerIp: string | null;
  location: string | null;
  userAgent: string | null;
  scannerId: string | null;
  scanner: { name: string; email: string } | null;
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string | null;
  qrCode: string | null;
  qrCodeId: string | null;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  emergencyContacts: EmergencyContact[];
  qrScans: QrScan[];
  _count: { qrScans: number; emergencyContacts: number };
}

interface UserDetailClientProps {
  user: UserDetail;
}

export function UserDetailClient({ user: initialUser }: UserDetailClientProps) {
  const router = useRouter();
  const [user] = useState(initialUser);
  const [activeTab, setActiveTab] = useState<'contacts' | 'scans'>('contacts');
  const [modal, setModal] = useState<{ open: boolean; type: 'deleteUser' | 'deleteQr' }>({ open: false, type: 'deleteUser' });
  const [modalLoading, setModalLoading] = useState(false);

  const handleDeleteUser = async () => {
    setModalLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      router.push('/admin/users');
    } catch {
      console.error('Failed to delete user');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteQr = async () => {
    setModalLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/qr`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setModal({ open: false, type: 'deleteQr' });
      router.refresh();
    } catch {
      console.error('Failed to delete QR');
    } finally {
      setModalLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const tabs = [
    { key: 'contacts' as const, label: `Emergency Contacts (${user.emergencyContacts.length})`, icon: Heart },
    { key: 'scans' as const, label: `Scan History (${user._count.qrScans})`, icon: Scan },
  ];

  return (
    <>
      {/* Back + actions header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/users">
          <motion.button
            whileHover={{ x: -2 }}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </motion.button>
        </Link>
        <div className="flex items-center gap-2">
          {user.qrCode && (
            <button
              onClick={() => setModal({ open: true, type: 'deleteQr' })}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-amber-400/80 hover:text-amber-400 bg-amber-400/5 hover:bg-amber-400/10 border border-amber-400/10 rounded-xl transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              Delete QR
            </button>
          )}
          <button
            onClick={() => setModal({ open: true, type: 'deleteUser' })}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400/80 hover:text-red-400 bg-red-400/5 hover:bg-red-400/10 border border-red-400/10 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl overflow-hidden mb-6"
      >
        <div className="p-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF2D55] to-[#FF6B35] flex items-center justify-center flex-shrink-0 text-xl font-bold text-white overflow-hidden">
              {user.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white">{user.name}</h2>
                {user.isAdmin && (
                  <span className="text-[10px] font-bold text-[#FF2D55] bg-[#FF2D55]/10 px-2 py-0.5 rounded">ADMIN</span>
                )}
                {!user.isActive && (
                  <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">INACTIVE</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm">
                <div className="flex items-center gap-2 text-white/50">
                  <Mail className="w-3.5 h-3.5 text-white/30" />
                  {user.email}
                </div>
                <div className="flex items-center gap-2 text-white/50">
                  <Phone className="w-3.5 h-3.5 text-white/30" />
                  {user.phone}
                </div>
                <div className="flex items-center gap-2 text-white/50">
                  <Calendar className="w-3.5 h-3.5 text-white/30" />
                  Joined {formatDate(user.createdAt)}
                </div>
                <div className="flex items-center gap-2 text-white/50">
                  <Shield className="w-3.5 h-3.5 text-white/30" />
                  QR: {user.qrCode ? 'Active' : 'None'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 border-t border-white/5">
          <div className="text-center py-3 border-r border-white/5">
            <p className="text-lg font-bold text-white">{user._count.qrScans}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Total Scans</p>
          </div>
          <div className="text-center py-3 border-r border-white/5">
            <p className="text-lg font-bold text-white">{user.emergencyContacts.length}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Contacts</p>
          </div>
          <div className="text-center py-3">
            <p className="text-lg font-bold text-white">{user.isActive ? 'Yes' : 'No'}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Active</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 p-1 rounded-xl bg-white/[0.03] border border-white/5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-[#FF2D55]/10 text-[#FF2D55]'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'contacts' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden"
        >
          {user.emergencyContacts.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No emergency contacts</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Relationship</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Primary</th>
                </tr>
              </thead>
              <tbody>
                {user.emergencyContacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5 text-white/30" />
                      {contact.name}
                    </td>
                    <td className="px-4 py-3 text-white/60">{contact.phone}</td>
                    <td className="px-4 py-3 text-white/60">{contact.relationship}</td>
                    <td className="px-4 py-3 text-center">
                      {contact.isPrimary ? (
                        <span className="text-emerald-400 text-xs font-medium bg-emerald-400/10 px-2 py-0.5 rounded-full">Primary</span>
                      ) : (
                        <span className="text-white/20 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      )}

      {activeTab === 'scans' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden"
        >
          {user.qrScans.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <Scan className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No scan history</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Date/Time</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Scanner</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider">IP</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {user.qrScans.map((scan) => (
                    <tr key={scan.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-white/60 text-xs">{formatDateTime(scan.createdAt)}</td>
                      <td className="px-4 py-3">
                        {scan.scanner ? (
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-3 h-3 text-[#64D2FF]" />
                            <span className="text-white/70 text-xs">{scan.scanner.name}</span>
                          </div>
                        ) : (
                          <span className="text-white/30 text-xs flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            Anonymous
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs font-mono">{scan.scannerIp || '—'}</td>
                      <td className="px-4 py-3 text-white/40 text-xs">
                        {scan.location ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {scan.location}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Modals */}
      <ConfirmModal
        open={modal.open && modal.type === 'deleteUser'}
        title="Delete Account"
        description={`Are you sure you want to permanently delete ${user.name}'s account (${user.email})? This will remove all their data. This action cannot be undone.`}
        confirmLabel="Delete Account"
        onConfirm={handleDeleteUser}
        onCancel={() => setModal({ ...modal, open: false })}
        loading={modalLoading}
      />
      <ConfirmModal
        open={modal.open && modal.type === 'deleteQr'}
        title="Delete QR Code"
        description={`Are you sure you want to delete the QR code for ${user.name}? They will need to generate a new one.`}
        confirmLabel="Delete QR Code"
        onConfirm={handleDeleteQr}
        onCancel={() => setModal({ ...modal, open: false })}
        loading={modalLoading}
      />
    </>
  );
}
