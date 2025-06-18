import { HttpsProxyAgent } from "https-proxy-agent";
import type { Agent } from "https";

export function getProxyAgent(): Agent | undefined {
  const proxyUrl =
    process.env.https_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.http_proxy ||
    process.env.HTTP_PROXY;
  return proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
}
