'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { UserPlus, QrCode, Car, PhoneCall } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    number: '01',
    title: 'Create Your Profile',
    description: 'Register with your name, phone, photo, and emergency contacts. Takes under 2 minutes.',
    color: '#FF2D55',
  },
  {
    icon: QrCode,
    number: '02',
    title: 'Get Your QR Sticker',
    description: 'Download your unique, personalized QR sticker — beautifully designed and ready to print.',
    color: '#FF6B35',
  },
  {
    icon: Car,
    number: '03',
    title: 'Place It On Your Vehicle',
    description: 'Stick it on your windshield, bumper, or window. Weatherproof and tamper-evident.',
    color: '#FFD60A',
  },
  {
    icon: PhoneCall,
    number: '04',
    title: 'Get Instant Alerts',
    description: 'Whenever someone scans your code, you get notified in real-time — stay aware, stay safe.',
    color: '#30D158',
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="how-it-works" className="py-24 px-6 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-sos-darker via-[#0d0418]/50 to-sos-darker" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[#FF2D55] text-sm font-medium tracking-widest uppercase mb-4 block">
            Simple Process
          </span>
          <h2 className="font-display font-black text-4xl md:text-5xl text-white mb-4">
            How QR-SOS Works
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            From registration to protection in under 5 minutes.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative group"
            >
              <div className="glass-card p-6 h-full group-hover:border-white/20 transition-all duration-300 group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                {/* Number */}
                <div className="text-6xl font-display font-black text-white/5 mb-4 leading-none">
                  {step.number}
                </div>

                {/* Icon */}
                <motion.div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${step.color}20`, border: `1px solid ${step.color}40` }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <step.icon className="w-6 h-6" style={{ color: step.color }} />
                </motion.div>

                <h3 className="font-bold text-white text-lg mb-2">{step.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{step.description}</p>

                {/* Hover glow */}
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${step.color}08, transparent 70%)`,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
