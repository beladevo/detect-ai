'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  PerformanceMetrics,
  getPerformanceEstimator,
  PerformanceEstimator
} from '@/src/lib/performanceEstimation';

interface UsePerformanceMonitorOptions {
  updateInterval?: number; // ms between updates, default 500
  autoStart?: boolean; // start monitoring immediately, default false
}

interface UsePerformanceMonitorReturn {
  metrics: PerformanceMetrics;
  isMonitoring: boolean;
  isInitialized: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

const defaultMetrics: PerformanceMetrics = {
  cpu: 0,
  gpu: 0,
  fps: 60,
  eventLoopLag: 0,
  longTaskCount: 0,
  frameDrops: 0
};

export function usePerformanceMonitor(
  options: UsePerformanceMonitorOptions = {}
): UsePerformanceMonitorReturn {
  const { updateInterval = 500, autoStart = false } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>(defaultMetrics);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const estimatorRef = useRef<PerformanceEstimator | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const start = useCallback(async () => {
    if (isMonitoring) return;

    if (!estimatorRef.current) {
      estimatorRef.current = getPerformanceEstimator();
    }

    if (!isInitialized) {
      await estimatorRef.current.init();
      setIsInitialized(true);
    }

    // Subscribe to metrics updates
    unsubscribeRef.current = estimatorRef.current.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });

    estimatorRef.current.start(updateInterval);
    setIsMonitoring(true);
  }, [isMonitoring, isInitialized, updateInterval]);

  const stop = useCallback(() => {
    if (!isMonitoring) return;

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    estimatorRef.current?.stop();
    setIsMonitoring(false);
  }, [isMonitoring]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart) {
      start();
    }
  }, [autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      // Don't destroy the singleton, just stop monitoring
      estimatorRef.current?.stop();
    };
  }, []);

  return {
    metrics,
    isMonitoring,
    isInitialized,
    start,
    stop
  };
}
