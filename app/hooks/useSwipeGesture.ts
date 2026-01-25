"use client";

import { useRef, useCallback, useEffect } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventScrollOnSwipe?: boolean;
  velocityThreshold?: number; // Umbral de velocidad para swipes rápidos
}

interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

export function useSwipeGesture(options: SwipeGestureOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventScrollOnSwipe = false,
    velocityThreshold = 0.3 // píxeles por milisegundo
  } = options;

  const touchStartRef = useRef<TouchPosition | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const isSwipingRef = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: performance.now()
      };
      isSwipingRef.current = false;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // Determinar si es un swipe horizontal significativo
    if (deltaX > deltaY && deltaX > 10) {
      isSwipingRef.current = true;
      if (preventScrollOnSwipe) {
        e.preventDefault();
      }
    }
  }, [preventScrollOnSwipe]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const touchEnd = {
      x: touch.clientX,
      y: touch.clientY,
      time: performance.now()
    };

    const deltaX = touchEnd.x - touchStartRef.current.x;
    const deltaY = touchEnd.y - touchStartRef.current.y;
    const deltaTime = touchEnd.time - touchStartRef.current.time;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Calcular velocidad del swipe
    const velocityX = absDeltaX / deltaTime;
    const velocityY = absDeltaY / deltaTime;

    // Determinar si es un swipe horizontal o vertical
    if (absDeltaX > absDeltaY) {
      // Swipe horizontal - considerar distancia O velocidad
      const isValidSwipe = absDeltaX > threshold || velocityX > velocityThreshold;
      
      if (isValidSwipe) {
        if (deltaX > 0 && onSwipeRight) {
          if (preventScrollOnSwipe) e.preventDefault();
          // Ejecutar callback en el siguiente frame para mejor rendimiento
          requestAnimationFrame(() => onSwipeRight());
        } else if (deltaX < 0 && onSwipeLeft) {
          if (preventScrollOnSwipe) e.preventDefault();
          requestAnimationFrame(() => onSwipeLeft());
        }
      }
    } else {
      // Swipe vertical - considerar distancia O velocidad
      const isValidSwipe = absDeltaY > threshold || velocityY > velocityThreshold;
      
      if (isValidSwipe) {
        if (deltaY > 0 && onSwipeDown) {
          if (preventScrollOnSwipe) e.preventDefault();
          requestAnimationFrame(() => onSwipeDown());
        } else if (deltaY < 0 && onSwipeUp) {
          if (preventScrollOnSwipe) e.preventDefault();
          requestAnimationFrame(() => onSwipeUp());
        }
      }
    }

    touchStartRef.current = null;
    isSwipingRef.current = false;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, preventScrollOnSwipe, velocityThreshold]);

  const setRef = useCallback((element: HTMLElement | null) => {
    if (elementRef.current) {
      elementRef.current.removeEventListener('touchstart', handleTouchStart);
      elementRef.current.removeEventListener('touchmove', handleTouchMove);
      elementRef.current.removeEventListener('touchend', handleTouchEnd);
    }

    elementRef.current = element;

    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchmove', handleTouchMove, { passive: !preventScrollOnSwipe });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventScrollOnSwipe]);

  useEffect(() => {
    return () => {
      if (elementRef.current) {
        elementRef.current.removeEventListener('touchstart', handleTouchStart);
        elementRef.current.removeEventListener('touchmove', handleTouchMove);
        elementRef.current.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return setRef;
}

// Hook específico para cerrar menú móvil con swipe - optimizado
export function useSwipeToClose(setIsOpen: (open: boolean) => void) {
  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => setIsOpen(false),
    onSwipeUp: () => setIsOpen(false), // También cerrar al swipe up
    threshold: 60, // Umbral más bajo para mejor respuesta
    velocityThreshold: 0.25,
    preventScrollOnSwipe: true
  });

  return swipeRef;
}

// Hook para swipe entre tabs/páginas
export function useSwipeNavigation(onPrev: () => void, onNext: () => void) {
  const swipeRef = useSwipeGesture({
    onSwipeLeft: onNext,
    onSwipeRight: onPrev,
    threshold: 80,
    velocityThreshold: 0.4,
    preventScrollOnSwipe: false
  });

  return swipeRef;
}
