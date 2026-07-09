'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Bell, Lock, Smartphone, Globe, Zap, Heart,
  Eye, MapPin, Download, RefreshCw, Shield, Users
} from 'lucide-react';

const features = [
  { icon: Bell, title: 'Instant Scan Alerts', desc: 'Real-time push & email notifications when your QR is scanned.', accent: '#FF2D55' },
  { icon: Lock, title: 'Privacy Protected', desc: 'Scanners must register before seeing any contact details.', accent: '#FF6B35' },
  { icon: Smartphone, title: 'Works on Any Phone', desc: 'Native camera scanner — no app download needed.', accent: '#FFD60A' },
  { icon: Download, title: 'Print-Ready Sticker', desc: 'High-quality sticker, ready to print and laminate.', accent: '#30D158' },
  { icon: Users, title: 'Multiple Emergency Contacts', desc: 'Add up to 3 emergency contacts with relationship info.', accent: '#64D2FF' },
  { icon: Eye, title: 'Scan History', desc: 'See who scanned your code, when, and from where.', accent: '#BF5AF2' },
  { icon: Shield, title: 'Verified Profiles', desc: 'Email and phone verification builds scanner trust.', accent: '#FF2D55' },
  { icon: RefreshCw, title: 'Live QR Regeneration', desc: 'Instantly regenerate your QR if ever compromised.', accent: '#FF6B35' },
  { icon: Globe, title: 'Works Worldwide', desc: 'Accessible in any country with mobile internet.', accent: '#FFD60A' },
  { icon: Heart, title: 'Emergency Medical Info', desc: 'Add blood type, allergies, and medical notes.', accent: '#30D158' },
  { icon: MapPin, title: 'Location Context', desc: 'Scan location data helps first responders act fast.', accent: '#64D2FF' },
  { icon: Zap, title: 'Instant Setup', desc: 'Profile and QR ready in under 2 minutes.', accent: '#BF5AF2' },
];

export function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="features" className="py-24 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[#FF2D55] text-sm font-medium tracking-widest uppercase mb-4 block">
            Everything You Need
          </span>
          <h2 className="font-display font-black text-4xl md:text-5xl text-white mb-4">
            Packed With Safety Features
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            QR-SOS is built ground-up for real emergencies and daily peace of mind.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-card p-5 cursor-default group"
            >
              <motion.div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{
                  background: `${feature.accent}15`,
                  border: `1px solid ${feature.accent}30`,
                }}
                whileHover={{ rotate: 10, scale: 1.15 }}
              >
                <feature.icon className="w-5 h-5" style={{ color: feature.accent }} />
              </motion.div>
              <h3 className="font-semibold text-white text-sm mb-1">{feature.title}</h3>
              <p className="text-white/40 text-xs leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
