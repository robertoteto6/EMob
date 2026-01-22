"use client";

import { useRef, useCallback, useEffect } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventScrollOnSwipe?: boolean;
}

interface TouchPosition {
  x: number;
  y: number;
}

export function useSwipeGesture(options: SwipeGestureOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventScrollOnSwipe = false
  } = options;

  const touchStartRef = useRef<TouchPosition | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const touchEnd = {
      x: touch.clientX,
      y: touch.clientY
    };

    const deltaX = touchEnd.x - touchStartRef.current.x;
    const deltaY = touchEnd.y - touchStartRef.current.y;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determinar si es un swipe horizontal o vertical
    if (absDeltaX > absDeltaY) {
      // Swipe horizontal
      if (absDeltaX > threshold) {
        if (deltaX > 0 && onSwipeRight) {
          if (preventScrollOnSwipe) e.preventDefault();
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          if (preventScrollOnSwipe) e.preventDefault();
          onSwipeLeft();
        }
      }
    } else {
      // Swipe vertical
      if (absDeltaY > threshold) {
        if (deltaY > 0 && onSwipeDown) {
          if (preventScrollOnSwipe) e.preventDefault();
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          if (preventScrollOnSwipe) e.preventDefault();
          onSwipeUp();
        }
      }
    }

    touchStartRef.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, preventScrollOnSwipe]);

  const setRef = useCallback((element: HTMLElement | null) => {
    if (elementRef.current) {
      elementRef.current.removeEventListener('touchstart', handleTouchStart, { passive: false });
      elementRef.current.removeEventListener('touchend', handleTouchEnd, { passive: false });
    }

    elementRef.current = element;

    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: false });
      element.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
  }, [handleTouchStart, handleTouchEnd]);

  useEffect(() => {
    return () => {
      if (elementRef.current) {
        elementRef.current.removeEventListener('touchstart', handleTouchStart);
        elementRef.current.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleTouchStart, handleTouchEnd]);

  return setRef;
}

// Hook específico para cerrar menú móvil con swipe
export function useSwipeToClose(setIsOpen: (open: boolean) => void) {
  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => setIsOpen(false),
    threshold: 75,
    preventScrollOnSwipe: true
  });

  return swipeRef;
}