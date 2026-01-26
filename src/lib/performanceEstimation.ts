/**
 * Performance Estimation Utilities
 *
 * Provides browser-safe CPU and GPU load estimation using indirect signals.
 * These are estimations based on observable browser behavior, not actual system metrics.
 */

export interface PerformanceMetrics {
  cpu: number; // 0-100 estimated CPU load
  gpu: number; // 0-100 estimated GPU load
  fps: number; // Current FPS
  eventLoopLag: number; // ms
  longTaskCount: number;
  frameDrops: number;
}

// ============================================================================
// CPU ESTIMATION
// ============================================================================

/**
 * Measures event loop lag by scheduling a callback and measuring delay
 */
export function measureEventLoopLag(): Promise<number> {
  return new Promise((resolve) => {
    const start = performance.now();
    // Use setTimeout with 0ms - any delay beyond ~4ms indicates blocking
    setTimeout(() => {
      const lag = performance.now() - start;
      resolve(Math.max(0, lag - 4)); // Subtract browser minimum timer resolution
    }, 0);
  });
}

/**
 * Measures CPU load by executing a calibrated workload and timing it
 */
export function measureCPUWorkloadTime(): number {
  const iterations = 100000;
  const start = performance.now();

  // Calibrated workload - simple math operations
  let sum = 0;
  for (let i = 0; i < iterations; i++) {
    sum += Math.sqrt(i) * Math.sin(i);
  }

  const elapsed = performance.now() - start;

  // Prevent dead code elimination
  if (sum === Infinity) console.log('overflow');

  return elapsed;
}

// Baseline workload time (calibrated on idle system)
let baselineCPUWorkload = 0;

export function calibrateCPUBaseline(): void {
  // Take multiple samples and use the minimum (closest to unloaded state)
  const samples: number[] = [];
  for (let i = 0; i < 5; i++) {
    samples.push(measureCPUWorkloadTime());
  }
  baselineCPUWorkload = Math.min(...samples);
}

/**
 * Long Task Observer - tracks tasks > 50ms that block the main thread
 */
export class LongTaskMonitor {
  private observer: PerformanceObserver | null = null;
  private longTasks: number[] = [];
  private windowMs = 5000; // 5 second sliding window

  start(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      this.observer = new PerformanceObserver((list) => {
        const now = performance.now();
        for (const entry of list.getEntries()) {
          this.longTasks.push(now);
        }
        // Clean old entries outside window
        this.longTasks = this.longTasks.filter(t => now - t < this.windowMs);
      });

      this.observer.observe({ entryTypes: ['longtask'] });
    } catch {
      // longtask not supported
    }
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.longTasks = [];
  }

  getCount(): number {
    const now = performance.now();
    this.longTasks = this.longTasks.filter(t => now - t < this.windowMs);
    return this.longTasks.length;
  }
}

/**
 * RAF Timing Monitor - measures frame timing and drops
 */
export class RAFMonitor {
  private frameTimestamps: number[] = [];
  private frameDrops = 0;
  private lastFrameTime = 0;
  private rafId: number | null = null;
  private running = false;
  private windowMs = 2000; // 2 second sliding window

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = performance.now();
    this.tick();
  }

  private tick = (): void => {
    if (!this.running) return;

    const now = performance.now();
    const delta = now - this.lastFrameTime;

    // Clean old entries
    this.frameTimestamps = this.frameTimestamps.filter(t => now - t < this.windowMs);
    this.frameTimestamps.push(now);

    // Detect frame drops (delta > 33ms means dropped below 30fps)
    if (delta > 33.33) {
      this.frameDrops++;
    }

    // Decay frame drops over time
    if (this.frameTimestamps.length > 60) {
      this.frameDrops = Math.max(0, this.frameDrops - 0.5);
    }

    this.lastFrameTime = now;
    this.rafId = requestAnimationFrame(this.tick);
  };

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.frameTimestamps = [];
    this.frameDrops = 0;
  }

  getFPS(): number {
    if (this.frameTimestamps.length < 2) return 60;
    const now = performance.now();
    const recentFrames = this.frameTimestamps.filter(t => now - t < 1000);
    return Math.min(120, recentFrames.length);
  }

  getFrameDrops(): number {
    return Math.round(this.frameDrops);
  }
}

