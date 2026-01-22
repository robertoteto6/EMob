"use client";

import { useRef, useCallback, useEffect, useState } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  disabled?: boolean;
}

interface PullToRefreshState {
  isRefreshing: boolean;
  pullDistance: number;
  canRefresh: boolean;
}

const touchListenerOptions: AddEventListenerOptions = { passive: false };

export function usePullToRefresh(options: PullToRefreshOptions) {
  const { onRefresh, threshold = 80, disabled = false } = options;

  const [state, setState] = useState<PullToRefreshState>({
    isRefreshing: false,
    pullDistance: 0,
    canRefresh: false,
  });

  const startYRef = useRef<number | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const isPullingRef = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || state.isRefreshing) return;

    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    isPullingRef.current = false;
  }, [disabled, state.isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || state.isRefreshing || !startYRef.current) return;

    const touch = e.touches[0];
    const currentY = touch.clientY;
    const deltaY = currentY - startYRef.current;

    // Solo permitir pull down desde el top
    if (deltaY > 0 && window.scrollY <= 0) {
      e.preventDefault();
      isPullingRef.current = true;

      const pullDistance = Math.min(deltaY * 0.5, threshold * 2); // Dampening effect
      const canRefresh = pullDistance >= threshold;

      setState(prev => ({
        ...prev,
        pullDistance,
        canRefresh,
      }));
    }
  }, [disabled, state.isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;

    const { canRefresh } = state;

    if (canRefresh) {
      setState(prev => ({ ...prev, isRefreshing: true, pullDistance: 0 }));

      try {
        await onRefresh();
      } finally {
        setState(prev => ({ ...prev, isRefreshing: false, canRefresh: false }));
      }
    } else {
      setState(prev => ({ ...prev, pullDistance: 0, canRefresh: false }));
    }

    startYRef.current = null;
    isPullingRef.current = false;
  }, [state.canRefresh, onRefresh]);

  const setRef = useCallback((element: HTMLElement | null) => {
    if (elementRef.current) {
      elementRef.current.removeEventListener('touchstart', handleTouchStart, touchListenerOptions);
      elementRef.current.removeEventListener('touchmove', handleTouchMove, touchListenerOptions);
      elementRef.current.removeEventListener('touchend', handleTouchEnd, touchListenerOptions);
    }

    elementRef.current = element;

    if (element) {
      element.addEventListener('touchstart', handleTouchStart, touchListenerOptions);
      element.addEventListener('touchmove', handleTouchMove, touchListenerOptions);
      element.addEventListener('touchend', handleTouchEnd, touchListenerOptions);
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    return () => {
      if (elementRef.current) {
        elementRef.current.removeEventListener('touchstart', handleTouchStart);
        elementRef.current.removeEventListener('touchmove', handleTouchMove);
        elementRef.current.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    ...state,
    setRef,
  };
}

// Hook para scroll indicators
export function useScrollIndicator() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0;

      setScrollProgress(progress);
      setIsVisible(scrolled > 100); // Show indicator after scrolling 100px
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return {
    scrollProgress,
    isVisible,
    scrollToTop,
  };
}
