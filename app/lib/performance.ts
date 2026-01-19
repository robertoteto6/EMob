'use client';

// Sistema de métricas de rendimiento optimizado
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'navigation' | 'resource' | 'measure' | 'custom';
  metadata?: Record<string, any>;
}

interface WebVitals {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  INP?: number; // Interaction to Next Paint
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private webVitals: WebVitals = {};
  private observers: Map<string, PerformanceObserver> = new Map();
  private isEnabled: boolean = true;
  private maxMetrics: number = 1000;
  private reportingEndpoint?: string;
  private batchSize: number = 10;
  private reportingInterval: number = 30000; // 30 segundos
  private pendingReports: PerformanceMetric[] = [];

  constructor(options?: {
    enabled?: boolean;
    maxMetrics?: number;
    reportingEndpoint?: string;
    batchSize?: number;
    reportingInterval?: number;
  }) {
    if (options) {
      this.isEnabled = options.enabled ?? true;
      this.maxMetrics = options.maxMetrics ?? 1000;
      this.reportingEndpoint = options.reportingEndpoint;
      this.batchSize = options.batchSize ?? 10;
      this.reportingInterval = options.reportingInterval ?? 30000;
    }

    if (this.isEnabled && typeof window !== 'undefined') {
      this.initializeObservers();
      this.startPeriodicReporting();
    }
  }

  private initializeObservers(): void {
    // Observer para Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.webVitals.LCP = lastEntry.startTime;
          this.addMetric({
            name: 'LCP',
            value: lastEntry.startTime,
            timestamp: Date.now(),
            type: 'measure',
            metadata: { url: window.location.href }
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch {
        console.warn('LCP observer not supported');
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.webVitals.FID = entry.processingStart - entry.startTime;
            this.addMetric({
              name: 'FID',
              value: entry.processingStart - entry.startTime,
              timestamp: Date.now(),
              type: 'measure',
              metadata: { 
                url: window.location.href,
                target: entry.target?.tagName || 'unknown'
              }
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.webVitals.CLS = clsValue;
          this.addMetric({
            name: 'CLS',
            value: clsValue,
            timestamp: Date.now(),
            type: 'measure',
            metadata: { url: window.location.href }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch {
        console.warn('CLS observer not supported');
      }

      // Navigation Timing
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.webVitals.TTFB = entry.responseStart - entry.requestStart;
            this.addMetric({
              name: 'TTFB',
              value: entry.responseStart - entry.requestStart,
              timestamp: Date.now(),
              type: 'navigation',
              metadata: { 
                url: entry.name,
                type: entry.type
              }
            });
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navigationObserver);
      } catch {
        console.warn('Navigation observer not supported');
      }

      // Resource Timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.addMetric({
              name: 'resource-load',
              value: entry.duration,
              timestamp: Date.now(),
              type: 'resource',
              metadata: {
                url: entry.name,
                type: entry.initiatorType,
                size: entry.transferSize || 0,
                cached: entry.transferSize === 0 && entry.decodedBodySize > 0
              }
            });
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch {
        console.warn('Resource observer not supported');
      }
    }

    // First Contentful Paint (usando Performance API)
    if ('performance' in window && 'getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.webVitals.FCP = fcpEntry.startTime;
        this.addMetric({
          name: 'FCP',
          value: fcpEntry.startTime,
          timestamp: Date.now(),
          type: 'measure',
          metadata: { url: window.location.href }
        });
      }
    }
  }

  private addMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push(metric);
    this.pendingReports.push(metric);

    // Mantener límite de métricas
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Reportar inmediatamente si es crítico
    if (this.isCriticalMetric(metric)) {
      this.reportMetrics([metric]);
    }
  }

  private isCriticalMetric(metric: PerformanceMetric): boolean {
    // Definir métricas críticas que necesitan reporte inmediato
    const criticalThresholds = {
      'LCP': 4000, // > 4s es crítico
      'FID': 300,  // > 300ms es crítico
      'CLS': 0.25, // > 0.25 es crítico
      'TTFB': 1800 // > 1.8s es crítico
    };

    const threshold = criticalThresholds[metric.name as keyof typeof criticalThresholds];
    return threshold !== undefined && metric.value > threshold;
  }

  private startPeriodicReporting(): void {
    if (!this.reportingEndpoint) return;

    setInterval(() => {
      if (this.pendingReports.length >= this.batchSize) {
        const batch = this.pendingReports.splice(0, this.batchSize);
        this.reportMetrics(batch);
      }
    }, this.reportingInterval);
  }

