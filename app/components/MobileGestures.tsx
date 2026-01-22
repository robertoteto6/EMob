"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { usePullToRefresh, useScrollIndicator } from '../hooks/usePullToRefresh';
import { Spinner } from './LoadingOptimized';

// Componente de indicador de scroll
export function ScrollIndicator() {
  const { scrollProgress, isVisible, scrollToTop } = useScrollIndicator();

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-20 right-4 z-40 w-12 h-12 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all duration-300 shadow-lg touch-target"
      aria-label="Volver arriba"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>

      {/* Indicador de progreso circular */}
      <svg className="absolute inset-0 w-12 h-12 -rotate-90" viewBox="0 0 36 36">
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={`${scrollProgress}, 100`}
          className="text-white/30"
        />
      </svg>
    </button>
  );
}

// Componente de pull-to-refresh visual
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

  if (!isRefreshing && pullDistance === 0) return null;

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
      <div className={`flex items-center gap-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 transition-all duration-300 ${
        isRefreshing ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        {isRefreshing ? (
          <>
            <Spinner size="sm" color="primary" />
            <span className="text-sm text-white font-medium">Actualizando...</span>
          </>
        ) : (
          <>
            <div className={`w-5 h-5 rounded-full border-2 border-white/30 flex items-center justify-center transition-all duration-300 ${
              canRefresh ? 'border-emerald-400' : ''
            }`}>
              <svg
                className={`w-3 h-3 transition-transform duration-300 ${
                  canRefresh ? 'rotate-180 text-emerald-400' : 'text-white/50'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <span className={`text-sm font-medium transition-colors duration-300 ${
              canRefresh ? 'text-emerald-400' : 'text-white/50'
            }`}>
              {canRefresh ? 'Suelta para actualizar' : 'Tira para actualizar'}
            </span>
          </>
        )}
      </div>

      {/* Indicador de progreso visual */}
      {!isRefreshing && pullDistance > 0 && (
        <div className="mt-2 w-24 h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-200 rounded-full ${
              canRefresh ? 'bg-emerald-400' : 'bg-white/50'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Hook personalizado para pull-to-refresh en la página principal
export function usePagePullToRefresh(onRefresh?: () => Promise<void> | void) {
  const defaultRefresh = async () => {
    // Simular refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Aquí se podría recargar datos específicos
    window.location.reload();
  };

  return usePullToRefresh({
    onRefresh: onRefresh || defaultRefresh,
    threshold: 80,
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
  onRefresh,
  enablePullToRefresh = true,
  enableScrollIndicator = true,
}: MobileGestureWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {enableScrollIndicator && <ScrollIndicator />}
    </>
  );
}

// Hook para smooth scroll mejorado en móvil
export function useSmoothScroll() {
  const scrollToElement = useCallback((elementId: string, offset = 0) => {
    const element = document.getElementById(elementId);
    if (element) {
      const elementTop = element.getBoundingClientRect().top + window.scrollY;
      const targetPosition = elementTop - offset;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    }
  }, []);

  const scrollToTop = useCallback((smooth = true) => {
    if (smooth) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  return { scrollToElement, scrollToTop };
}
