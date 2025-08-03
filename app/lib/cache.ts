// Sistema de cache optimizado para EMob

// Tipos para el sistema de cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number; // Time to live en milisegundos
  maxSize?: number; // Máximo número de entradas
  strategy?: 'lru' | 'lfu' | 'fifo'; // Estrategia de eliminación
  serialize?: boolean; // Serializar datos para localStorage
  prefix?: string; // Prefijo para claves
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

// Clase principal de cache
export class OptimizedCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private options: Required<CacheOptions>;
  private stats = { hits: 0, misses: 0 };
  private cleanupInterval?: NodeJS.Timeout;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutos por defecto
      maxSize: 100,
      strategy: 'lru',
      serialize: false,
      prefix: 'emob_cache',
      ...options
    };

    // Limpiar cache expirado cada minuto
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);

    // Cargar desde localStorage si está habilitado
    if (this.options.serialize && typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  // Obtener valor del cache
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Actualizar estadísticas de acceso
    entry.hits++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    return entry.data;
  }

  // Establecer valor en cache
  set(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.options.ttl;
    const now = Date.now();

    // Si el cache está lleno, eliminar según estrategia
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evict();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl,
      hits: 0,
      lastAccessed: now
    };

    this.cache.set(key, entry);

    // Guardar en localStorage si está habilitado
    if (this.options.serialize) {
      this.saveToStorage(key, entry);
    }
  }

  // Verificar si existe una clave
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Verificar si ha expirado
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Eliminar entrada específica
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    
    if (this.options.serialize && typeof window !== 'undefined') {
      localStorage.removeItem(`${this.options.prefix}_${key}`);
    }
    
    return deleted;
  }

  // Limpiar todo el cache
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
    
    if (this.options.serialize && typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.options.prefix)
      );
      keys.forEach(key => localStorage.removeItem(key));
    }
  }

  // Obtener estadísticas del cache
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0
    };
  }

  // Estrategia de eliminación
  private evict(): void {
    if (this.cache.size === 0) return;

    let keyToDelete: string;
    
    switch (this.options.strategy) {
      case 'lru': // Least Recently Used
        keyToDelete = this.findLRU();
        break;
      case 'lfu': // Least Frequently Used
        keyToDelete = this.findLFU();
        break;
      case 'fifo': // First In, First Out
        keyToDelete = this.cache.keys().next().value;
        break;
      default:
        keyToDelete = this.cache.keys().next().value;
    }
    
    this.delete(keyToDelete);
  }

  private findLRU(): string {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  private findLFU(): string {
    let leastUsedKey = '';
    let leastHits = Infinity;
    
    for (const [key, entry] of this.cache) {
      if (entry.hits < leastHits) {
        leastHits = entry.hits;
        leastUsedKey = key;
      }
    }
    
    return leastUsedKey;
  }

  // Limpiar entradas expiradas
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
  }

  // Guardar en localStorage
  private saveToStorage(key: string, entry: CacheEntry<T>): void {
    if (typeof window === 'undefined') return;
    
    try {
      const storageKey = `${this.options.prefix}_${key}`;
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  // Cargar desde localStorage
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.options.prefix)
      );
      
      keys.forEach(storageKey => {
        const cacheKey = storageKey.replace(`${this.options.prefix}_`, '');
        const data = localStorage.getItem(storageKey);
        
        if (data) {
          const entry: CacheEntry<T> = JSON.parse(data);
          
          // Verificar si no ha expirado
          if (Date.now() - entry.timestamp <= entry.ttl) {
            this.cache.set(cacheKey, entry);
          } else {
            localStorage.removeItem(storageKey);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }

  // Destructor
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Cache específico para APIs
export class APICache extends OptimizedCache<any> {
  constructor() {
    super({
      ttl: 5 * 60 * 1000, // 5 minutos
      maxSize: 50,
      strategy: 'lru',
      serialize: true,
      prefix: 'emob_api'
    });
  }

  // Método específico para cachear respuestas de API
  cacheResponse(url: string, params: any, response: any, customTtl?: number): void {
    const key = this.generateKey(url, params);
    this.set(key, response, customTtl);
  }

  // Obtener respuesta cacheada
  getCachedResponse(url: string, params: any): any | null {
    const key = this.generateKey(url, params);
    return this.get(key);
  }

  // Generar clave única para URL y parámetros
  private generateKey(url: string, params: any): string {
    const paramString = JSON.stringify(params || {});
    return `${url}_${btoa(paramString)}`;
  }
}

// Cache para imágenes
export class ImageCache extends OptimizedCache<string> {
  constructor() {
    super({
      ttl: 30 * 60 * 1000, // 30 minutos
      maxSize: 100,
      strategy: 'lru',
      serialize: false,
      prefix: 'emob_images'
    });
  }

  // Precargar imagen y cachear
  async preloadImage(src: string): Promise<string> {
    if (this.has(src)) {
      return this.get(src)!;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.set(src, src);
        resolve(src);
      };
      img.onerror = reject;
      img.src = src;
    });
  }
}

// Cache para componentes React
export class ComponentCache extends OptimizedCache<React.ComponentType> {
  constructor() {
    super({
      ttl: 60 * 60 * 1000, // 1 hora
      maxSize: 20,
      strategy: 'lfu',
      serialize: false,
      prefix: 'emob_components'
    });
  }
}

// Instancias globales
export const apiCache = new APICache();
export const imageCache = new ImageCache();
export const componentCache = new ComponentCache();

// Hook para usar cache en componentes React
import { useCallback, useEffect, useRef } from 'react';

export function useCache<T>(cacheInstance: OptimizedCache<T>) {
  const cache = useRef(cacheInstance);

  const get = useCallback((key: string) => {
    return cache.current.get(key);
  }, []);

  const set = useCallback((key: string, data: T, ttl?: number) => {
    cache.current.set(key, data, ttl);
  }, []);

  const remove = useCallback((key: string) => {
    return cache.current.delete(key);
  }, []);

  const clear = useCallback(() => {
    cache.current.clear();
  }, []);

  const stats = useCallback(() => {
    return cache.current.getStats();
  }, []);

  // Limpiar cache al desmontar componente
  useEffect(() => {
    return () => {
      // No limpiar automáticamente para mantener cache entre componentes
    };
  }, []);

  return { get, set, remove, clear, stats };
}

// Decorator para cachear resultados de funciones
export function cached<T extends (...args: any[]) => any>(
  fn: T,
  options: { ttl?: number; keyGenerator?: (...args: Parameters<T>) => string } = {}
): T {
  const cache = new OptimizedCache<ReturnType<T>>({
    ttl: options.ttl || 5 * 60 * 1000,
    maxSize: 50
  });

  const keyGenerator = options.keyGenerator || ((...args) => JSON.stringify(args));

  return ((...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    const cached = cache.get(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
}

// Utilidad para invalidar cache por patrón
export function invalidateByPattern(pattern: RegExp, cacheInstance: OptimizedCache) {
  const keysToDelete: string[] = [];
  
  // Nota: Map no tiene método para iterar claves directamente
  // Esta es una implementación simplificada
  for (const [key] of (cacheInstance as any).cache) {
    if (pattern.test(key)) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => cacheInstance.delete(key));
}

export default OptimizedCache;