// Sistema de rate limiting inteligente para EMob
export class SmartRateLimit {
  private requests: Map<string, RequestInfo[]> = new Map();
  private static instance: SmartRateLimit;
  
  // Configuración por endpoint
  private limits: Map<string, RateLimitConfig> = new Map([
    ['matches', { maxRequests: 30, windowMs: 60000, priority: 1 }], // 30/min
    ['teams', { maxRequests: 20, windowMs: 60000, priority: 2 }],   // 20/min
    ['players', { maxRequests: 15, windowMs: 60000, priority: 2 }], // 15/min
    ['live', { maxRequests: 60, windowMs: 60000, priority: 0 }],    // 60/min (alta prioridad)
  ]);

  static getInstance(): SmartRateLimit {
    if (!SmartRateLimit.instance) {
      SmartRateLimit.instance = new SmartRateLimit();
    }
    return SmartRateLimit.instance;
  }

  // Verificar si una request puede proceder
  canProceed(endpoint: string, clientId: string = 'default'): boolean {
    const key = `${endpoint}-${clientId}`;
    const config = this.limits.get(endpoint) || { maxRequests: 10, windowMs: 60000, priority: 3 };
    
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Obtener requests del cliente para este endpoint
    let clientRequests = this.requests.get(key) || [];
    
    // Limpiar requests antiguas
    clientRequests = clientRequests.filter(req => req.timestamp > windowStart);
    
    // Verificar límite
    if (clientRequests.length >= config.maxRequests) {
      return false;
    }
    
    // Registrar nueva request
    clientRequests.push({
      timestamp: now,
      endpoint,
      clientId
    });
    
    this.requests.set(key, clientRequests);
    return true;
  }

  // Obtener tiempo de espera hasta la próxima request disponible
  getRetryAfter(endpoint: string, clientId: string = 'default'): number {
    const key = `${endpoint}-${clientId}`;
    const config = this.limits.get(endpoint) || { maxRequests: 10, windowMs: 60000, priority: 3 };
    
    const clientRequests = this.requests.get(key) || [];
    if (clientRequests.length < config.maxRequests) {
      return 0;
    }
    
    const oldestRequest = clientRequests[0];
    const nextAvailableTime = oldestRequest.timestamp + config.windowMs;
    
    return Math.max(0, nextAvailableTime - Date.now());
  }

  // Obtener estadísticas de uso
  getUsageStats(endpoint: string, clientId: string = 'default'): UsageStats {
    const key = `${endpoint}-${clientId}`;
    const config = this.limits.get(endpoint) || { maxRequests: 10, windowMs: 60000, priority: 3 };
    const clientRequests = this.requests.get(key) || [];
    
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const activeRequests = clientRequests.filter(req => req.timestamp > windowStart);
    
    return {
      current: activeRequests.length,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - activeRequests.length),
      resetTime: windowStart + config.windowMs,
      retryAfter: this.getRetryAfter(endpoint, clientId)
    };
  }

  // Limpiar requests expiradas
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, requests] of this.requests.entries()) {
      const endpoint = key.split('-')[0];
      const config = this.limits.get(endpoint) || { maxRequests: 10, windowMs: 60000, priority: 3 };
      const windowStart = now - config.windowMs;
      
      const activeRequests = requests.filter(req => req.timestamp > windowStart);
      
      if (activeRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, activeRequests);
      }
    }
  }

  // Configurar límites personalizados
  setLimit(endpoint: string, config: RateLimitConfig): void {
    this.limits.set(endpoint, config);
  }
}

interface RequestInfo {
  timestamp: number;
  endpoint: string;
  clientId: string;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  priority: number;
}

interface UsageStats {
  current: number;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter: number;
}

// Hook de React para rate limiting
export const useRateLimit = () => {
  const rateLimit = SmartRateLimit.getInstance();
  
  return {
    canProceed: rateLimit.canProceed.bind(rateLimit),
    getRetryAfter: rateLimit.getRetryAfter.bind(rateLimit),
    getUsageStats: rateLimit.getUsageStats.bind(rateLimit),
    cleanup: rateLimit.cleanup.bind(rateLimit)
  };
};
