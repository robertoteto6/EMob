// Función de debounce para optimizar búsquedas
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Función para formatear fechas de manera optimizada
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

// Función para formatear números grandes
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    const value = num / 1000000;
    return (value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)) + 'M';
  }
  if (num >= 1000) {
    const value = num / 1000;
    return (value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)) + 'K';
  }
  return num.toString();
}

// Función para generar clases CSS condicionales
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Cache optimizado para resultados de API
class OptimizedCache {
  private cache = new Map<string, { data: any; timestamp: number; accessCount: number; lastAccess: number }>();
  private ttl: number;
  private maxSize: number;

  constructor(ttlMinutes: number = 5, maxSize: number = 100) {
    this.ttl = ttlMinutes * 60 * 1000; // Convertir a milisegundos
    this.maxSize = maxSize;
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    const now = Date.now();
    if (now - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Actualizar estadísticas de acceso
    item.accessCount++;
    item.lastAccess = now;
    
    return item.data;
  }

  set(key: string, data: any): void {
    // Si el cache está lleno, eliminar el elemento menos usado
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }
    
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccess: now
    });
  }

  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let leastUsedCount = Infinity;
    let oldestAccess = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.accessCount < leastUsedCount || 
          (item.accessCount === leastUsedCount && item.lastAccess < oldestAccess)) {
        leastUsedKey = key;
        leastUsedCount = item.accessCount;
        oldestAccess = item.lastAccess;
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Instancia global del cache
export const apiCache = new OptimizedCache(5, 50); // 5 minutos de TTL, máximo 50 elementos

// Función para throttle (limitar frecuencia de ejecución)
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Función para lazy loading de imágenes
export function createImageLoader() {
  if (typeof window === 'undefined') return null;
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      }
    });
  });
  
  return imageObserver;
}

// Función para detectar si el usuario prefiere reducir animaciones
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Función para optimizar el rendimiento de scroll
export function optimizeScroll(callback: () => void): () => void {
  let ticking = false;
  
  const handleScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        callback();
        ticking = false;
      });
      ticking = true;
    }
  };
  
  return handleScroll;
}