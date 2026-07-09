'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import { Shield, Zap, QrCode, ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { StickerMockup } from '@/components/ui/sticker-mockup';

// --------------------------------------------------------------------------
// Particle type
// --------------------------------------------------------------------------
type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
};

export function HeroSection() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  const rotateX = useTransform(springY, [-300, 300], [5, -5]);
  const rotateY = useTransform(springX, [-300, 300], [-5, 5]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Particles are generated client-side only to avoid SSR ↔ client mismatch
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left - rect.width / 2);
      mouseY.set(e.clientY - rect.top - rect.height / 2);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 10 + 8,
        delay: Math.random() * 5,
      }))
    );
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-sos-hero pt-20"
    >
      {/* Animated grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,45,85,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,45,85,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Radial glow */}
      <motion.div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,45,85,0.12) 0%, transparent 70%)',
          x: useTransform(springX, [-300, 300], [-30, 30]),
          y: useTransform(springY, [-300, 300], [-30, 30]),
        }}
      />

      {/* Floating particles — only rendered after client mount */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#FF2D55]/30"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-[#FF2D55]/10 border border-[#FF2D55]/30 rounded-full px-4 py-2 mb-8"
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-[#FF2D55]"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[#FF6B35] text-sm font-medium">Life-Saving Technology</span>
          <Zap className="w-3.5 h-3.5 text-[#FFD60A]" fill="currentColor" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display font-black text-5xl md:text-7xl lg:text-8xl leading-[0.9] mb-6"
        >
          <span className="text-white">One Scan.</span>
          <br />
          <span className="gradient-text">Save a Life.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Place your personalized QR-SOS sticker on your vehicle. In an emergency or when your
          car is parked, anyone can instantly scan it to reach your emergency contacts.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link href="/register">
            <motion.button
              className="sos-button px-8 py-4 text-base flex items-center gap-2 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Shield className="w-5 h-5" />
              Create Your Safety Profile
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </motion.button>
          </Link>
          <Link href="#how-it-works">
            <motion.button
              className="px-8 py-4 text-base text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <QrCode className="w-5 h-5" />
              See How It Works
            </motion.button>
          </Link>
        </motion.div>

        {/* 3D QR card preview */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.4, type: 'spring', stiffness: 80 }}
          style={{ rotateX, rotateY, perspective: 1000 }}
          className="relative inline-block"
        >
          <div className="relative">
            {/* Glow behind sticker */}
            <div className="absolute inset-0 bg-[#C8102E]/20 blur-3xl rounded-3xl scale-110" />

            {/* Real sticker mockup */}
            <div className="relative">
              <StickerMockup className="w-[220px] mx-auto shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_60px_rgba(200,16,46,0.25)]" />
              {/* Pulse ring */}
              <motion.div
                className="absolute -inset-2 rounded-[22px] border border-[#C8102E]/40"
                animate={{ opacity: [0, 0.6, 0], scale: [0.97, 1.03, 0.97] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
          </div>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-12 text-white/30 text-xs"
        >
          {['Free to Register', 'Instant QR Generation', 'Real-time Notifications', 'Privacy First'].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-[#FF2D55]" />
              {item}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-sos-darker to-transparent" />
    </section>
  );
}