  private async reportMetrics(metrics: PerformanceMetric[]): Promise<void> {
    if (!this.reportingEndpoint || metrics.length === 0) return;

    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.warn('Failed to report metrics:', error);
      // Volver a agregar las métricas a la cola en caso de error
      this.pendingReports.unshift(...metrics);
    }
  }

  // Métodos públicos
  public measureCustom(name: string, fn: () => void | Promise<void>, metadata?: Record<string, any>): void {
    const startTime = performance.now();
    
    const finish = () => {
      const duration = performance.now() - startTime;
      this.addMetric({
        name,
        value: duration,
        timestamp: Date.now(),
        type: 'custom',
        metadata
      });
    };

    try {
      const result = fn();
      if (result instanceof Promise) {
        result.finally(finish);
      } else {
        finish();
      }
    } catch (error) {
      finish();
      throw error;
    }
  }

  public markCustom(name: string, value?: number, metadata?: Record<string, any>): void {
    this.addMetric({
      name,
      value: value ?? performance.now(),
      timestamp: Date.now(),
      type: 'custom',
      metadata
    });
  }

  public getMetrics(filter?: {
    name?: string;
    type?: PerformanceMetric['type'];
    since?: number;
  }): PerformanceMetric[] {
    let filtered = this.metrics;

    if (filter) {
      if (filter.name) {
        filtered = filtered.filter(m => m.name === filter.name);
      }
      if (filter.type) {
        filtered = filtered.filter(m => m.type === filter.type);
      }
      if (filter.since) {
        filtered = filtered.filter(m => m.timestamp >= filter.since!);
      }
    }

    return filtered;
  }

  public getWebVitals(): WebVitals {
    return { ...this.webVitals };
  }

  public getPerformanceScore(): number {
    const vitals = this.webVitals;
    let score = 100;

    // Penalizar por métricas pobres
    if (vitals.LCP && vitals.LCP > 2500) score -= 20;
    if (vitals.FID && vitals.FID > 100) score -= 20;
    if (vitals.CLS && vitals.CLS > 0.1) score -= 20;
    if (vitals.FCP && vitals.FCP > 1800) score -= 20;
    if (vitals.TTFB && vitals.TTFB > 800) score -= 20;

    return Math.max(0, score);
  }

  public generateReport(): {
    webVitals: WebVitals;
    score: number;
    metrics: PerformanceMetric[];
    summary: Record<string, any>;
  } {
    const metrics = this.getMetrics();
    const webVitals = this.getWebVitals();
    const score = this.getPerformanceScore();

    const summary = {
      totalMetrics: metrics.length,
      avgResourceLoadTime: this.calculateAverage(metrics.filter(m => m.type === 'resource').map(m => m.value)),
      slowestResources: metrics
        .filter(m => m.type === 'resource')
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map(m => ({ url: m.metadata?.url, duration: m.value })),
      customMetrics: metrics.filter(m => m.type === 'custom').length
    };

    return { webVitals, score, metrics, summary };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics = [];
    this.pendingReports = [];
    this.isEnabled = false;
  }
}

// Instancia global del monitor
let globalMonitor: PerformanceMonitor | null = null;

export function initializePerformanceMonitor(options?: {
  enabled?: boolean;
  maxMetrics?: number;
  reportingEndpoint?: string;
  batchSize?: number;
  reportingInterval?: number;
}): PerformanceMonitor {
  if (globalMonitor) {
    globalMonitor.destroy();
  }
  
  globalMonitor = new PerformanceMonitor(options);
  return globalMonitor;
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return globalMonitor;
}

// Hook de React para usar el monitor de rendimiento
export function usePerformanceMonitor() {
  const monitor = getPerformanceMonitor();
  
  const measureComponent = (name: string, metadata?: Record<string, any>) => {
    return (fn: () => void | Promise<void>) => {
      monitor?.measureCustom(`component-${name}`, fn, metadata);
    };
  };

  const markEvent = (name: string, metadata?: Record<string, any>) => {
    monitor?.markCustom(`event-${name}`, undefined, metadata);
  };

  const getReport = () => {
    return monitor?.generateReport();
  };

  return {
    measureComponent,
    markEvent,
    getReport,
    webVitals: monitor?.getWebVitals() || {},
    score: monitor?.getPerformanceScore() || 0
  };
}

// Utilidades para medición de rendimiento
export const performanceUtils = {
  // Medir tiempo de carga de imágenes
  measureImageLoad: (src: string): Promise<number> => {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const img = new Image();
      
      const finish = () => {
        const duration = performance.now() - startTime;
        globalMonitor?.markCustom('image-load', duration, { src });
        resolve(duration);
      };
      
      img.onload = finish;
      img.onerror = finish;
      img.src = src;
    });
  },

  // Medir tiempo de respuesta de API
  measureApiCall: async <T>(url: string, fetchFn: () => Promise<T>): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await fetchFn();
      const duration = performance.now() - startTime;
      globalMonitor?.markCustom('api-call', duration, { url, success: true });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      globalMonitor?.markCustom('api-call', duration, { url, success: false, error: String(error) });
      throw error;
    }
  },

  // Medir tiempo de renderizado de componentes
  measureRender: (componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      globalMonitor?.markCustom('component-render', duration, { component: componentName });
    };
  }
};

export default PerformanceMonitor;
export type { PerformanceMetric, WebVitals };