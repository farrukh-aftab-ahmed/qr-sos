'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, User, Bell, LogOut, QrCode, Shield } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { getInitials } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/notifications', icon: Bell, label: 'Alerts' },
  { href: '/admin/dashboard', icon: Shield, label: 'Admin', adminOnly: true },
];

export function DashboardNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = session?.user as { name?: string; email?: string; profileImage?: string; isAdmin?: boolean } | undefined;

  // Poll for unread notification count every 15s
  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=1');
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15_000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Reset badge when user visits /notifications
  useEffect(() => {
    if (pathname === '/notifications') setUnreadCount(0);
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 bg-sos-darker/90 backdrop-blur-xl border-b border-white/5"
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/dashboard" className="flex-shrink-0">
          <Image
            src="/logo.png"
            alt="QR-SOS"
            width={110}
            height={110}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>

        {/* Center nav items */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            // Skip admin-only items if user is not admin
            if ('adminOnly' in item && item.adminOnly && !user?.isAdmin) return null;

            const active = pathname === item.href;
            const isBell = item.icon === Bell;
            const showBadge = isBell && unreadCount > 0;
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active
                      ? 'bg-[#FF2D55]/15 text-[#FF6B35]'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative">
                    <item.icon className="w-4 h-4" />
                    {showBadge && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FF2D55] border border-sos-darker"
                      />
                    )}
                  </span>
                  <span className="hidden md:block">{item.label}</span>
                  {showBadge && (
                    <span className="hidden md:flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF2D55] text-white text-[10px] font-bold leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Right: avatar + dropdown */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/8 transition-colors"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#FF2D55] to-[#FF6B35] flex items-center justify-center flex-shrink-0 ring-2 ring-white/10">
              {user?.profileImage ? (
                // Use plain <img> — src can be a Cloudinary URL or a base64 data URL
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-xs font-bold">
                  {getInitials(user?.name || 'U')}
                </span>
              )}
            </div>
          </button>

          {/* Dropdown — solid dark background so text is always readable */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden
                           border border-white/10
                           bg-[#0e0e16]
                           shadow-[0_8px_40px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.04)]"
              >
                {/* User info header */}
                <div className="flex items-center gap-3 p-3.5 border-b border-white/8">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-[#FF2D55] to-[#FF6B35] flex-shrink-0 flex items-center justify-center">
                    {user?.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-bold">
                        {getInitials(user?.name || 'U')}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{user?.name}</p>
                    <p className="text-white/40 text-xs truncate">{user?.email}</p>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1.5 space-y-0.5">
                  <Link href="/profile" onClick={() => setMenuOpen(false)}>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                                    text-white/70 hover:text-white hover:bg-white/6
                                    text-sm transition-colors cursor-pointer">
                      <User className="w-4 h-4 text-[#FF6B35]" />
                      Edit Profile
                    </div>
                  </Link>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                                    text-white/70 hover:text-white hover:bg-white/6
                                    text-sm transition-colors cursor-pointer">
                      <QrCode className="w-4 h-4 text-[#64D2FF]" />
                      My QR Code
                    </div>
                  </Link>
                  <div className="h-px bg-white/8 my-1" />
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                               text-red-400/70 hover:text-red-400 hover:bg-red-500/10
                               text-sm transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </nav>
    </motion.header>
  );
}
