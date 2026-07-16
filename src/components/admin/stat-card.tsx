'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: string;
  color?: string;
  delay?: number;
}

export function StatCard({ label, value, icon: Icon, trend, color = '#FF2D55', delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl p-5"
    >
      {/* Glow */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && (
          <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>

      <p className="text-2xl font-bold text-white tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-white/40 mt-1 uppercase tracking-wider">{label}</p>
    </motion.div>
  );
}
