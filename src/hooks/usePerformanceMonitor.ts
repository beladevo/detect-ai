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
  const isMonitoringRef = useRef(false);
  const isInitializedRef = useRef(false);

  const start = useCallback(async () => {
    // Use ref to avoid stale closure
    if (isMonitoringRef.current) return;

    if (!estimatorRef.current) {
      estimatorRef.current = getPerformanceEstimator();
    }

    if (!isInitializedRef.current) {
      await estimatorRef.current.init();
      isInitializedRef.current = true;
      setIsInitialized(true);
    }

    // Subscribe to metrics updates
    unsubscribeRef.current = estimatorRef.current.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });

    estimatorRef.current.start(updateInterval);
    isMonitoringRef.current = true;
    setIsMonitoring(true);
  }, [updateInterval]);

  const stop = useCallback(() => {
    // Use ref to avoid stale closure
    if (!isMonitoringRef.current) return;

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    estimatorRef.current?.stop();
    isMonitoringRef.current = false;
    setIsMonitoring(false);

    // Reset metrics when stopped
    setMetrics(defaultMetrics);
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart) {
      start();
    }
  }, [autoStart, start]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      estimatorRef.current?.stop();
      isMonitoringRef.current = false;
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
