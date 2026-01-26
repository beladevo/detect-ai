'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { Cpu, Gpu, Activity, Zap } from 'lucide-react';
import { Speedometer } from './Speedometer';
import { usePerformanceMonitor } from '@/src/hooks/usePerformanceMonitor';

interface PerformanceMonitorProps {
  isActive: boolean;
  className?: string;
  compact?: boolean;
}

export function PerformanceMonitor({
  isActive,
  className = '',
  compact = false
}: PerformanceMonitorProps) {
  const { metrics, isMonitoring, start, stop } = usePerformanceMonitor({
    updateInterval: 500
  });

  // Start/stop monitoring based on isActive prop
  useEffect(() => {
    if (isActive && !isMonitoring) {
      start();
    } else if (!isActive && isMonitoring) {
      stop();
    }
  }, [isActive, isMonitoring, start, stop]);

  if (compact) {
    return (
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-4 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 ${className}`}
          >
            <CompactGauge
              icon={<Cpu className="w-4 h-4" />}
              label="CPU"
              value={metrics.cpu}
            />
            <div className="w-px h-8 bg-white/10" />
            <CompactGauge
              icon={<Gpu className="w-4 h-4" />}
              label="GPU"
              value={metrics.gpu}
            />
            <div className="w-px h-8 bg-white/10" />
            <CompactGauge
              icon={<Activity className="w-4 h-4" />}
              label="FPS"
              value={metrics.fps}
              max={120}
              suffix=""
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-cyan" />
              <span className="text-sm font-medium text-white/90">
                System Load
              </span>
            </div>
            <motion.div
              className="flex items-center gap-1.5"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-white/50">Monitoring</span>
            </motion.div>
          </div>

          {/* Gauges */}
          <div className="flex items-center justify-center gap-8 p-6">
            <div className="flex flex-col items-center">
              <Speedometer
                value={metrics.cpu}
                label="CPU"
                size={140}
                strokeWidth={10}
              />
            </div>

            <div className="flex flex-col items-center">
              <Speedometer
                value={metrics.gpu}
                label="GPU"
                size={140}
                strokeWidth={10}
              />
            </div>
          </div>

          {/* Additional metrics */}
          <div className="grid grid-cols-3 gap-2 px-4 pb-4">
            <MetricCard
              label="FPS"
              value={metrics.fps}
              unit=""
              icon={<Activity className="w-3.5 h-3.5" />}
            />
            <MetricCard
              label="Event Lag"
              value={Math.round(metrics.eventLoopLag)}
              unit="ms"
              icon={<Zap className="w-3.5 h-3.5" />}
              warning={metrics.eventLoopLag > 30}
            />
            <MetricCard
              label="Long Tasks"
              value={metrics.longTaskCount}
              unit=""
              icon={<Activity className="w-3.5 h-3.5" />}
              warning={metrics.longTaskCount > 3}
            />
          </div>

          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-brand-purple/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-brand-cyan/10 rounded-full blur-3xl" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Compact gauge for inline display
function CompactGauge({
  icon,
  label,
  value,
  max = 100,
  suffix = '%'
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  max?: number;
  suffix?: string;
}) {
  const percentage = Math.min(100, (value / max) * 100);
  const color = percentage < 40 ? 'text-green-400' : percentage < 70 ? 'text-yellow-400' : 'text-red-400';
  const bgColor = percentage < 40 ? 'bg-green-500' : percentage < 70 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <span className={`${color}`}>{icon}</span>
      <div className="flex flex-col min-w-[48px]">
        <span className="text-[10px] text-white/50 uppercase">{label}</span>
        <div className="flex items-baseline gap-0.5">
          <motion.span
            className={`text-sm font-semibold tabular-nums ${color}`}
            key={value}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
          >
            {Math.round(value)}
          </motion.span>
          <span className="text-[10px] text-white/40">{suffix}</span>
        </div>
      </div>
      {/* Mini progress bar */}
      <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${bgColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

// Small metric card
function MetricCard({
  label,
  value,
  unit,
  icon,
  warning = false
}: {
  label: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        warning ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5'
      }`}
    >
      <span className={warning ? 'text-red-400' : 'text-white/40'}>{icon}</span>
      <div className="flex flex-col">
        <span className="text-[10px] text-white/50 uppercase">{label}</span>
        <div className="flex items-baseline gap-0.5">
          <motion.span
            className={`text-sm font-semibold tabular-nums ${
              warning ? 'text-red-400' : 'text-white/80'
            }`}
            key={value}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            {value}
          </motion.span>
          {unit && <span className="text-[10px] text-white/40">{unit}</span>}
        </div>
      </div>
    </div>
  );
}
