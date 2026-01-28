'use client';

import { getGlobalCache } from './advancedCache';

// Tipos para optimización de consultas
interface QueryConfig {
  endpoint: string;
  params?: Record<string, any>;
  cacheKey?: string;
  cacheTTL?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  retries?: number;
  timeout?: number;
  batchable?: boolean;
}

interface BatchRequest {
  id: string;
  config: QueryConfig;
  resolve: (data: any) => void;
  reject: (error: any) => void;
}

interface QueryResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  timestamp: number;
}

// Clase principal para optimización de consultas
export class QueryOptimizer {
  private static instance: QueryOptimizer;
  private cache = getGlobalCache();
  private batchQueue: BatchRequest[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private batchDelay = 50; // ms
  private maxBatchSize = 10;
  private activeRequests = new Map<string, Promise<any>>();
  private requestMetrics = new Map<string, {
    count: number;
    totalTime: number;
    errors: number;
    lastUsed: number;
  }>();

  private constructor() {
    // Limpiar métricas cada hora
    setInterval(() => {
      this.cleanupMetrics();
    }, 60 * 60 * 1000);
  }

  public static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer();
    }
    return QueryOptimizer.instance;
  }

  // Ejecutar consulta optimizada
  public async query<T>(config: QueryConfig): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const cacheKey = config.cacheKey || this.generateCacheKey(config);
    
    try {
      // 1. Verificar cache primero
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        this.updateMetrics(cacheKey, Date.now() - startTime, false);
        return {
          data: cachedResult as T,
          error: null,
          isLoading: false,
          timestamp: Date.now(),
        };
      }

      // 2. Verificar si ya hay una request activa para esta consulta
      if (this.activeRequests.has(cacheKey)) {
        const data = await this.activeRequests.get(cacheKey)!;
        return {
          data,
          error: null,
          isLoading: false,
          timestamp: Date.now(),
        };
      }

      // 3. Ejecutar consulta
      const requestPromise = this.executeQuery<T>(config);
      this.activeRequests.set(cacheKey, requestPromise);

      try {
        const data = await requestPromise;
        
        // Cachear resultado
        this.cache.set(cacheKey, data, {
          ttl: config.cacheTTL || 5 * 60 * 1000, // 5 minutos por defecto
          priority: config.priority || 'medium',
          tags: ['query', config.endpoint.split('/')[1] || 'api'],
        });

        this.updateMetrics(cacheKey, Date.now() - startTime, false);
        
        return {
          data,
          error: null,
          isLoading: false,
          timestamp: Date.now(),
        };
      } finally {
        this.activeRequests.delete(cacheKey);
      }

    } catch (error) {
      this.updateMetrics(cacheKey, Date.now() - startTime, true);
      return {
        data: null,
        error: error as Error,
        isLoading: false,
        timestamp: Date.now(),
      };
    }
  }

  // Ejecutar consulta con reintentos y timeout
  private async executeQuery<T>(config: QueryConfig): Promise<T> {
    const {
      endpoint,
      params = {},
      retries = 3,
      timeout = 10000,
    } = config;

    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const requestUrl = this.buildRequestUrl(endpoint, params);
          const response = await fetch(requestUrl, {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
            },
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(`Request to ${requestUrl} failed with status ${response.status}${errorText ? `: ${errorText}` : ''}`);
          }

          const text = await response.text();
          if (!text) {
            return null as T;
          }

          try {
            return JSON.parse(text) as T;
          } catch (parseError) {
            throw new Error(`Failed to parse JSON response from ${requestUrl}: ${(parseError as Error).message}`);
          }
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      } catch (error) {
        lastError = error as Error;

        // Si no es el último intento, esperar antes de reintentar
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Backoff exponencial
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  // Consulta en lote
  public async batchQuery<T>(configs: QueryConfig[]): Promise<QueryResult<T>[]> {
    const promises = configs.map(config => this.query<T>(config));
    return Promise.all(promises);
  }

  // Agregar consulta a lote (para consultas batchables)
  public queueBatchQuery<T>(config: QueryConfig): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: BatchRequest = {
        id: this.generateRequestId(),
        config,
        resolve,
        reject,
      };

      this.batchQueue.push(request);

      // Procesar lote si alcanzamos el tamaño máximo
      if (this.batchQueue.length >= this.maxBatchSize) {
        this.processBatch();
      } else if (!this.batchTimer) {
        // Configurar timer para procesar lote
        this.batchTimer = setTimeout(() => {
          this.processBatch();
        }, this.batchDelay);
      }
    });
  }

  // Procesar lote de consultas
  private async processBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const batch = this.batchQueue.splice(0, this.maxBatchSize);
    if (batch.length === 0) return;

    // Agrupar por endpoint para optimizar
    const groupedRequests = new Map<string, BatchRequest[]>();
    batch.forEach(request => {
      const endpoint = request.config.endpoint;
      if (!groupedRequests.has(endpoint)) {
        groupedRequests.set(endpoint, []);
      }
      groupedRequests.get(endpoint)!.push(request);
    });

    // Procesar cada grupo
    for (const [endpoint, requests] of groupedRequests) {
      try {
        // Para endpoints que soportan consultas múltiples
        if (this.supportsBatchQuery(endpoint)) {
          await this.executeBatchQuery(requests);
        } else {
          // Ejecutar consultas individuales en paralelo
          await Promise.all(
            requests.map(async request => {
              try {
                const result = await this.query(request.config);
                request.resolve(result.data);
              } catch (error) {
                request.reject(error);
              }
            })
          );
        }
      } catch (error) {
        // Rechazar todas las consultas del grupo
        requests.forEach(request => request.reject(error));
      }
    }
  }

  // Verificar si un endpoint soporta consultas en lote
  private supportsBatchQuery(endpoint: string): boolean {
    // Lista de endpoints que soportan consultas múltiples
    const batchSupportedEndpoints = [
      '/api/esports/matches',
      '/api/esports/tournaments',
      '/api/esports/teams',
      '/api/esports/players',
      '/api/esports/leagues',
      '/api/esports/series',
      '/api/esports/lives',
      '/api/esports/odds',
      '/api/esports/stats',
      '/api/esports/games',
      '/api/esports/brackets',
    ];
    
    return batchSupportedEndpoints.some(supported => endpoint.includes(supported));
  }

  // Ejecutar consulta en lote para endpoints que lo soportan
  private async executeBatchQuery(requests: BatchRequest[]): Promise<void> {
    // Combinar parámetros de todas las consultas
    const combinedParams = new Map<string, Set<string>>();
    
    requests.forEach(request => {
      Object.entries(request.config.params || {}).forEach(([key, value]) => {
        if (!combinedParams.has(key)) {
          combinedParams.set(key, new Set());
        }
        combinedParams.get(key)!.add(String(value));
      });
    });

    // Crear parámetros de consulta combinados
    const batchParams: Record<string, string> = {};
    combinedParams.forEach((values, key) => {
      batchParams[key] = Array.from(values).join(',');
    });

    try {
      const result = await this.executeQuery({
        endpoint: requests[0].config.endpoint,
        params: batchParams,
      });

      // Distribuir resultados a cada request
      requests.forEach(request => {
        // Filtrar resultado para cada request específico
        const filteredResult = this.filterBatchResult(result, request.config.params);
        request.resolve(filteredResult);
      });
    } catch (error) {
      requests.forEach(request => request.reject(error));
    }
  }

  // Filtrar resultado de lote para una consulta específica
  private filterBatchResult(batchResult: any, originalParams: Record<string, any> = {}): any {
    if (!Array.isArray(batchResult)) {
      return batchResult;
    }

    // Filtrar por parámetros originales
    return batchResult.filter((item: any) => {
      return Object.entries(originalParams).every(([key, value]) => {
        // Lógica de filtrado específica por tipo de dato
        if (key === 'game' && item.game) {
          return item.game === value;
        }
        // Agregar más lógica de filtrado según sea necesario
        return true;
      });
    });
  }

  // Generar clave de cache
  private generateCacheKey(config: QueryConfig): string {
    const paramsString = JSON.stringify(config.params || {});
    return `query_${config.endpoint}_${btoa(paramsString).replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  private buildRequestUrl(endpoint: string, params: Record<string, unknown>): string {
    const isAbsolute = /^https?:\/\//i.test(endpoint);
    const base = isAbsolute
      ? endpoint
      : `${this.getBaseUrl().replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
    const url = new URL(base);

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null) {
            url.searchParams.append(key, String(item));
          }
        });
        return;
      }
      url.searchParams.append(key, String(value));
    });

    return url.toString();
  }

  private getBaseUrl(): string {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  }

  // Generar ID de request
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Actualizar métricas de rendimiento
  private updateMetrics(key: string, duration: number, isError: boolean): void {
    const existing = this.requestMetrics.get(key) || {
      count: 0,
      totalTime: 0,
      errors: 0,
      lastUsed: 0,
    };

    existing.count++;
    existing.totalTime += duration;
    existing.lastUsed = Date.now();
    
    if (isError) {
      existing.errors++;
    }

    this.requestMetrics.set(key, existing);
  }

  // Limpiar métricas antiguas
  private cleanupMetrics(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    for (const [key, metrics] of this.requestMetrics.entries()) {
      if (metrics.lastUsed < oneHourAgo) {
        this.requestMetrics.delete(key);
      }
    }
  }

  // Obtener métricas de rendimiento
  public getMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};
    
    for (const [key, data] of this.requestMetrics.entries()) {
      metrics[key] = {
        averageTime: data.totalTime / data.count,
        totalRequests: data.count,
        errorRate: data.errors / data.count,
        lastUsed: new Date(data.lastUsed).toISOString(),
      };
    }
    
    return metrics;
  }

  // Precargar consultas críticas
  public async preloadCriticalQueries(): Promise<void> {
    const criticalQueries: QueryConfig[] = [
      {
        endpoint: '/api/esports/matches',
        params: { status: 'running' },
        priority: 'critical',
        cacheTTL: 30 * 1000, // 30 segundos
      },
      {
        endpoint: '/api/esports/matches',
        params: { status: 'upcoming', per_page: 10 },
        priority: 'high',
        cacheTTL: 2 * 60 * 1000, // 2 minutos
      },
      {
        endpoint: '/api/esports/tournaments',
        params: { status: 'running' },
        priority: 'high',
        cacheTTL: 5 * 60 * 1000, // 5 minutos
      },
      {
        endpoint: '/api/esports/lives',
        params: {},
        priority: 'critical',
        cacheTTL: 30 * 1000, // 30 segundos
      },
      {
        endpoint: '/api/esports/leagues',
        params: { per_page: 20 },
        priority: 'medium',
        cacheTTL: 10 * 60 * 1000, // 10 minutos
      },
      {
        endpoint: '/api/esports/series',
        params: { per_page: 20 },
        priority: 'medium',
        cacheTTL: 10 * 60 * 1000, // 10 minutos
      },
    ];

    await this.batchQuery(criticalQueries);
  }

  // Invalidar cache por tags
  public invalidateCache(tags: string[]): void {
    tags.forEach(tag => {
      this.cache.deleteByTag(tag);
    });
  }

  // Limpiar todo el cache de consultas
  public clearQueryCache(): void {
    this.cache.deleteByTag('query');
  }
}

