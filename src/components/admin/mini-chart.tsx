'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface DataPoint {
  date: string;
  [key: string]: string | number;
}

interface MiniChartProps {
  data: DataPoint[];
  dataKey: string;
  secondaryKey?: string;
  color?: string;
  secondaryColor?: string;
  height?: number;
  type?: 'bar' | 'line';
  showLabels?: boolean;
}

export function MiniChart({
  data,
  dataKey,
  secondaryKey,
  color = '#FF2D55',
  secondaryColor = '#64D2FF',
  height = 200,
  type = 'bar',
  showLabels = true,
}: MiniChartProps) {
  const maxVal = useMemo(() => {
    let max = 0;
    for (const d of data) {
      const primary = Number(d[dataKey]) || 0;
      const secondary = secondaryKey ? Number(d[secondaryKey]) || 0 : 0;
      const stacked = type === 'bar' && secondaryKey ? primary + secondary : Math.max(primary, secondary);
      if (stacked > max) max = stacked;
    }
    return max || 1;
  }, [data, dataKey, secondaryKey, type]);

  const padding = { top: 10, right: 10, bottom: showLabels ? 30 : 10, left: 10 };
  const chartWidth = 600;
  const chartH = height;
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-white/20 text-sm rounded-xl border border-white/5 bg-white/[0.02]"
        style={{ height }}
      >
        No data
      </div>
    );
  }

  if (type === 'line') {
    const points = data.map((d, i) => {
      const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerW;
      const y = padding.top + innerH - ((Number(d[dataKey]) || 0) / maxVal) * innerH;
      return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaPath = `${linePath} L${points[points.length - 1].x},${padding.top + innerH} L${points[0].x},${padding.top + innerH} Z`;

    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <svg viewBox={`0 0 ${chartWidth} ${chartH}`} className="w-full" style={{ height }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={areaPath}
            fill={`url(#grad-${dataKey})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />
          <motion.path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          {/* Dots */}
          {points.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3"
              fill={color}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
            />
          ))}
          {/* X Labels */}
          {showLabels &&
            data.map((d, i) => {
              if (data.length > 15 && i % Math.ceil(data.length / 8) !== 0) return null;
              const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerW;
              const label = d.date.length > 7 ? d.date.slice(5) : d.date;
              return (
                <text
                  key={i}
                  x={x}
                  y={chartH - 5}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.25)"
                  fontSize="10"
                >
                  {label}
                </text>
              );
            })}
        </svg>
      </div>
    );
  }

  // Bar chart
  const barGap = 2;
  const barWidth = Math.max(2, (innerW - barGap * data.length) / data.length);

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
      <svg viewBox={`0 0 ${chartWidth} ${chartH}`} className="w-full" style={{ height }}>
        {data.map((d, i) => {
          const primary = Number(d[dataKey]) || 0;
          const secondary = secondaryKey ? Number(d[secondaryKey]) || 0 : 0;

          const x = padding.left + i * (barWidth + barGap);
          const primaryH = (primary / maxVal) * innerH;
          const secondaryH = (secondary / maxVal) * innerH;

          const label = d.date.length > 7 ? d.date.slice(5) : d.date;

          return (
            <g key={i}>
              {/* Secondary (stacked on top) */}
              {secondaryKey && (
                <motion.rect
                  x={x}
                  y={padding.top + innerH - primaryH - secondaryH}
                  width={barWidth}
                  height={secondaryH}
                  rx={Math.min(2, barWidth / 2)}
                  fill={secondaryColor}
                  fillOpacity={0.7}
                  initial={{ height: 0, y: padding.top + innerH }}
                  animate={{ height: secondaryH, y: padding.top + innerH - primaryH - secondaryH }}
                  transition={{ duration: 0.6, delay: 0.02 * i }}
                />
              )}
              {/* Primary */}
              <motion.rect
                x={x}
                y={padding.top + innerH - primaryH}
                width={barWidth}
                height={primaryH}
                rx={Math.min(2, barWidth / 2)}
                fill={color}
                fillOpacity={0.8}
                initial={{ height: 0, y: padding.top + innerH }}
                animate={{ height: primaryH, y: padding.top + innerH - primaryH }}
                transition={{ duration: 0.6, delay: 0.02 * i }}
              />
              {/* X label */}
              {showLabels && (data.length <= 15 || i % Math.ceil(data.length / 8) === 0) && (
                <text
                  x={x + barWidth / 2}
                  y={chartH - 5}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.25)"
                  fontSize="10"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
