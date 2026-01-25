"use client";

import { useEffect, useRef, useState } from "react";

interface AutoHideOptions {
  threshold?: number;
  idleDelay?: number;
  showAtTop?: boolean;
}

export function useAutoHideOnScroll({
  threshold = 160,
  idleDelay = 180,
  showAtTop = false,
}: AutoHideOptions = {}) {
  const [isVisible, setIsVisible] = useState(showAtTop);
  const lastScrollY = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;
      const scrollingDown = delta > 0;
      const canShow = showAtTop || currentY > threshold;

      lastScrollY.current = currentY;

      if (!canShow) {
        setIsVisible(false);
      } else if (!scrollingDown) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        const shouldShow = showAtTop || window.scrollY > threshold;
        setIsVisible(shouldShow);
      }, idleDelay);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [idleDelay, showAtTop, threshold]);

  return isVisible;
}
