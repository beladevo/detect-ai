'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useMemo } from 'react';

interface SpeedometerProps {
  value: number; // 0-100
  label: string;
  size?: number; // diameter in pixels
  strokeWidth?: number;
  showValue?: boolean;
  className?: string;
}

export function Speedometer({
  value,
  label,
  size = 120,
  strokeWidth = 8,
  showValue = true,
  className = ''
}: SpeedometerProps) {
  // Clamp value between 0-100
  const clampedValue = Math.max(0, Math.min(100, value));

  // Spring animation for smooth needle movement
  const springValue = useSpring(clampedValue, {
    stiffness: 100,
    damping: 20,
    mass: 0.5
  });

  // Calculate dimensions
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Arc spans 180 degrees (semi-circle), from -180 to 0 degrees
  const startAngle = -180;
  const endAngle = 0;
  const angleRange = endAngle - startAngle;

  // Convert value to angle
  const needleAngle = useTransform(
    springValue,
    [0, 100],
    [startAngle, endAngle]
  );

  // Calculate arc path for background
  const arcPath = useMemo(() => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  }, [center, radius, startAngle, endAngle]);

  // Color zones (green, yellow, red)
  const getZoneColor = (val: number): string => {
    if (val < 40) return '#22c55e'; // green-500
    if (val < 70) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  // Calculate zone arcs
  const zones = useMemo(() => {
    const createArc = (startPct: number, endPct: number) => {
      const startAng = startAngle + (angleRange * startPct) / 100;
      const endAng = startAngle + (angleRange * endPct) / 100;

      const startRad = (startAng * Math.PI) / 180;
      const endRad = (endAng * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const largeArc = endPct - startPct > 50 ? 1 : 0;

      return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
    };

    return [
      { path: createArc(0, 40), color: '#22c55e40' }, // green zone
      { path: createArc(40, 70), color: '#eab30840' }, // yellow zone
      { path: createArc(70, 100), color: '#ef444440' } // red zone
    ];
  }, [center, radius, startAngle, angleRange]);

  // Current value indicator (filled arc)
  const valueArc = useMemo(() => {
    const endPct = clampedValue;
    const endAng = startAngle + (angleRange * endPct) / 100;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAng * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = endPct > 50 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  }, [center, radius, startAngle, angleRange, clampedValue]);

  // Needle dimensions
  const needleLength = radius - 10;
  const needleWidth = 4;

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <svg
        width={size}
        height={size / 2 + 20}
        viewBox={`0 0 ${size} ${size / 2 + 20}`}
        className="overflow-visible"
      >
        {/* Background track */}
        <path
          d={arcPath}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Zone indicators */}
        {zones.map((zone, i) => (
          <path
            key={i}
            d={zone.path}
            fill="none"
            stroke={zone.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />
        ))}

        {/* Value arc (animated via CSS) */}
        <motion.path
          d={valueArc}
          fill="none"
          stroke={getZoneColor(clampedValue)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Glow effect */}
        <defs>
          <filter id={`glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Needle */}
        <motion.g
          style={{ rotate: needleAngle }}
          transformOrigin={`${center}px ${center}px`}
        >
          {/* Needle shadow */}
          <line
            x1={center}
            y1={center}
            x2={center - needleLength}
            y2={center}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={needleWidth + 2}
            strokeLinecap="round"
          />
          {/* Needle body */}
          <line
            x1={center}
            y1={center}
            x2={center - needleLength}
            y2={center}
            stroke={getZoneColor(clampedValue)}
            strokeWidth={needleWidth}
            strokeLinecap="round"
            filter={`url(#glow-${label})`}
          />
          {/* Needle center cap */}
          <circle
            cx={center}
            cy={center}
            r={needleWidth + 2}
            fill={getZoneColor(clampedValue)}
          />
          <circle
            cx={center}
            cy={center}
            r={needleWidth - 1}
            fill="#1a1a2e"
          />
        </motion.g>

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const tickAngle = startAngle + (angleRange * tick) / 100;
          const tickRad = (tickAngle * Math.PI) / 180;
          const innerR = radius - strokeWidth / 2 - 8;
          const outerR = radius - strokeWidth / 2 - 3;

          const x1 = center + innerR * Math.cos(tickRad);
          const y1 = center + innerR * Math.sin(tickRad);
          const x2 = center + outerR * Math.cos(tickRad);
          const y2 = center + outerR * Math.sin(tickRad);

          return (
            <line
              key={tick}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={tick % 50 === 0 ? 2 : 1}
            />
          );
        })}
      </svg>

      {/* Value display */}
      {showValue && (
        <motion.div
          className="absolute flex flex-col items-center"
          style={{ bottom: 8 }}
        >
          <motion.span
            className="text-2xl font-bold tabular-nums"
            style={{ color: getZoneColor(clampedValue) }}
          >
            {Math.round(clampedValue)}%
          </motion.span>
        </motion.div>
      )}

      {/* Label */}
      <span className="mt-1 text-xs font-medium text-white/60 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
