'use client';

import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  memo, 
  Suspense,
  lazy,
  ComponentType
} from 'react';
import { cn } from '../lib/utils';
import NextImage from 'next/image';
import { Skeleton, Spinner } from './LoadingOptimized';

// Hook para Intersection Observer optimizado
interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

const useIntersectionObserver = ({
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true
}: UseIntersectionObserverOptions = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || (triggerOnce && hasIntersected)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (isVisible && triggerOnce) {
          setHasIntersected(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, hasIntersected]);

  return { elementRef, isIntersecting: isIntersecting || hasIntersected };
};

// Componente de imagen lazy optimizada
interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  blurDataURL?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage = memo<LazyImageProps>(({
  src,
  alt,
  width,
  height,
  className,
  placeholder,
  blurDataURL,
  priority = false,
  quality = 75,
  sizes,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(priority ? src : placeholder || '');
  const { elementRef, isIntersecting } = useIntersectionObserver({
    triggerOnce: true,
    rootMargin: '100px'
  });

  // Precargar imagen cuando sea visible
  useEffect(() => {
    if (!isIntersecting || priority || isLoaded) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      onLoad?.();
    };
    img.onerror = () => {
      setHasError(true);
      onError?.();
    };
    img.src = src;
  }, [isIntersecting, src, priority, isLoaded, onLoad, onError]);

  // Para imágenes prioritarias, cargar inmediatamente
  useEffect(() => {
    if (priority) {
      setImageSrc(src);
      setIsLoaded(true);
    }
  }, [priority, src]);

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  if (hasError) {
    return (
      <div 
        ref={elementRef as React.RefObject<HTMLDivElement>}
        className={cn(
          'flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
          className
        )}
        style={{ width, height }}
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={cn('relative overflow-hidden', className)}
      style={{ width, height }}
    >
      {/* Placeholder mientras carga */}
      {!isLoaded && (
        <div className="absolute inset-0">
          {blurDataURL ? (
            <NextImage
              src={blurDataURL}
              alt=""
              fill
              className="object-cover blur-sm scale-110"
              unoptimized
              priority
            />
          ) : (
            <Skeleton 
              variant="rectangular" 
              className="w-full h-full" 
            />
          )}
        </div>
      )}
      
      {/* Imagen principal */}
      {(isIntersecting || priority) && (
        <NextImage
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => handleImageLoad()}
          onError={() => handleImageError()}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

// Componente lazy para secciones
interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazySection = memo<LazySectionProps>(({ 
  children, 
  fallback, 
  className,
  threshold = 0.1,
  rootMargin = '100px'
}) => {
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true
  });

  return (
    <div ref={elementRef as React.RefObject<HTMLDivElement>} className={className}>
      {isIntersecting ? children : (fallback || <Skeleton variant="rectangular" height={200} />)}
    </div>
  );
});

LazySection.displayName = 'LazySection';

// HOC para lazy loading de componentes
interface LazyComponentOptions {
  fallback?: React.ComponentType;
  delay?: number;
  retryCount?: number;
}

export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentOptions = {}
) {
  const { 
    fallback: Fallback = () => <Spinner size="lg" />, 
    delay = 0,
    retryCount = 3
  } = options;

  const LazyComponent = lazy(() => {
    let retries = 0;
    
    const loadComponent = async (): Promise<{ default: ComponentType<P> }> => {
      try {
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        return await importFn();
      } catch (error) {
        if (retries < retryCount) {
          retries++;
          console.warn(`Retry ${retries}/${retryCount} loading component:`, error);
          return loadComponent();
        }
        throw error;
      }
    };
    
    return loadComponent();
  });

  return memo<P>((props) => (
    <Suspense fallback={<Fallback />}>
      <LazyComponent {...props} />
    </Suspense>
  ));
}

// Componente para lazy loading de listas
interface LazyListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
  className?: string;
  loadingComponent?: React.ComponentType;
}

export function LazyList<T>({
  items,
  renderItem,
  itemHeight = 100,
  containerHeight = 400,
  overscan = 5,
  className,
  loadingComponent: LoadingComponent = () => <Skeleton variant="rectangular" height={itemHeight} />
}: LazyListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
    items.length
  );
  const visibleItems = items.slice(Math.max(0, startIndex - overscan), endIndex);

  const totalHeight = items.length * itemHeight;
  const offsetY = Math.max(0, startIndex - overscan) * itemHeight;

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => {
            const actualIndex = Math.max(0, startIndex - overscan) + index;
            return (
              <div key={actualIndex} style={{ height: itemHeight }}>
                <Suspense fallback={<LoadingComponent />}>
                  {renderItem(item, actualIndex)}
                </Suspense>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Hook para precargar recursos
export const usePreloader = () => {
  const preloadedResources = useRef(new Set<string>());

  const preloadImage = useCallback((src: string): Promise<void> => {
    if (preloadedResources.current.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        preloadedResources.current.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const preloadImages = useCallback(async (sources: string[]) => {
    const promises = sources.map(src => preloadImage(src));
    return Promise.allSettled(promises);
  }, [preloadImage]);

  const preloadComponent = useCallback(async (
    importFn: () => Promise<unknown>
  ) => {
    try {
      await importFn();
    } catch (error) {
      console.warn('Failed to preload component:', error);
    }
  }, []);

  return {
    preloadImage,
    preloadImages,
    preloadComponent
  };
};

// Componente de carga progresiva
interface ProgressiveLoadProps {
  children: React.ReactNode;
  stages: React.ReactNode[];
  interval?: number;
  className?: string;
}

export const ProgressiveLoad = memo<ProgressiveLoadProps>(({ 
  children, 
  stages, 
  interval = 500,
  className 
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentStage >= stages.length) {
      setIsComplete(true);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStage(prev => prev + 1);
    }, interval);

    return () => clearTimeout(timer);
  }, [currentStage, stages.length, interval]);

  return (
    <div className={className}>
      {isComplete ? children : stages[currentStage] || stages[0]}
    </div>
  );
});

ProgressiveLoad.displayName = 'ProgressiveLoad';

export default LazyImage;