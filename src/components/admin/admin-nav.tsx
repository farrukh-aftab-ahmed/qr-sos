'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, Users, ArrowLeft, Shield, Menu, X, LogOut, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { getInitials } from '@/lib/utils';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/users', icon: Users, label: 'Users' },
];

export function AdminNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = session?.user as { name?: string; email?: string; profileImage?: string; isAdmin?: boolean } | undefined;

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    };
    if (sidebarOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sidebarOpen]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
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
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#0a0a12]/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <Shield className="w-4 h-4 text-[#FF2D55]" />
            <span className="text-sm font-bold text-white/90">Admin Panel</span>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/8 transition-colors"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#FF2D55] to-[#FF6B35] flex items-center justify-center flex-shrink-0 ring-2 ring-white/10">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">{getInitials(user?.name || 'U')}</span>
              )}
            </div>
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden border border-white/10 bg-[#0e0e16] shadow-[0_8px_40px_rgba(0,0,0,0.8)]"
              >
                <div className="p-1.5 space-y-0.5">
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/6 text-sm transition-colors cursor-pointer">
                      <ArrowLeft className="w-4 h-4 text-[#64D2FF]" />
                      Back to Dashboard
                    </div>
                  </Link>
                  <div className="h-px bg-white/8 my-1" />
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 text-sm transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 bg-[#0a0a12] border-r border-white/5
          flex flex-col transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF2D55] to-[#FF6B35] flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Admin Panel</p>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">QR-SOS</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1">
          {/* Back to Dashboard - moved to top */}
          <Link href="/dashboard">
            <motion.div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </motion.div>
          </Link>

          <div className="h-px bg-white/5 my-2" />

          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#FF2D55]/10 text-[#FF6B35]'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {active && (
                    <motion.div
                      layoutId="admin-nav-indicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF2D55]"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer: user menu */}
        <div className="p-3 border-t border-white/5">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#FF2D55] to-[#FF6B35] flex items-center justify-center flex-shrink-0">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-bold">{getInitials(user?.name || 'U')}</span>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
              </div>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  className="absolute left-0 bottom-full mb-2 w-56 rounded-2xl overflow-hidden border border-white/10 bg-[#0e0e16] shadow-[0_8px_40px_rgba(0,0,0,0.8)]"
                >
                  <div className="p-1.5 space-y-0.5">
                    <Link href="/profile" onClick={() => setMenuOpen(false)}>
                      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/6 text-sm transition-colors cursor-pointer">
                        <User className="w-4 h-4 text-[#FF6B35]" />
                        Edit Profile
                      </div>
                    </Link>
                    <div className="h-px bg-white/8 my-1" />
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 text-sm transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>
    </>
  );
}
