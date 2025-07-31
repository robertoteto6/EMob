// Sistema de monitoreo de performance para EMob
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Marcar inicio de una operación
  startMeasure(name: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-start`);
    }
  }

  // Marcar fin de una operación y calcular duración
  endMeasure(name: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name)[0];
      this.metrics.set(name, measure.duration);
      
      // Log si es más lento de lo esperado
      if (measure.duration > 1000) {
        console.warn(`Slow operation detected: ${name} took ${measure.duration}ms`);
      }
      
      return measure.duration;
    }
    return 0;
  }

  // Monitorear llamadas a API
  async measureApiCall<T>(
    name: string, 
    apiCall: () => Promise<T>
  ): Promise<T> {
    this.startMeasure(`api-${name}`);
    try {
      const result = await apiCall();
      this.endMeasure(`api-${name}`);
      return result;
    } catch (error) {
      this.endMeasure(`api-${name}`);
      console.error(`API call failed: ${name}`, error);
      throw error;
    }
  }

  // Monitorear renders de componentes
  measureRender(componentName: string, renderFn: () => void) {
    this.startMeasure(`render-${componentName}`);
    renderFn();
    this.endMeasure(`render-${componentName}`);
  }

  // Obtener métricas almacenadas
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Limpiar métricas
  clearMetrics() {
    this.metrics.clear();
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }

  // Observer para cambios en el DOM
  observeDOM() {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          console.log(`Performance: ${entry.name} took ${entry.duration}ms`);
        }
      }
    });

    observer.observe({ entryTypes: ['measure'] });
  }

  // Detectar memory leaks
  checkMemoryUsage() {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      const usage = {
        used: Math.round(memory.usedJSHeapSize / 1048576),
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576)
      };

      if (usage.used > usage.limit * 0.9) {
        console.warn('High memory usage detected:', usage);
      }

      return usage;
    }
    return null;
  }
}

// Hook de React para performance
export const usePerformance = () => {
  const monitor = PerformanceMonitor.getInstance();

  return {
    startMeasure: monitor.startMeasure.bind(monitor),
    endMeasure: monitor.endMeasure.bind(monitor),
    measureApiCall: monitor.measureApiCall.bind(monitor),
    measureRender: monitor.measureRender.bind(monitor),
    getMetrics: monitor.getMetrics.bind(monitor),
    clearMetrics: monitor.clearMetrics.bind(monitor),
    checkMemoryUsage: monitor.checkMemoryUsage.bind(monitor)
  };
};