// Instancia global
const queryOptimizer = QueryOptimizer.getInstance();

// Funciones de utilidad exportadas
export const optimizedQuery = <T>(config: QueryConfig) => queryOptimizer.query<T>(config);
export const batchQuery = <T>(configs: QueryConfig[]) => queryOptimizer.batchQuery<T>(configs);
export const queueBatchQuery = <T>(config: QueryConfig) => queryOptimizer.queueBatchQuery<T>(config);
export const preloadCriticalQueries = () => queryOptimizer.preloadCriticalQueries();
export const getQueryMetrics = () => queryOptimizer.getMetrics();
export const invalidateQueryCache = (tags: string[]) => queryOptimizer.invalidateCache(tags);
export const clearQueryCache = () => queryOptimizer.clearQueryCache();

// Hook para usar en componentes React
export function useOptimizedQuery<T>(config: QueryConfig) {
  const [result, setResult] = useState<QueryResult<T>>({
    data: null,
    error: null,
    isLoading: true,
    timestamp: Date.now(),
  });

  useEffect(() => {
    let isMounted = true;

    const executeQuery = async () => {
      if (!isMounted) return;
      
      setResult(prev => ({ ...prev, isLoading: true }));
      
      try {
        const queryResult = await optimizedQuery<T>(config);
        
        if (isMounted) {
          setResult(queryResult);
        }
      } catch (error) {
        if (isMounted) {
          setResult({
            data: null,
            error: error as Error,
            isLoading: false,
            timestamp: Date.now(),
          });
        }
      }
    };

    executeQuery();

    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(config)]);

  const refetch = useCallback(() => {
    // Invalidar cache para esta consulta específica
    const cacheKey = queryOptimizer['generateCacheKey'](config);
    queryOptimizer['cache'].delete(cacheKey);
    
    // Re-ejecutar consulta
    optimizedQuery<T>(config).then(setResult);
  }, [config]);

  return {
    ...result,
    refetch,
  };
}

export default QueryOptimizer;

// Importar useState, useEffect, useCallback
import { useState, useEffect, useCallback } from 'react';
