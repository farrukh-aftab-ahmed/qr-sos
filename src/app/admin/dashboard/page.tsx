'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, QrCode, Scan, UserPlus, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { StatCard } from '@/components/admin/stat-card';
import { MiniChart } from '@/components/admin/mini-chart';

interface Stats {
  totalUsers: number;
  totalQrCodes: number;
  totalScans: number;
  anonymousScans: number;
  registeredScans: number;
  newToday: number;
  newThisMonth: number;
}

interface TimeSeriesPoint {
  date: string;
  count?: number;
  total?: number;
  anonymous?: number;
  registered?: number;
}

type Range = '7d' | '30d' | '12m';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [signupData, setSignupData] = useState<TimeSeriesPoint[]>([]);
  const [scanData, setScanData] = useState<TimeSeriesPoint[]>([]);
  const [signupRange, setSignupRange] = useState<Range>('30d');
  const [scanRange, setScanRange] = useState<Range>('30d');
  const [scanType, setScanType] = useState<'all' | 'anonymous' | 'registered'>('all');
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchSignups = useCallback(async (range: Range) => {
    try {
      const res = await fetch(`/api/admin/signups?range=${range}`);
      if (res.ok) {
        const data = await res.json();
        setSignupData(data.data);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchScans = useCallback(async (range: Range, type: string) => {
    try {
      const res = await fetch(`/api/admin/scans?range=${range}&type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setScanData(data.data);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchSignups(signupRange), fetchScans(scanRange, scanType)]).finally(() =>
      setLoading(false)
    );
  }, [fetchStats, fetchSignups, fetchScans, signupRange, scanRange, scanType]);

  const ranges: { label: string; value: Range }[] = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '12M', value: '12m' },
  ];

  return (
    <div>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-sm text-white/40 mt-1">Monitor your QR-SOS platform at a glance</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? '—'}
          icon={Users}
          trend={stats ? `+${stats.newToday} today` : undefined}
          color="#FF2D55"
          delay={0}
        />
        <StatCard
          label="Active QR Codes"
          value={stats?.totalQrCodes ?? '—'}
          icon={QrCode}
          color="#FF6B35"
          delay={0.1}
        />
        <StatCard
          label="Total Scans"
          value={stats?.totalScans ?? '—'}
          icon={Scan}
          color="#64D2FF"
          delay={0.2}
        />
        <StatCard
          label="New This Month"
          value={stats?.newThisMonth ?? '—'}
          icon={UserPlus}
          color="#30D158"
          delay={0.3}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Signups Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FF2D55]" />
              <h3 className="text-sm font-semibold text-white">Signups</h3>
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5">
              {ranges.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSignupRange(r.value)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                    signupRange === r.value
                      ? 'bg-[#FF2D55]/15 text-[#FF2D55]'
                      : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="h-[200px] rounded-xl bg-white/[0.02] animate-pulse" />
          ) : (
            <MiniChart
              data={signupData}
              dataKey="count"
              color="#FF2D55"
              type="line"
              height={200}
            />
          )}
        </motion.div>

        {/* Scans Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scan className="w-4 h-4 text-[#64D2FF]" />
              <h3 className="text-sm font-semibold text-white">QR Scans</h3>
            </div>
            <div className="flex items-center gap-3">
              {/* Scan type filter */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5">
                <button
                  onClick={() => setScanType('all')}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                    scanType === 'all' ? 'bg-[#64D2FF]/15 text-[#64D2FF]' : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setScanType('anonymous')}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                    scanType === 'anonymous' ? 'bg-[#64D2FF]/15 text-[#64D2FF]' : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  <EyeOff className="w-2.5 h-2.5" />
                  Anon
                </button>
                <button
                  onClick={() => setScanType('registered')}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                    scanType === 'registered' ? 'bg-[#64D2FF]/15 text-[#64D2FF]' : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  <Eye className="w-2.5 h-2.5" />
                  Reg
                </button>
              </div>
              {/* Range */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5">
                {ranges.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setScanRange(r.value)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                      scanRange === r.value
                        ? 'bg-[#64D2FF]/15 text-[#64D2FF]'
                        : 'text-white/30 hover:text-white/50'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {loading ? (
            <div className="h-[200px] rounded-xl bg-white/[0.02] animate-pulse" />
          ) : (
            <MiniChart
              data={scanData}
              dataKey="anonymous"
              secondaryKey="registered"
              color="#FF2D55"
              secondaryColor="#64D2FF"
              type="bar"
              height={200}
            />
          )}
          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 text-[10px] text-white/40">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-[#FF2D55]" />
              Anonymous
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-[#64D2FF]" />
              Registered
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden"
      >
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Scan Breakdown</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
          <div className="p-5 text-center">
            <p className="text-2xl font-bold text-white">{stats?.totalScans.toLocaleString() ?? '—'}</p>
            <p className="text-xs text-white/30 mt-1">Total Scans</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-2xl font-bold text-[#FF2D55]">{stats?.anonymousScans.toLocaleString() ?? '—'}</p>
            <p className="text-xs text-white/30 mt-1">Anonymous Scans</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-2xl font-bold text-[#64D2FF]">{stats?.registeredScans.toLocaleString() ?? '—'}</p>
            <p className="text-xs text-white/30 mt-1">Registered Scans</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
