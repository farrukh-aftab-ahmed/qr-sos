'use client';

import { motion, useInView, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { useRef, useEffect } from 'react';

const stats = [
  { value: 50000, suffix: '+', label: 'Registered Users', prefix: '' },
  { value: 1.2, suffix: 'M', label: 'QR Scans Logged', prefix: '' },
  { value: 99.9, suffix: '%', label: 'Uptime SLA', prefix: '' },
  { value: 2, suffix: 's', label: 'Avg Response Time', prefix: '<' },
];

function AnimatedNumber({ value, suffix, prefix }: { value: number; suffix: string; prefix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, value, {
      duration: 2,
      ease: 'easeOut',
      onUpdate(v) {
        if (ref.current) {
          ref.current.textContent =
            prefix + (Number.isInteger(value) ? Math.floor(v).toLocaleString() : v.toFixed(1)) + suffix;
        }
      },
    });
    return () => controls.stop();
  }, [inView, value, suffix, prefix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

export function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-20 px-6 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-r from-[#FF2D55]/5 via-transparent to-[#FF6B35]/5" />

      <div className="relative max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="font-display font-black text-4xl md:text-5xl gradient-text mb-2">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
              </div>
              <p className="text-white/40 text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
