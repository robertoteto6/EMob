import type { Dispatcher } from "undici";

// Lazily import the proxy implementation only when running in Node.js to avoid
// bundling it for the browser.

export function getProxyAgent(): Dispatcher | undefined {
  // Solo ejecutar en el servidor
  if (typeof window !== 'undefined') {
    return undefined;
  }
  
  const proxyUrl =
    process.env.https_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.http_proxy ||
    process.env.HTTP_PROXY;
  if (!proxyUrl) {
    return undefined;
  }
  
  try {
    // Use require in Node context only; ESLint rule disabled at file level via override
     
    const undici = require("undici");
    return new undici.ProxyAgent(proxyUrl);
  } catch (error) {
    console.warn('Failed to create proxy agent:', error);
    return undefined;
  }
}
