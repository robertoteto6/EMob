'use client';

// Sistema de cache avanzado con múltiples estrategias

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  size: number;
}

interface CacheOptions {
  ttl?: number; // Time to live en milisegundos
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  maxSize?: number; // Tamaño máximo en bytes
  strategy?: 'lru' | 'lfu' | 'fifo' | 'ttl';
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
  entryCount: number;
  hitRate: number;
}

class AdvancedCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private maxEntries: number;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    entryCount: 0,
    hitRate: 0,
  };
  private cleanupInterval: NodeJS.Timeout | null = null;
  private compressionEnabled: boolean;

  constructor(options: {
    maxSize?: number; // en bytes
    maxEntries?: number;
    cleanupInterval?: number; // en milisegundos
    compressionEnabled?: boolean;
  } = {}) {
    this.maxSize = options.maxSize || 50 * 1024 * 1024; // 50MB por defecto
    this.maxEntries = options.maxEntries || 1000;
    this.compressionEnabled = options.compressionEnabled || false;

    // Configurar limpieza automática
    if (options.cleanupInterval) {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, options.cleanupInterval);
    }

    // Limpiar al cerrar la página
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.destroy();
      });
    }
  }

  // Obtener datos del cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Verificar si ha expirado
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      this.updateStats();
      return null;
    }

    // Actualizar estadísticas de acceso
    entry.accessCount++;
    entry.lastAccess = Date.now();
    this.stats.hits++;
    this.updateHitRate();

    return this.decompress(entry.data);
  }

  // Almacenar datos en el cache
  set<T>(key: string, data: T, options: CacheOptions = {}): boolean {
    const {
      ttl = 5 * 60 * 1000, // 5 minutos por defecto
      priority = 'medium',
      tags = [],
      strategy = 'lru',
    } = options;

    const compressedData = this.compress(data);
    const size = this.calculateSize(compressedData);

    // Verificar límites antes de almacenar
    if (size > this.maxSize) {
      console.warn(`Cache entry too large: ${size} bytes`);
      return false;
    }

    // Hacer espacio si es necesario
    this.makeSpace(size, strategy);

    const entry: CacheEntry<T> = {
      data: compressedData,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccess: Date.now(),
      priority,
      tags,
      size,
    };

    this.cache.set(key, entry);
    this.updateStats();
    return true;
  }

  // Eliminar entrada específica
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats();
    }
    return deleted;
  }

  // Eliminar por tags
  deleteByTag(tag: string): number {
    let deletedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    this.updateStats();
    return deletedCount;
  }

  // Limpiar entradas expiradas
  cleanup(): number {
    let cleanedCount = 0;
    const _now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.stats.evictions += cleanedCount;
      this.updateStats();
    }
    
    return cleanedCount;
  }

  // Hacer espacio en el cache
  private makeSpace(requiredSize: number, strategy: string): void {
    while (
      (this.stats.totalSize + requiredSize > this.maxSize) ||
      (this.cache.size >= this.maxEntries)
    ) {
      const keyToEvict = this.selectEvictionCandidate(strategy);
      if (keyToEvict) {
        this.cache.delete(keyToEvict);
        this.stats.evictions++;
      } else {
        break; // No hay más candidatos para evicción
      }
    }
  }

  // Seleccionar candidato para evicción según la estrategia
  private selectEvictionCandidate(strategy: string): string | null {
    if (this.cache.size === 0) return null;

    let candidate: string | null = null;
    let candidateScore = -1;

    for (const [key, entry] of this.cache.entries()) {
      let score = 0;

      switch (strategy) {
        case 'lru': // Least Recently Used
          score = -entry.lastAccess;
          break;
        case 'lfu': // Least Frequently Used
          score = -entry.accessCount;
          break;
        case 'fifo': // First In, First Out
          score = -entry.timestamp;
          break;
        case 'ttl': // Shortest TTL first
          score = -(entry.timestamp + entry.ttl);
          break;
        default:
          score = -entry.lastAccess; // Default to LRU
      }

      // Ajustar score por prioridad
      const priorityMultiplier = {
        low: 1,
        medium: 0.5,
        high: 0.25,
        critical: 0.1,
      }[entry.priority];
      
      score *= priorityMultiplier;

      if (candidate === null || score > candidateScore) {
        candidate = key;
        candidateScore = score;
      }
    }

    return candidate;
  }

  // Verificar si una entrada ha expirado
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }

  // Comprimir datos si está habilitado
  private compress<T>(data: T): T {
    if (!this.compressionEnabled) return data;
    
    try {
      // Implementación básica de compresión (en producción usar una librería real)
      if (typeof data === 'string') {
        return data as T; // Por ahora no comprimir strings
      }
      return data;
    } catch (error) {
      console.warn('Compression failed:', error);
      return data;
    }
  }

  // Descomprimir datos
  private decompress<T>(data: T): T {
    if (!this.compressionEnabled) return data;
    
    try {
      return data; // Por ahora retornar tal como está
    } catch (error) {
      console.warn('Decompression failed:', error);
      return data;
    }
  }

  // Calcular tamaño aproximado de los datos
  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      // Fallback para datos que no se pueden serializar
      return 1024; // 1KB por defecto
    }
  }

  // Actualizar estadísticas
  private updateStats(): void {
    this.stats.entryCount = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
  }

  // Actualizar tasa de aciertos
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  // Obtener estadísticas
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Limpiar todo el cache
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      entryCount: 0,
      hitRate: 0,
    };
  }

  // Destruir el cache y limpiar recursos
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }

  // Obtener información de una entrada específica
  getEntryInfo(key: string): Partial<CacheEntry<any>> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    return {
      timestamp: entry.timestamp,
      ttl: entry.ttl,
      accessCount: entry.accessCount,
      lastAccess: entry.lastAccess,
      priority: entry.priority,
      tags: entry.tags,
      size: entry.size,
    };
  }

  // Exportar cache para debugging
  export(): Record<string, any> {
    const exported: Record<string, any> = {};
    for (const [key, entry] of this.cache.entries()) {
      exported[key] = {
        data: entry.data,
        ...this.getEntryInfo(key),
      };
    }
    return exported;
  }
}