/**
 * Estimates CPU load from multiple signals (0-100)
 */
export async function estimateCPULoad(
  eventLoopLag: number,
  longTaskCount: number,
  frameDrops: number,
  fps: number
): Promise<number> {
  // Event loop lag contribution (0-40 points)
  // Lag of 50ms+ = max contribution
  const lagScore = Math.min(40, (eventLoopLag / 50) * 40);

  // Long task contribution (0-25 points)
  // More than 5 long tasks in window = max
  const longTaskScore = Math.min(25, (longTaskCount / 5) * 25);

  // Frame drop contribution (0-20 points)
  const frameDropScore = Math.min(20, (frameDrops / 10) * 20);

  // FPS degradation contribution (0-15 points)
  // Below 30 FPS = max contribution
  const fpsScore = fps < 60 ? Math.min(15, ((60 - fps) / 30) * 15) : 0;

  const total = lagScore + longTaskScore + frameDropScore + fpsScore;

  return Math.min(100, Math.max(0, Math.round(total)));
}

// ============================================================================
// GPU ESTIMATION
// ============================================================================

/**
 * WebGL Frame Timer - measures GPU workload via draw call timing
 */
export class WebGLMonitor {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private frameTimeHistory: number[] = [];
  private rafId: number | null = null;
  private running = false;
  private baselineFrameTime = 0;

  async init(): Promise<boolean> {
    try {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 256;
      this.canvas.height = 256;
      this.canvas.style.display = 'none';
      document.body.appendChild(this.canvas);

      this.gl = this.canvas.getContext('webgl', {
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
      });

      if (!this.gl) return false;

      // Create a simple shader program for workload measurement
      const vs = this.gl.createShader(this.gl.VERTEX_SHADER)!;
      this.gl.shaderSource(vs, `
        attribute vec4 position;
        void main() { gl_Position = position; }
      `);
      this.gl.compileShader(vs);

      const fs = this.gl.createShader(this.gl.FRAGMENT_SHADER)!;
      this.gl.shaderSource(fs, `
        precision mediump float;
        uniform float time;
        void main() {
          float v = sin(time * 0.001) * 0.5 + 0.5;
          gl_FragColor = vec4(v, v, v, 1.0);
        }
      `);
      this.gl.compileShader(fs);

      this.program = this.gl.createProgram()!;
      this.gl.attachShader(this.program, vs);
      this.gl.attachShader(this.program, fs);
      this.gl.linkProgram(this.program);

      // Calibrate baseline
      await this.calibrateBaseline();

      return true;
    } catch {
      return false;
    }
  }

  private async calibrateBaseline(): Promise<void> {
    const samples: number[] = [];
    for (let i = 0; i < 10; i++) {
      const time = this.measureFrameTime();
      samples.push(time);
      await new Promise(r => setTimeout(r, 16));
    }
    this.baselineFrameTime = Math.min(...samples);
  }

  private measureFrameTime(): number {
    if (!this.gl || !this.program) return 0;

    const start = performance.now();

    this.gl.useProgram(this.program);
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.program, 'time'),
      performance.now()
    );

    // Draw multiple times to create measurable GPU work
    for (let i = 0; i < 10; i++) {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    }

    // Force GPU sync
    this.gl.finish();

    return performance.now() - start;
  }

  start(): void {
    if (this.running || !this.gl) return;
    this.running = true;
    this.tick();
  }

  private tick = (): void => {
    if (!this.running) return;

    const frameTime = this.measureFrameTime();
    this.frameTimeHistory.push(frameTime);

    // Keep last 30 samples
    if (this.frameTimeHistory.length > 30) {
      this.frameTimeHistory.shift();
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy(): void {
    this.stop();
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }
    this.gl = null;
    this.program = null;
    this.frameTimeHistory = [];
  }

  getAverageFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return 0;
    const sum = this.frameTimeHistory.reduce((a, b) => a + b, 0);
    return sum / this.frameTimeHistory.length;
  }

  getGPULoad(): number {
    const avgFrameTime = this.getAverageFrameTime();
    if (this.baselineFrameTime === 0 || avgFrameTime === 0) return 0;

    // Calculate load as ratio of current frame time to baseline
    // Frame time increase indicates GPU contention
    const ratio = avgFrameTime / this.baselineFrameTime;

    // Map ratio to 0-100 scale
    // ratio of 1 = 0% load, ratio of 3+ = 100% load
    const load = Math.min(100, Math.max(0, (ratio - 1) * 50));

    return Math.round(load);
  }
}

