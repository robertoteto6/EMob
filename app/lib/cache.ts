// Sistema de cache avanzado para EMob
export class CacheManager {
  private cache: Map<string, CacheItem> = new Map();
  private static instance: CacheManager;
  
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
  private readonly MAX_CACHE_SIZE = 100; // Máximo 100 items en cache

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Guardar en cache
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.DEFAULT_TTL);
    
    // Si el cache está lleno, remover el item más antiguo
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data,
      expiresAt,
      createdAt: Date.now(),
      accessCount: 0
    });
  }

  // Obtener del cache
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Verificar si ha expirado
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    // Incrementar contador de acceso
    item.accessCount++;
    item.lastAccessed = Date.now();
    
    return item.data as T;
  }

  // Verificar si existe en cache
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // Verificar si ha expirado
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Eliminar del cache
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Limpiar cache expirado
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Limpiar todo el cache
  clear(): void {
    this.cache.clear();
  }

  // Obtener estadísticas del cache
  getStats(): CacheStats {
    const now = Date.now();
    let validItems = 0;
    let expiredItems = 0;
    let totalAccessCount = 0;
    
    for (const item of this.cache.values()) {
      if (now > item.expiresAt) {
        expiredItems++;
      } else {
        validItems++;
        totalAccessCount += item.accessCount;
      }
    }
    
    return {
      totalItems: this.cache.size,
      validItems,
      expiredItems,
      totalAccessCount,
      hitRate: totalAccessCount / Math.max(validItems, 1)
    };
  }

  // Cache con respaldo automático
  async getOrFetch<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    // Intentar obtener del cache primero
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Si no está en cache, fetch y guardar
    try {
      const data = await fetcher();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error(`Failed to fetch data for key ${key}:`, error);
      throw error;
    }
  }

  // Cache con invalidación por tags
  private tags: Map<string, Set<string>> = new Map();
  
  setWithTags<T>(key: string, data: T, tags: string[], ttl?: number): void {
    this.set(key, data, ttl);
    
    // Asociar el key con sus tags
    tags.forEach(tag => {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag)!.add(key);
    });
  }
  
  // Invalidar por tag
  invalidateByTag(tag: string): void {
    const keys = this.tags.get(tag);
    if (keys) {
      keys.forEach(key => this.cache.delete(key));
      this.tags.delete(tag);
    }
  }
}

interface CacheItem {
  data: any;
  expiresAt: number;
  createdAt: number;
  lastAccessed?: number;
  accessCount: number;
}

interface CacheStats {
  totalItems: number;
  validItems: number;
  expiredItems: number;
  totalAccessCount: number;
  hitRate: number;
}

// Implementación específica para APIs de esports
export class EsportsCache extends CacheManager {
  
  // Cache específico para partidos
  async getMatches(game: string, timeframe?: string): Promise<any[]> {
    const key = `matches-${game}-${timeframe || 'all'}`;
    return this.getOrFetch(
      key, 
      () => this.fetchMatches(game, timeframe),
      2 * 60 * 1000 // 2 minutos para partidos (datos más dinámicos)
    );
  }
  
  // Cache específico para equipos
  async getTeams(game: string, search?: string): Promise<any[]> {
    const key = `teams-${game}-${search || 'all'}`;
    return this.getOrFetch(
      key,
      () => this.fetchTeams(game, search),
      10 * 60 * 1000 // 10 minutos para equipos
    );
  }
  
  // Cache específico para jugadores
  async getPlayers(game: string, search?: string): Promise<any[]> {
    const key = `players-${game}-${search || 'all'}`;
    return this.getOrFetch(
      key,
      () => this.fetchPlayers(game, search),
      15 * 60 * 1000 // 15 minutos para jugadores
    );
  }
  
  // Implementaciones de fetch (estos métodos llamarían a las APIs reales)
  private async fetchMatches(game: string, timeframe?: string): Promise<any[]> {
    const response = await fetch(`/api/esports/matches?game=${game}&timeframe=${timeframe || ''}`);
    return response.json();
  }
  
  private async fetchTeams(game: string, search?: string): Promise<any[]> {
    const response = await fetch(`/api/esports/teams?game=${game}&search=${search || ''}`);
    return response.json();
  }
  
  private async fetchPlayers(game: string, search?: string): Promise<any[]> {
    const response = await fetch(`/api/esports/players?game=${game}&search=${search || ''}`);
    return response.json();
  }
  
  // Invalidar cache cuando hay actualizaciones
  invalidateMatchData(game?: string): void {
    if (game) {
      this.invalidateByTag(`matches-${game}`);
    } else {
      // Invalidar todos los partidos
      ['dota2', 'lol', 'csgo', 'r6siege', 'overwatch'].forEach(g => {
        this.invalidateByTag(`matches-${g}`);
      });
    }
  }
}

// Hook de React para usar el cache
export const useCache = () => {
  const cache = CacheManager.getInstance();
  const esportsCache = new EsportsCache();
  
  return {
    get: cache.get.bind(cache),
    set: cache.set.bind(cache),
    has: cache.has.bind(cache),
    delete: cache.delete.bind(cache),
    clear: cache.clear.bind(cache),
    getStats: cache.getStats.bind(cache),
    getOrFetch: cache.getOrFetch.bind(cache),
    
    // Métodos específicos para esports
    getMatches: esportsCache.getMatches.bind(esportsCache),
    getTeams: esportsCache.getTeams.bind(esportsCache),
    getPlayers: esportsCache.getPlayers.bind(esportsCache),
    invalidateMatchData: esportsCache.invalidateMatchData.bind(esportsCache),
  };
};
