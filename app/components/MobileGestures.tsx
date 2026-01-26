"use client";

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { usePullToRefresh, useScrollIndicator } from '../hooks/usePullToRefresh';
import { Spinner } from './LoadingOptimized';

// Componente de indicador de scroll optimizado para móvil
export function ScrollIndicator() {
  const { scrollProgress, isVisible, scrollToTop: _scrollToTop } = useScrollIndicator();
  const [isAnimating, setIsAnimating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Efecto de aparición suave
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleScrollToTop = useCallback(() => {
    setIsAnimating(true);
    
    // Smooth scroll con easing mejorado para móvil
    const startPosition = window.scrollY;
    const startTime = performance.now();
    const duration = Math.min(800, Math.max(400, startPosition / 3));
    
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    
    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      
      window.scrollTo(0, startPosition * (1 - eased));
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        setIsAnimating(false);
      }
    };
    
    requestAnimationFrame(animateScroll);
  }, []);

  if (!shouldRender) return null;

  return (
    <button
      ref={buttonRef}
      onClick={handleScrollToTop}
      className={`fixed bottom-20 right-4 z-40 w-14 h-14 bg-black/90 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white/80 hover:text-white shadow-lg shadow-black/30 touch-target gpu-accelerated mobile-transition ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
      } ${isAnimating ? 'scale-95' : ''}`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label="Volver arriba"
    >
      <svg 
        className={`w-5 h-5 transition-transform duration-200 ${isAnimating ? '-translate-y-0.5' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>

      {/* Indicador de progreso circular con animación suave */}
      <svg className="absolute inset-0 w-14 h-14 -rotate-90" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-white/10"
        />
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={`${scrollProgress}, 100`}
          strokeLinecap="round"
          className="text-white/50 transition-all duration-150"
          style={{
            transition: 'stroke-dasharray 0.15s ease-out'
          }}
        />
      </svg>
    </button>
  );
}

// Componente de pull-to-refresh visual optimizado para móvil
interface PullToRefreshIndicatorProps {
  isRefreshing: boolean;
  pullDistance: number;
  canRefresh: boolean;
  threshold: number;
}

export function PullToRefreshIndicator({
  isRefreshing,
  pullDistance,
  canRefresh,
  threshold
}: PullToRefreshIndicatorProps) {
  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const rotation = (progress / 100) * 180; // Rotar el icono basado en el progreso

  // Efecto de elasticidad
  const elasticDistance = pullDistance > threshold 
    ? threshold + (pullDistance - threshold) * 0.3 
    : pullDistance;

  if (!isRefreshing && pullDistance === 0) return null;

  return (
    <div 
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none gpu-accelerated"
      style={{
        transform: `translateX(-50%) translateY(${Math.min(elasticDistance * 0.5, 40)}px)`,
        transition: pullDistance === 0 ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
      }}
    >
      <div className={`flex items-center gap-3 bg-black/90 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2.5 shadow-lg shadow-black/30 mobile-transition ${
        isRefreshing || pullDistance > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        {isRefreshing ? (
          <>
            <Spinner size="sm" color="primary" />
            <span className="text-sm text-white font-medium">Actualizando...</span>
          </>
        ) : (
          <>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
              canRefresh ? 'border-emerald-400 bg-emerald-400/10' : 'border-white/30'
            }`}>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  canRefresh ? 'text-emerald-400' : 'text-white/50'
                }`}
                style={{ transform: `rotate(${rotation}deg)` }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <span className={`text-sm font-medium transition-colors duration-150 ${
              canRefresh ? 'text-emerald-400' : 'text-white/60'
            }`}>
              {canRefresh ? 'Suelta para actualizar' : 'Tira para actualizar'}
            </span>
          </>
        )}
      </div>

      {/* Indicador de progreso visual con animación suave */}
      {!isRefreshing && pullDistance > 0 && (
        <div className="mt-2 mx-auto w-20 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-100 ${
              canRefresh ? 'bg-emerald-400' : 'bg-white/40'
            }`}
            style={{ 
              width: `${progress}%`,
              transition: 'width 0.1s ease-out'
            }}
          />
        </div>
      )}
    </div>
  );
}

// Hook personalizado para pull-to-refresh en la página principal
export function usePagePullToRefresh(onRefresh?: () => Promise<void> | void) {
  const defaultRefresh = async () => {
    // Simular refresh con feedback visual
    await new Promise(resolve => setTimeout(resolve, 1200));
    // Recargar datos específicos
    window.location.reload();
  };

  return usePullToRefresh({
    onRefresh: onRefresh || defaultRefresh,
    threshold: 70, // Umbral más bajo para mejor respuesta
  });
}

// Componente wrapper para páginas con gestos móviles
interface MobileGestureWrapperProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void> | void;
  enablePullToRefresh?: boolean;
  enableScrollIndicator?: boolean;
}

export function MobileGestureWrapper({
  children,
  onRefresh: _onRefresh,
  enablePullToRefresh: _enablePullToRefresh = true,
  enableScrollIndicator = true,
}: MobileGestureWrapperProps) {
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Detectar si es dispositivo móvil
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isTouchDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <div className={isMobile ? 'mobile-scroll-y' : ''}>
      {children}
      {enableScrollIndicator && <ScrollIndicator />}
    </div>
  );
}

// Hook para smooth scroll mejorado en móvil con easing nativo
export function useSmoothScroll() {
  const isScrollingRef = useRef(false);
  
  const scrollToElement = useCallback((elementId: string, offset = 0) => {
    if (isScrollingRef.current) return;
    
    const element = document.getElementById(elementId);
    if (element) {
      isScrollingRef.current = true;
      const elementTop = element.getBoundingClientRect().top + window.scrollY;
      const targetPosition = elementTop - offset;
      const startPosition = window.scrollY;
      const distance = targetPosition - startPosition;
      const duration = Math.min(600, Math.max(300, Math.abs(distance) / 3));
      const startTime = performance.now();
      
      // Easing function suave para móvil
      const easeInOutCubic = (t: number) => 
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);
        
        window.scrollTo(0, startPosition + distance * eased);
        
        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        } else {
          isScrollingRef.current = false;
        }
      };
      
      requestAnimationFrame(animateScroll);
    }
  }, []);

  const scrollToTop = useCallback((smooth = true) => {
    if (isScrollingRef.current) return;
    
    if (!smooth) {
      window.scrollTo(0, 0);
      return;
    }
    
    isScrollingRef.current = true;
    const startPosition = window.scrollY;
    const duration = Math.min(600, Math.max(300, startPosition / 3));
    const startTime = performance.now();
    
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    
    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      
      window.scrollTo(0, startPosition * (1 - eased));
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        isScrollingRef.current = false;
      }
    };
    
    requestAnimationFrame(animateScroll);
  }, []);

  // Scroll horizontal suave para carousels
  const scrollHorizontal = useCallback((container: HTMLElement, direction: 'left' | 'right', amount?: number) => {
    const scrollAmount = amount || container.clientWidth * 0.8;
    const targetScroll = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount;
    
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  }, []);

  return { scrollToElement, scrollToTop, scrollHorizontal };
}

// Hook para detectar dirección de scroll (útil para ocultar/mostrar elementos)
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const threshold = 10;
      
      setIsAtTop(scrollY < 50);
      
      if (Math.abs(scrollY - lastScrollY.current) < threshold) {
        ticking.current = false;
        return;
      }
      
      setScrollDirection(scrollY > lastScrollY.current ? 'down' : 'up');
      lastScrollY.current = scrollY > 0 ? scrollY : 0;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { scrollDirection, isAtTop };
}
