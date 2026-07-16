'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Trash2, QrCode, Eye, ChevronLeft, ChevronRight, Users as UsersIcon } from 'lucide-react';
import Link from 'next/link';
import { ConfirmModal } from './confirm-modal';

interface UserRow {
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
  _count: { qrScans: number; emergencyContacts: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function UsersTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Confirm modal state
  const [modal, setModal] = useState<{
    open: boolean;
    type: 'deleteUser' | 'deleteQr';
    user: UserRow | null;
  }>({ open: false, type: 'deleteUser', user: null });
  const [modalLoading, setModalLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async (page: number, searchTerm: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1, debouncedSearch);
  }, [debouncedSearch, fetchUsers]);

  const handlePageChange = (page: number) => {
    fetchUsers(page, debouncedSearch);
  };

  const handleDeleteUser = async () => {
    if (!modal.user) return;
    setModalLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${modal.user.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setModal({ open: false, type: 'deleteUser', user: null });
      fetchUsers(pagination.page, debouncedSearch);
    } catch {
      console.error('Failed to delete user');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteQr = async () => {
    if (!modal.user) return;
    setModalLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${modal.user.id}/qr`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setModal({ open: false, type: 'deleteQr', user: null });
      fetchUsers(pagination.page, debouncedSearch);
    } catch {
      console.error('Failed to delete QR');
    } finally {
      setModalLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#FF2D55]/50 focus:ring-2 focus:ring-[#FF2D55]/20 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Phone</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider">QR Code</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Scans</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Contacts</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Joined</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-white/5 animate-pulse" style={{ width: j === 0 ? '60%' : '40%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-white/30">
                    <UsersIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * i }}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF2D55] to-[#FF6B35] flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white overflow-hidden">
                          {user.profileImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate flex items-center gap-1.5">
                            {user.name}
                            {user.isAdmin && (
                              <span className="text-[10px] font-bold text-[#FF2D55] bg-[#FF2D55]/10 px-1.5 py-0.5 rounded">ADMIN</span>
                            )}
                          </p>
                          <p className="text-white/40 text-xs truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/60">{user.phone}</td>
                    <td className="px-4 py-3 text-center">
                      {user.qrCode ? (
                        <span className="text-emerald-400 text-xs font-medium bg-emerald-400/10 px-2 py-0.5 rounded-full">Active</span>
                      ) : (
                        <span className="text-white/20 text-xs">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-white/60">{user._count.qrScans}</td>
                    <td className="px-4 py-3 text-center text-white/60">{user._count.emergencyContacts}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/users/${user.id}`}>
                          <button className="p-1.5 rounded-lg text-white/30 hover:text-[#64D2FF] hover:bg-[#64D2FF]/10 transition-colors" title="View Details">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                        {user.qrCode && (
                          <button
                            onClick={() => setModal({ open: true, type: 'deleteQr', user })}
                            className="p-1.5 rounded-lg text-white/30 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                            title="Delete QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setModal({ open: true, type: 'deleteUser', user })}
                          className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          title="Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <p className="text-xs text-white/30">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let page: number;
                if (pagination.totalPages <= 5) {
                  page = i + 1;
                } else if (pagination.page <= 3) {
                  page = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  page = pagination.totalPages - 4 + i;
                } else {
                  page = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      page === pagination.page
                        ? 'bg-[#FF2D55]/15 text-[#FF2D55]'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal
        open={modal.open && modal.type === 'deleteUser'}
        title="Delete Account"
        description={`Are you sure you want to permanently delete ${modal.user?.name}'s account (${modal.user?.email})? This will remove all their data including QR codes, scan history, emergency contacts, and notifications. This action cannot be undone.`}
        confirmLabel="Delete Account"
        onConfirm={handleDeleteUser}
        onCancel={() => setModal({ ...modal, open: false })}
        loading={modalLoading}
      />
      <ConfirmModal
        open={modal.open && modal.type === 'deleteQr'}
        title="Delete QR Code"
        description={`Are you sure you want to delete the QR code for ${modal.user?.name} (${modal.user?.email})? The user will need to generate a new QR code. Their scan history will be preserved.`}
        confirmLabel="Delete QR Code"
        onConfirm={handleDeleteQr}
        onCancel={() => setModal({ ...modal, open: false })}
        loading={modalLoading}
      />
    </>
  );
}
