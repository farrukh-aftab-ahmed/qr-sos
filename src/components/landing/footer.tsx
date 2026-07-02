'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="QR-SOS"
              width={100}
              height={100}
              className="h-9 w-auto object-contain"
            />
          </Link>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/40">
            <Link href="/privacy" className="hover:text-white/70 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white/70 transition-colors">Terms of Service</Link>
            <Link href="/support" className="hover:text-white/70 transition-colors">Support</Link>
            <Link href="/about" className="hover:text-white/70 transition-colors">About</Link>
          </div>

          <p className="text-white/20 text-xs">
            © {new Date().getFullYear()} QR-SOS. Built for safety.
          </p>
        </div>
      </div>
    </footer>
  );
}
