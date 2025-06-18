import type { Agent } from "https";

// Lazily require "https-proxy-agent" so that it is only loaded in a Node
// environment. This prevents bundlers from trying to include it in the
// browser bundle where the module is not available.

export function getProxyAgent(): Agent | undefined {
  const proxyUrl =
    process.env.https_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.http_proxy ||
    process.env.HTTP_PROXY;
  if (!proxyUrl) {
    return undefined;
  }
  // Dynamically import the agent implementation only when needed.
  const { HttpsProxyAgent } = require("https-proxy-agent");
  return new HttpsProxyAgent(proxyUrl);
}
