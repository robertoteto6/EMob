import type { Dispatcher } from "undici";
import { createRequire } from "node:module";

// Lazily import the proxy implementation only when running in Node.js to avoid
// bundling it for the browser.

export function getProxyAgent(): Dispatcher | undefined {
  const proxyUrl =
    process.env.https_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.http_proxy ||
    process.env.HTTP_PROXY;
  if (!proxyUrl) {
    return undefined;
  }
  // Dynamically import the agent implementation only when needed.
  const require = createRequire(import.meta.url);
  const { ProxyAgent } = require("undici") as typeof import("undici");
  return new ProxyAgent(proxyUrl);
}
