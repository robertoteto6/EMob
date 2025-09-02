import { useEffect, useCallback, useRef, useState } from 'react';

// Tipos para métricas de rendimiento
interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

interface UsePerformanceOptions {
  enableLogging?: boolean;
  enableReporting?: boolean;
  reportEndpoint?: string;
}

// Hook para monitorear métricas de rendimiento
export const usePerformance = (options: UsePerformanceOptions = {}) => {
  const {
    enableLogging = process.env.NODE_ENV === 'development',
    enableReporting = false,
    reportEndpoint = '/api/analytics/performance'
  } = options;

  const metricsRef = useRef<PerformanceMetrics>({});
  const observerRef = useRef<PerformanceObserver | null>(null);

  // Función para reportar métricas
  const reportMetrics = useCallback(async (metrics: PerformanceMetrics) => {
    if (!enableReporting) return;

    try {
      await fetch(reportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (error) {
      console.warn('Failed to report performance metrics:', error);
    }
  }, [enableReporting, reportEndpoint]);

  // Función para procesar entradas de rendimiento
  const handlePerformanceEntry = useCallback((entry: PerformanceEntry) => {
    const metrics = metricsRef.current;

    switch (entry.entryType) {
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          metrics.fcp = entry.startTime;
          if (enableLogging) {
            console.log(`🎨 First Contentful Paint: ${entry.startTime.toFixed(2)}ms`);
          }
        }
        break;

      case 'largest-contentful-paint':
        metrics.lcp = entry.startTime;
        if (enableLogging) {
          console.log(`🖼️ Largest Contentful Paint: ${entry.startTime.toFixed(2)}ms`);
        }
        break;

      case 'first-input':
        const fidEntry = entry as PerformanceEventTiming;
        metrics.fid = fidEntry.processingStart - fidEntry.startTime;
        if (enableLogging) {
          console.log(`⚡ First Input Delay: ${metrics.fid.toFixed(2)}ms`);
        }
        break;

      case 'layout-shift':
        const clsEntry = entry as any; // LayoutShift no está en tipos estándar
        if (!clsEntry.hadRecentInput) {
          metrics.cls = (metrics.cls || 0) + clsEntry.value;
          if (enableLogging) {
            console.log(`📐 Cumulative Layout Shift: ${(metrics.cls ?? 0).toFixed(4)}`);
          }
        }
        break;

      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
        if (enableLogging) {
          console.log(`🌐 Time to First Byte: ${metrics.ttfb.toFixed(2)}ms`);
        }
        break;
    }

    // Reportar métricas cuando tengamos datos suficientes
    if (Object.keys(metrics).length >= 3) {
      reportMetrics(metrics);
    }
  }, [enableLogging, reportMetrics]);

  // Inicializar observador de rendimiento
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Observar métricas de pintura
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(handlePerformanceEntry);
      });
      paintObserver.observe({ entryTypes: ['paint'] });

      // Observar LCP
      const lcpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(handlePerformanceEntry);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Observar FID
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(handlePerformanceEntry);
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Observar CLS
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(handlePerformanceEntry);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Observar navegación
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(handlePerformanceEntry);
      });
      navObserver.observe({ entryTypes: ['navigation'] });

      observerRef.current = paintObserver; // Guardamos una referencia

      return () => {
        paintObserver.disconnect();
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
        navObserver.disconnect();
      };
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }, [handlePerformanceEntry]);

  // Función para obtener métricas actuales
  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  // Función para medir tiempo de ejecución de funciones
  const measureFunction = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    name: string
  ) => {
    return (...args: T): R => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      if (enableLogging) {
        console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    };
  }, [enableLogging]);

  // Función para marcar eventos personalizados
  const mark = useCallback((name: string) => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
      if (enableLogging) {
        console.log(`📍 Mark: ${name}`);
      }
    }
  }, [enableLogging]);

  // Función para medir entre marcas
  const measure = useCallback((name: string, startMark: string, endMark?: string) => {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const entries = performance.getEntriesByName(name, 'measure');
        const lastEntry = entries[entries.length - 1];
        
        if (enableLogging && lastEntry) {
          console.log(`📏 Measure ${name}: ${lastEntry.duration.toFixed(2)}ms`);
        }
        
        return lastEntry?.duration || 0;
      } catch (error) {
        console.warn(`Failed to measure ${name}:`, error);
        return 0;
      }
    }
    return 0;
  }, [enableLogging]);

  return {
    getMetrics,
    measureFunction,
    mark,
    measure
  };
};

// Hook para monitorear recursos
export const useResourceMonitor = () => {
  const [resources, setResources] = useState<PerformanceResourceTiming[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    const observer = new PerformanceObserver((list) => {
      const newResources = list.getEntries() as PerformanceResourceTiming[];
      setResources(prev => [...prev, ...newResources]);
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, []);

  const getSlowResources = useCallback((threshold = 1000) => {
    return resources.filter(resource => resource.duration > threshold);
  }, [resources]);

  const getLargeResources = useCallback((threshold = 100000) => {
    return resources.filter(resource => 
      resource.transferSize && resource.transferSize > threshold
    );
  }, [resources]);

  return {
    resources,
    getSlowResources,
    getLargeResources
  };
};

// Hook para detectar conexión lenta
export const useConnectionMonitor = () => {
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionInfo(connection);

      const handleChange = () => setConnectionInfo({ ...connection });
      connection.addEventListener('change', handleChange);

      return () => connection.removeEventListener('change', handleChange);
    }
  }, []);

  const isSlowConnection = connectionInfo?.effectiveType === '2g' || 
                         connectionInfo?.effectiveType === 'slow-2g';

  const shouldReduceQuality = isSlowConnection || 
                             (connectionInfo?.saveData === true);

  return {
    connectionInfo,
    isSlowConnection,
    shouldReduceQuality
  };
};

export default usePerformance;
