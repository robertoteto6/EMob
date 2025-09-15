"use client";

import { useEffect, useState } from "react";

type IdleWindow = typeof window & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function useDeferredClientRender(delay = 200) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;
    const idleWindow = window as IdleWindow;

    const markReady = () => {
      if (!cancelled) {
        setIsReady(true);
      }
    };

    if (idleWindow.requestIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(markReady, { timeout: Math.max(delay, 200) });
      return () => {
        cancelled = true;
        if (idleWindow.cancelIdleCallback) {
          idleWindow.cancelIdleCallback(idleId);
        }
      };
    }

    const timer = window.setTimeout(markReady, delay);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [delay]);

  return isReady;
}
