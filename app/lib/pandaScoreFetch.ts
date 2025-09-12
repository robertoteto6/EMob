// Solo importar proxy agent en el servidor; evitar fallos en Edge/Browser
let getProxyAgent: (() => any) | undefined;
if (typeof window === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // En Edge `require` no existe; capturamos el ReferenceError
    // para evitar fallos y seguimos sin proxy.
    // @ts-expect-error require puede no existir en Edge
    const mod = require('./proxyAgent');
    getProxyAgent = mod?.getProxyAgent;
  } catch {
    getProxyAgent = undefined;
  }
}
// In server context, prefer the server cache implementation
import { getGlobalCache, cached } from './advancedCache.server';

export async function pandaScoreFetch(
  baseUrl: string,
  searchParams: URLSearchParams = new URLSearchParams(),
  options: RequestInit = {},
  cacheOptions?: { ttl?: number; priority?: 'low' | 'medium' | 'high' | 'critical'; tags?: string[] }
) {
  const cache = getGlobalCache();
  
  // Generar clave de cache
  const cacheKey = `api_${baseUrl}_${searchParams.toString()}`;
  
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
    throw new Error('Missing PandaScore API keys in environment variables');
  }

  let lastError: Error | null = null;

  for (const key of keys) {
    const url = new URL(baseUrl);
    searchParams.set('token', key);
    url.search = searchParams.toString();

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

      if (res.ok) {
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
        throw new Error(`API error: ${res.status} - ${await res.text()}`);
      }

      lastError = new Error(`Rate limit hit with key ending in ${key.slice(-4)}`);
    } catch (err: unknown) {
      lastError = (err instanceof Error) ? err : new Error(String(err));
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
