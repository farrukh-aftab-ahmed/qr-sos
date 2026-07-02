'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Shield, Download, Printer } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Deterministic mock QR pattern for the sticker preview (no Math.random in render)
const MOCK_QR_64 = Array.from({ length: 64 }, (_, i) => ({
  opacity: (i * 7 + 5) % 11 > 3 ? 1 : 0,
  animateOpacity: (i * 13 + 7) % 10 > 7 ? 0 : 1,
}));

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
                { icon: Download, text: 'Download as print-ready SVG', sub: 'High resolution, infinitely scalable' },
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

              {/* Sticker SVG mockup */}
              <div
                className="relative rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_60px_rgba(255,45,85,0.15)]"
                style={{ width: 280, background: 'linear-gradient(135deg, #0A0A0F, #1a0a2e)' }}
              >
                <div className="p-8">
                  {/* Top bar */}
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-[#FF2D55] to-[#FF6B35] mb-6" />

                  {/* SOS logo */}
                  <div className="text-center mb-5">
                    <Image
                      src="/logo.png"
                      alt="QR-SOS"
                      width={100}
                      height={100}
                      className="h-12 w-auto object-contain mx-auto"
                    />
                  </div>

                  {/* QR placeholder */}
                  <div className="bg-white rounded-xl p-3 mb-5 shadow-[0_0_20px_rgba(255,45,85,0.15)]">
                    <div className="aspect-square w-full grid grid-cols-8 gap-0.5 p-1">
                      {MOCK_QR_64.map((cell, i) => (
                        <motion.div
                          key={i}
                          className="rounded-[1px] bg-gray-900"
                          style={{ opacity: cell.opacity }}
                          animate={{ opacity: [null, cell.animateOpacity] }}
                          transition={{
                            duration: 3,
                            delay: i * 0.05,
                            repeat: Infinity,
                            repeatType: 'reverse',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Scan badge */}
                  <div className="flex items-center justify-center gap-1 bg-[#FF2D55]/10 border border-[#FF2D55]/20 rounded-full py-1.5 px-3 mb-4">
                    <span className="text-[10px] text-[#FF6B35] font-medium tracking-wider">📱 SCAN IN EMERGENCY</span>
                  </div>

                  <div className="text-center">
                    <p className="text-white font-bold text-base">ALEX JOHNSON</p>
                    <p className="text-white/30 text-[9px] tracking-widest mt-1">ID: A7F2B1 · qr-sos.com</p>
                  </div>

                  {/* Corner decorations */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#FF2D55]/40 rounded-tl" />
                  <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#FF2D55]/40 rounded-tr" />
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#FF2D55]/40 rounded-bl" />
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#FF2D55]/40 rounded-br" />
                </div>
              </div>
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
                <span className="text-white text-xs font-medium">SVG Download</span>
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
