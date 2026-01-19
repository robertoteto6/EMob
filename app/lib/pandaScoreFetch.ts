// Solo importar proxy agent en el servidor; evitar fallos en Edge/Browser
let getProxyAgent: (() => any) | undefined;
if (typeof window === 'undefined') {
  try {
    // En algunos entornos (Edge/Browser) `require` no existe.
    // Obtenemos una referencia segura desde globalThis para evitar errores de tipos.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const req = (globalThis as any).require as undefined | ((id: string) => any);
    if (typeof req === 'function') {
      const mod = req('./proxyAgent');
      getProxyAgent = mod?.getProxyAgent;
    }
  } catch {
    getProxyAgent = undefined;
  }
}
// In server context, prefer the server cache implementation
import { getGlobalCache, cached } from './advancedCache.server';
import { reportApiError, reportApiSuccess } from './apiErrorReporter';

export async function pandaScoreFetch(
  baseUrl: string,
  searchParams: URLSearchParams = new URLSearchParams(),
  options: RequestInit = {},
  cacheOptions?: { ttl?: number; priority?: 'low' | 'medium' | 'high' | 'critical'; tags?: string[] }
) {
  const cache = getGlobalCache();

  // Nunca mutar los searchParams entrantes para evitar claves inconsistentes
  const baseParams = new URLSearchParams(searchParams);

  // Generar clave de cache (sin token)
  const cacheKey = `api_${baseUrl}_${baseParams.toString()}`;
  
  // Intentar obtener del cache primero
  const cachedResponse = cache.get(cacheKey);
  if (cachedResponse) {
    // Crear una respuesta simulada desde el cache
    return new Response(JSON.stringify(cachedResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const keys = [
    process.env.PANDA_SCORE_TOKEN,
    process.env.PANDA_SCORE_TOKEN_FALLBACK,
  ].filter(Boolean) as string[];

  if (keys.length === 0) {
    // Report explicitly to help track misconfiguration in prod
    reportApiError({
      service: 'pandascore',
      url: baseUrl,
      message: 'Missing PandaScore API keys in environment variables',
      timestamp: new Date().toISOString(),
      method: (options as any)?.method || 'GET',
      params: searchParams.toString(),
      duration: 0,
      retryCount: 0,
    });
    throw new Error('Missing PandaScore API keys in environment variables');
  }

  let lastError: Error | null = null;
  let retryCount = 0;

  for (const key of keys) {
    const url = new URL(baseUrl);
    const finalParams = new URLSearchParams(baseParams);
    finalParams.set('token', key);
    url.search = finalParams.toString();

    const startTime = Date.now();

    try {
      const fetchOptions: RequestInit = {
        ...(options as RequestInit),
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          ...options.headers,
        },
      };

      // Solo usar proxy agent en el servidor
      if (typeof window === 'undefined' && getProxyAgent) {
        (fetchOptions as any).dispatcher = getProxyAgent();
      }

      const res = await fetch(url.toString(), fetchOptions);
      const duration = Date.now() - startTime;

      if (res.ok) {
        // Reportar éxito para monitoreo
        reportApiSuccess('pandascore', baseUrl, duration, res.status);

        // Cachear la respuesta exitosa
        try {
          const responseData = await res.clone().json();
          cache.set(cacheKey, responseData, {
            ttl: cacheOptions?.ttl || 5 * 60 * 1000, // 5 minutos por defecto
            priority: cacheOptions?.priority || 'medium',
            tags: ['api', 'pandascore', ...(cacheOptions?.tags || [])],
          });
        } catch (cacheError) {
          console.warn('Failed to cache API response:', cacheError);
        }
        return res;
      }

      if (res.status !== 429) {
        const body = await res.text();
        // Structured report to aid debugging
        reportApiError({
          service: 'pandascore',
          url: url.toString(),
          status: res.status,
          ok: res.ok,
          method: (options as any)?.method || 'GET',
          params: finalParams.toString(),
          message: `API error: ${res.status}`,
          bodySnippet: body?.slice(0, 500),
          tokenTail: key.slice(-4),
          timestamp: new Date().toISOString(),
          duration,
          retryCount,
        });
        throw new Error(`API error: ${res.status} - ${body}`);
      }

      lastError = new Error(`Rate limit hit with key ending in ${key.slice(-4)}`);
    } catch (err: unknown) {
      lastError = (err instanceof Error) ? err : new Error(String(err));
      const duration = Date.now() - startTime;
      retryCount++;

      // Network or other unexpected error
      reportApiError({
        service: 'pandascore',
        url: baseUrl,
        message: `Request failed: ${lastError.message}`,
        tokenTail: key ? key.slice(-4) : undefined,
        method: (options as any)?.method || 'GET',
        params: baseParams.toString(),
        timestamp: new Date().toISOString(),
        duration,
        retryCount,
      });
    }
  }

  throw lastError || new Error('All API keys failed');
}

// Función optimizada para obtener datos con cache automático
export const cachedPandaScoreFetch = cached(
  async (baseUrl: string, searchParams: URLSearchParams = new URLSearchParams()) => {
    const response = await pandaScoreFetch(baseUrl, searchParams);
    return await response.json();
  },
  {
    ttl: 10 * 60 * 1000, // 10 minutos
    priority: 'high',
    tags: ['api', 'pandascore'],
    keyGenerator: (baseUrl, searchParams) => `${baseUrl}_${searchParams?.toString() || ''}`,
  }
);

// Función para limpiar cache de API específico
export function clearApiCache(tags?: string[]) {
  const cache = getGlobalCache();
  if (tags) {
    tags.forEach(tag => cache.deleteByTag(tag));
  } else {
    cache.deleteByTag('api');
  }
}

// Función para precarga de datos críticos
export async function preloadCriticalData() {
  const cache = getGlobalCache();
  const criticalEndpoints = [
    'https://api.pandascore.co/matches/running',
    'https://api.pandascore.co/matches/upcoming',
  ];

  const preloadPromises = criticalEndpoints.map(async (endpoint) => {
    try {
      const response = await pandaScoreFetch(endpoint, new URLSearchParams(), {}, {
        ttl: 2 * 60 * 1000, // 2 minutos para datos críticos
        priority: 'critical',
        tags: ['critical', 'preload'],
      });
      return await response.json();
    } catch (error) {
      console.warn(`Failed to preload ${endpoint}:`, error);
      return null;
    }
  });

  await Promise.allSettled(preloadPromises);
}