// Instancia global del cache
let globalCache: AdvancedCache | null = null;

// Función para obtener la instancia global
export function getGlobalCache(): AdvancedCache {
  if (!globalCache) {
    globalCache = new AdvancedCache({
      maxSize: 100 * 1024 * 1024, // 100MB
      maxEntries: 2000,
      cleanupInterval: 5 * 60 * 1000, // 5 minutos
      compressionEnabled: false,
    });
  }
  return globalCache;
}

// Hook para usar el cache en componentes React
export function useAdvancedCache() {
  const cache = getGlobalCache();

  return {
    get: cache.get.bind(cache),
    set: cache.set.bind(cache),
    delete: cache.delete.bind(cache),
    deleteByTag: cache.deleteByTag.bind(cache),
    clear: cache.clear.bind(cache),
    getStats: cache.getStats.bind(cache),
    cleanup: cache.cleanup.bind(cache),
  };
}

// Decorador para cachear resultados de funciones
export function cached<T extends (...args: any[]) => any>(
  fn: T,
  options: CacheOptions & { keyGenerator?: (...args: Parameters<T>) => string } = {}
): T {
  const cache = getGlobalCache();
  const { keyGenerator = (...args) => JSON.stringify(args), ...cacheOptions } = options;

  return ((...args: Parameters<T>) => {
    const key = `fn_${fn.name}_${keyGenerator(...args)}`;
    
    // Intentar obtener del cache
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Ejecutar función y cachear resultado
    const result = fn(...args);
    
    // Si es una promesa, cachear cuando se resuelva
    if (result instanceof Promise) {
      return result.then((resolvedResult) => {
        cache.set(key, resolvedResult, cacheOptions);
        return resolvedResult;
      });
    }

    // Cachear resultado inmediatamente
    cache.set(key, result, cacheOptions);
    return result;
  }) as T;
}

export default AdvancedCache;
export type { CacheEntry, CacheOptions, CacheStats };