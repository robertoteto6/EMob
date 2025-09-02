import { getProxyAgent } from './proxyAgent';

export async function pandaScoreFetch(
  baseUrl: string,
  searchParams: URLSearchParams = new URLSearchParams(),
  options: RequestInit = {}
) {
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
      const res = await fetch(url.toString(), {
        ...(options as RequestInit),
        dispatcher: getProxyAgent(),
      } as any);

      if (res.ok) {
        return res;
      }

      if (res.status !== 429) {
        throw new Error(`API error: ${res.status} - ${await res.text()}`);
      }

      lastError = new Error(`Rate limit hit with key ending in ${key.slice(-4)}`);
    } catch (err) {
      lastError = err as Error;
    }
  }

  throw lastError || new Error('All API keys failed');
}
