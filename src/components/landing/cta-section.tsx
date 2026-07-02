'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import { Shield, ArrowRight, Zap } from 'lucide-react';

export function CTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-24 px-6" ref={ref}>
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, type: 'spring', stiffness: 80 }}
          className="relative glass-card p-12 md:p-16 border border-[#FF2D55]/20 overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF2D55]/8 via-transparent to-[#FF6B35]/8" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-[#FF2D55] to-transparent" />

          {/* Animated background orbs */}
          <motion.div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#FF2D55]/10 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-[#FF6B35]/10 blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
            transition={{ duration: 5, repeat: Infinity }}
          />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-[#FF2D55]/10 border border-[#FF2D55]/30 rounded-full px-4 py-2 mb-6"
            >
              <Zap className="w-3.5 h-3.5 text-[#FFD60A]" fill="currentColor" />
              <span className="text-[#FF6B35] text-sm font-medium">Free Forever · No Credit Card</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15 }}
              className="font-display font-black text-4xl md:text-6xl text-white mb-4"
            >
              Your Safety is{' '}
              <span className="gradient-text">One Scan Away</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="text-white/60 text-lg mb-10 max-w-xl mx-auto"
            >
              Join thousands who have turned a simple QR code into a powerful safety net.
              Setup is free and takes less than 2 minutes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.25 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/register">
                <motion.button
                  className="sos-button px-10 py-4 text-lg flex items-center gap-3"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Shield className="w-5 h-5" />
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link href="/login">
                <motion.button
                  className="px-8 py-4 text-base text-white/60 hover:text-white transition-colors"
                  whileHover={{ scale: 1.02 }}
                >
                  Already have an account? Sign In
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
