"use client";

import { useEffect, useState } from "react";

type IdleCallbackId = number;

export function useDeferredClientRender(delay = 200) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    const markReady = () => {
      if (!cancelled) {
        setIsReady(true);
      }
    };

    if ("requestIdleCallback" in window) {
      const idleId: IdleCallbackId = (window as any).requestIdleCallback(markReady, { timeout: Math.max(delay, 200) });
      return () => {
        cancelled = true;
        if ("cancelIdleCallback" in window) {
          (window as any).cancelIdleCallback(idleId);
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

