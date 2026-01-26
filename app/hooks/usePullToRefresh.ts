"use client";

import { useRef, useCallback, useEffect, useState } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  disabled?: boolean;
  dampingFactor?: number;
}

interface PullToRefreshState {
  isRefreshing: boolean;
  pullDistance: number;
  canRefresh: boolean;
}

export function usePullToRefresh(options: PullToRefreshOptions) {
  const { 
    onRefresh, 
    threshold = 70, 
    disabled = false,
    dampingFactor = 0.4 // Factor de amortiguación para efecto elástico
  } = options;

  const [state, setState] = useState<PullToRefreshState>({
    isRefreshing: false,
    pullDistance: 0,
    canRefresh: false,
  });

  const startYRef = useRef<number | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const isPullingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTouchYRef = useRef<number>(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || state.isRefreshing) return;
    
    // Solo activar si estamos en la parte superior de la página
    if (window.scrollY > 5) return;

    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    lastTouchYRef.current = touch.clientY;
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

      // Cancelar RAF anterior si existe
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      // Usar requestAnimationFrame para mejor rendimiento
      rafRef.current = requestAnimationFrame(() => {
        // Efecto de dampening mejorado con curva suave
        const rawDistance = deltaY * dampingFactor;
        const pullDistance = Math.min(rawDistance, threshold * 2.5);
        const canRefresh = pullDistance >= threshold;

        setState(prev => {
          // Solo actualizar si hay cambio significativo
          if (Math.abs(prev.pullDistance - pullDistance) < 1) {
            return prev;
          }
          return {
            ...prev,
            pullDistance,
            canRefresh,
          };
        });
      });
    }
    
    lastTouchYRef.current = currentY;
  }, [disabled, state.isRefreshing, threshold, dampingFactor]);

  const handleTouchEnd = useCallback(async () => {
    // Limpiar RAF pendiente
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!isPullingRef.current) return;

    const { canRefresh, pullDistance } = state;

    if (canRefresh && pullDistance >= threshold) {
      setState(prev => ({ ...prev, isRefreshing: true, pullDistance: 0 }));

      try {
        await onRefresh();
      } finally {
        // Pequeño delay para animación de salida
        await new Promise(resolve => setTimeout(resolve, 100));
        setState(prev => ({ ...prev, isRefreshing: false, canRefresh: false }));
      }
    } else {
      // Animación de retorno suave
      setState(prev => ({ ...prev, pullDistance: 0, canRefresh: false }));
    }

    startYRef.current = null;
    isPullingRef.current = false;
  }, [state.canRefresh, state.pullDistance, onRefresh, threshold]);

  const setRef = useCallback((element: HTMLElement | null) => {
    // Limpiar listeners anteriores
    if (elementRef.current) {
      elementRef.current.removeEventListener('touchstart', handleTouchStart);
      elementRef.current.removeEventListener('touchmove', handleTouchMove);
      elementRef.current.removeEventListener('touchend', handleTouchEnd);
    }

    elementRef.current = element;

    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchmove', handleTouchMove, { passive: false });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
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
    threshold,
  };
}

// Hook para scroll indicators optimizado
export function useScrollIndicator() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastScrollRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      // Cancelar RAF anterior
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        
        // Solo actualizar si hay cambio significativo (>5px)
        if (Math.abs(scrolled - lastScrollRef.current) < 5) {
          return;
        }
        
        lastScrollRef.current = scrolled;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? Math.min((scrolled / maxScroll) * 100, 100) : 0;

        setScrollProgress(progress);
        setIsVisible(scrolled > 150); // Show indicator after scrolling 150px
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const scrollToTop = useCallback(() => {
    // Usar scrollTo nativo con behavior smooth
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return {
    scrollProgress,
    isVisible,
    scrollToTop,
  };
}