/**
 * Estimates GPU load from WebGL timing and FPS correlation (0-100)
 */
export function estimateGPULoad(
  webglLoad: number,
  fps: number,
  targetFps: number = 60
): number {
  // WebGL timing contribution (0-70 points)
  const webglScore = webglLoad * 0.7;

  // FPS degradation contribution (0-30 points)
  // GPU-bound applications show FPS drops
  const fpsRatio = Math.min(1, fps / targetFps);
  const fpsScore = (1 - fpsRatio) * 30;

  return Math.min(100, Math.max(0, Math.round(webglScore + fpsScore)));
}

// ============================================================================
// COMBINED MONITOR
// ============================================================================

export class PerformanceEstimator {
  private longTaskMonitor = new LongTaskMonitor();
  private rafMonitor = new RAFMonitor();
  private webglMonitor = new WebGLMonitor();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private latestMetrics: PerformanceMetrics = {
    cpu: 0,
    gpu: 0,
    fps: 60,
    eventLoopLag: 0,
    longTaskCount: 0,
    frameDrops: 0
  };
  private listeners: Set<(metrics: PerformanceMetrics) => void> = new Set();
  private initialized = false;
  private running = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    calibrateCPUBaseline();
    await this.webglMonitor.init();
    this.initialized = true;
  }

  start(intervalMs: number = 500): void {
    if (!this.initialized) {
      console.warn('PerformanceEstimator not initialized. Call init() first.');
      return;
    }

    // Stop any existing interval first
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.running = true;
    this.longTaskMonitor.start();
    this.rafMonitor.start();
    this.webglMonitor.start();

    // Fire immediately to get instant feedback
    this.updateMetrics();

    this.intervalId = setInterval(() => {
      if (this.running) {
        this.updateMetrics();
      }
    }, intervalMs);
  }

  stop(): void {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.longTaskMonitor.stop();
    this.rafMonitor.stop();
    this.webglMonitor.stop();

    // Reset metrics on stop
    this.latestMetrics = {
      cpu: 0,
      gpu: 0,
      fps: 60,
      eventLoopLag: 0,
      longTaskCount: 0,
      frameDrops: 0
    };
  }

  destroy(): void {
    this.stop();
    this.webglMonitor.destroy();
    this.listeners.clear();
    this.initialized = false;
  }

  subscribe(listener: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private updateMetrics(): void {
    // Use sync version for immediate updates
    const eventLoopLagPromise = measureEventLoopLag();
    const longTaskCount = this.longTaskMonitor.getCount();
    const frameDrops = this.rafMonitor.getFrameDrops();
    const fps = this.rafMonitor.getFPS();
    const webglLoad = this.webglMonitor.getGPULoad();

    // Calculate with current values, update lag async
    eventLoopLagPromise.then(async (eventLoopLag) => {
      if (!this.running) return;

      const cpu = await estimateCPULoad(eventLoopLag, longTaskCount, frameDrops, fps);
      const gpu = estimateGPULoad(webglLoad, fps);

      this.latestMetrics = {
        cpu,
        gpu,
        fps,
        eventLoopLag,
        longTaskCount,
        frameDrops
      };

      // Notify listeners
      this.listeners.forEach(listener => listener(this.latestMetrics));
    });
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.latestMetrics };
  }
}

// Singleton instance
let estimatorInstance: PerformanceEstimator | null = null;

export function getPerformanceEstimator(): PerformanceEstimator {
  if (!estimatorInstance) {
    estimatorInstance = new PerformanceEstimator();
  }
  return estimatorInstance;
}
