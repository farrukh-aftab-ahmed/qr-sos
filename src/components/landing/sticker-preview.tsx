'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Shield, Download, Printer } from 'lucide-react';
import Link from 'next/link';
import { StickerMockup } from '@/components/ui/sticker-mockup';

export function StickerPreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="sticker" className="py-24 px-6 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-sos-darker to-[#0d0418]/30" />

      <div className="relative max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <span className="text-[#FF2D55] text-sm font-medium tracking-widest uppercase mb-4 block">
              Your Safety Sticker
            </span>
            <h2 className="font-display font-black text-4xl md:text-5xl text-white mb-6">
              A Sticker That Could
              <span className="gradient-text"> Save Your Life</span>
            </h2>
            <p className="text-white/60 text-lg leading-relaxed mb-8">
              Your QR-SOS sticker is beautifully designed, weatherproof-ready, and packed with your
              emergency data. Print it, laminate it, and stick it on your vehicle in seconds.
            </p>

            <div className="space-y-4 mb-10">
              {[
                { icon: Download, text: 'Download as print-ready sticker', sub: 'High resolution, infinitely scalable' },
                { icon: Printer, text: 'Print at any size', sub: 'From 5cm stickers to full page' },
                { icon: Shield, text: 'Instantly regenerate if needed', sub: 'New code, same profile' },
              ].map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#FF2D55]/10 border border-[#FF2D55]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="w-4 h-4 text-[#FF2D55]" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{item.text}</p>
                    <p className="text-white/40 text-xs">{item.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Link href="/register">
              <motion.button
                className="sos-button px-8 py-4 text-base flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Shield className="w-5 h-5" />
                Get Your Sticker Free
              </motion.button>
            </Link>
          </motion.div>

          {/* Right — Sticker mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
            animate={inView ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, type: 'spring', stiffness: 80 }}
            className="relative flex items-center justify-center"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              {/* Glow */}
              <div className="absolute inset-0 bg-[#FF2D55]/20 blur-3xl rounded-3xl scale-110" />

              {/* Sticker mockup — matches the real downloadable sticker */}
              <StickerMockup className="w-[240px] shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_60px_rgba(200,16,46,0.3)]" />
            </motion.div>

            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.6 }}
              className="absolute -right-4 top-1/4 glass-card px-3 py-2 border border-white/10"
            >
              <div className="flex items-center gap-2">
                <Download className="w-3.5 h-3.5 text-[#30D158]" />
                <span className="text-white text-xs font-medium">Sticker Download</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.7 }}
              className="absolute -left-4 bottom-1/4 glass-card px-3 py-2 border border-white/10"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#FF2D55]" />
                <span className="text-white text-xs font-medium">Scan Protected</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
