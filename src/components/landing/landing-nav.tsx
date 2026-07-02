'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export function LandingNav() {
  const { data: session } = useSession();
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      style={{}}
    >
      <motion.div
        className="absolute inset-0 bg-sos-darker/90 backdrop-blur-xl border-b border-white/5"
        style={{ opacity: bgOpacity }}
      />
      <nav className="relative max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <Image
              src="/logo.png"
              alt="QR-SOS"
              width={120}
              height={120}
              className="h-10 w-auto object-contain drop-shadow-[0_0_8px_rgba(255,45,85,0.35)]"
              priority
            />
          </motion.div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { href: '#how-it-works', label: 'How It Works' },
            { href: '#features', label: 'Features' },
            { href: '#sticker', label: 'Your Sticker' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-white/60 hover:text-white text-sm font-medium transition-colors duration-200"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <Link href="/dashboard">
              <motion.button
                className="sos-button px-5 py-2.5 text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Dashboard
              </motion.button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <motion.button
                  className="text-white/70 hover:text-white text-sm font-medium transition-colors px-4 py-2"
                  whileHover={{ scale: 1.02 }}
                >
                  Sign In
                </motion.button>
              </Link>
              <Link href="/register">
                <motion.button
                  className="sos-button px-5 py-2.5 text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started Free
                </motion.button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white/70 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative md:hidden mt-4 glass-card p-6 mx-0"
        >
          <div className="flex flex-col gap-4">
            {[
              { href: '#how-it-works', label: 'How It Works' },
              { href: '#features', label: 'Features' },
              { href: '#sticker', label: 'Your Sticker' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-white/70 hover:text-white text-sm font-medium"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <Link href="/login" className="text-center py-2.5 text-white/70 text-sm">Sign In</Link>
              <Link href="/register" className="sos-button text-center py-3 text-sm">Get Started Free</Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
