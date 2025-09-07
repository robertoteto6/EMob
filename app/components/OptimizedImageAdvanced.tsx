'use client';

import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  memo,
  forwardRef,
  ImgHTMLAttributes
} from 'react';
import NextImage from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

// Tipos para el componente de imagen optimizada
interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'loading'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty' | 'skeleton';
  blurDataURL?: string;
  fallback?: string;
  lazy?: boolean;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  sizes?: string;
  unoptimized?: boolean;
  progressive?: boolean;
  webp?: boolean;
  avif?: boolean;
}

// Hook para Intersection Observer optimizado
const useIntersectionObserver = ({
  threshold = 0.1,
  rootMargin = '50px',
  enabled = true
}: {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
} = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || hasIntersected) return;

    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          setHasIntersected(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, enabled, hasIntersected]);

  return { elementRef, isIntersecting: isIntersecting || hasIntersected };
};

// Componente de esqueleto para placeholder
const ImageSkeleton = memo<{ 
  width?: number; 
  height?: number; 
  aspectRatio?: string;
  className?: string;
}>(({ width, height, aspectRatio, className }) => {
  const style: React.CSSProperties = {};
  
  if (width) style.width = width;
  if (height) style.height = height;
  if (aspectRatio) style.aspectRatio = aspectRatio;

  return (
    <div 
      className={cn(
        'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700',
        'bg-[length:200%_100%] animate-shimmer',
        className
      )}
      style={style}
    >
      <div className="w-full h-full flex items-center justify-center">
        <svg 
          className="w-8 h-8 text-gray-400 dark:text-gray-500" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
    </div>
  );
});

ImageSkeleton.displayName = 'ImageSkeleton';

// Componente principal de imagen optimizada
const OptimizedImageAdvanced = memo(forwardRef<HTMLDivElement, OptimizedImageProps>((
  {
    src,
    alt,
    width,
    height,
    priority = false,
    quality = 75,
    placeholder = 'skeleton',
    blurDataURL,
    fallback,
    lazy = true,
    threshold = 0.1,
    rootMargin = '50px',
    onLoad,
    onError,
    className,
    containerClassName,
    aspectRatio,
    objectFit = 'cover',
    sizes,
    unoptimized = false,
    progressive = true,
    webp = true,
    avif = true,
    ...props
  }, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin,
    enabled: lazy && !priority
  });

  // Combinar refs
  const combinedRef = useCallback((node: HTMLDivElement) => {
    elementRef.current = node;
    if (ref) {
      if (typeof ref === 'function') {
        ref(node);
      } else {
        ref.current = node;
      }
    }
  }, [elementRef, ref]);

  // Generar URLs optimizadas
  const generateOptimizedSrc = useCallback((originalSrc: string, format?: string) => {
    if (unoptimized || originalSrc.startsWith('data:')) return originalSrc;
    
    const url = new URL(originalSrc, window.location.origin);
    const params = new URLSearchParams();
    
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality !== 75) params.set('q', quality.toString());
    if (format) params.set('f', format);
    if (progressive) params.set('progressive', 'true');
    
    return `${url.pathname}?${params.toString()}`;
  }, [width, height, quality, unoptimized, progressive]);

  // Detectar soporte de formatos modernos
  const [supportsAvif, setSupportsAvif] = useState(false);
  const [supportsWebp, setSupportsWebp] = useState(false);

  useEffect(() => {
    // Detectar soporte AVIF
    if (avif) {
      const avifImage = new Image();
      avifImage.onload = () => setSupportsAvif(true);
      avifImage.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    }

    // Detectar soporte WebP
    if (webp) {
      const webpImage = new Image();
      webpImage.onload = () => setSupportsWebp(true);
      webpImage.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    }
  }, [avif, webp]);

  // Determinar el mejor formato
  const getBestFormat = useCallback(() => {
    if (avif && supportsAvif) return 'avif';
    if (webp && supportsWebp) return 'webp';
    return undefined;
  }, [avif, supportsAvif, webp, supportsWebp]);

  // Manejar carga de imagen
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // Manejar error de imagen
  const handleError = useCallback(() => {
    setHasError(true);
    if (fallback && currentSrc !== fallback) {
      setCurrentSrc(fallback);
      setHasError(false);
    } else {
      onError?.();
    }
  }, [fallback, currentSrc, onError]);

  // Actualizar src cuando cambie la prop
  useEffect(() => {
    setCurrentSrc(src);
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  // Determinar si debe cargar la imagen
  const shouldLoad = priority || !lazy || isIntersecting;
  const optimizedSrc = generateOptimizedSrc(currentSrc, getBestFormat());

  // Estilos del contenedor
  const containerStyle: React.CSSProperties = {};
  if (aspectRatio) containerStyle.aspectRatio = aspectRatio;
  if (width && !aspectRatio) containerStyle.width = width;
  if (height && !aspectRatio) containerStyle.height = height;

  return (
    <div
      ref={combinedRef}
      className={cn(
        'relative overflow-hidden',
        containerClassName
      )}
      style={containerStyle}
    >
      <AnimatePresence mode="wait">
        {/* Placeholder */}
        {!shouldLoad || (!isLoaded && !hasError) ? (
          <motion.div
            key="placeholder"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {placeholder === 'skeleton' ? (
              <ImageSkeleton 
                width={width} 
                height={height} 
                aspectRatio={aspectRatio}
                className="w-full h-full"
              />
            ) : placeholder === 'blur' && blurDataURL ? (
              <NextImage
                src={blurDataURL}
                alt=""
                fill
                className="object-cover filter blur-sm scale-110"
                unoptimized
              />
            ) : null}
          </motion.div>
        ) : null}

        {/* Imagen principal */}
        {shouldLoad && (
          <motion.div
            key="image"
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {unoptimized ? (
              <NextImage
                src={optimizedSrc}
                alt={alt}
                fill
                quality={quality}
                sizes={sizes}
                priority={priority}
                onLoad={handleLoad}
                onError={handleError}
                className={cn(
                  'transition-opacity duration-300',
                  `object-${objectFit}`,
                  className
                )}
                {...props}
              />
            ) : (
              <NextImage
                src={optimizedSrc}
                alt={alt}
                fill
                quality={quality}
                priority={priority}
                sizes={sizes}
                onLoad={handleLoad}
                onError={handleError}
                className={cn(
                  'transition-opacity duration-300',
                  `object-${objectFit}`,
                  className
                )}
                {...props}
              />
            )}
          </motion.div>
        )}

        {/* Estado de error */}
        {hasError && !fallback && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
          >
            <div className="text-center text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path 
                  fillRule="evenodd" 
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                  clipRule="evenodd" 
                />
              </svg>
              <p className="text-sm">Error al cargar imagen</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}));

OptimizedImageAdvanced.displayName = 'OptimizedImageAdvanced';

// Componente para galería de imágenes optimizada
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  columns?: number;
  gap?: number;
  aspectRatio?: string;
  onImageClick?: (index: number) => void;
  className?: string;
}

export const OptimizedImageGallery = memo<ImageGalleryProps>(({ 
  images, 
  columns = 3, 
  gap = 16, 
  aspectRatio = '1/1',
  onImageClick,
  className 
}) => {
  return (
    <div 
      className={cn(
        'grid auto-rows-fr',
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`
      }}
    >
      {images.map((image, index) => (
        <motion.div
          key={index}
          className="cursor-pointer group"
          onClick={() => onImageClick?.(index)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <OptimizedImageAdvanced
            src={image.src}
            alt={image.alt}
            aspectRatio={aspectRatio}
            className="group-hover:brightness-110 transition-all duration-300"
            containerClassName="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
          />
          {image.caption && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
              {image.caption}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
});

OptimizedImageGallery.displayName = 'OptimizedImageGallery';

// Hook para precargar imágenes
export const useImagePreloader = () => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (loadedImages.has(src)) {
        resolve();
        return;
      }

      if (loadingImages.has(src)) {
        // Ya se está cargando, esperar
        const checkLoaded = () => {
          if (loadedImages.has(src)) {
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      setLoadingImages(prev => new Set(prev).add(src));

      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(src));
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        resolve();
      };
      img.onerror = () => {
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        reject(new Error(`Failed to load image: ${src}`));
      };
      img.src = src;
    });
  }, [loadedImages, loadingImages]);

  const preloadImages = useCallback(async (sources: string[]) => {
    const promises = sources.map(src => preloadImage(src));
    await Promise.allSettled(promises);
  }, [preloadImage]);

  return {
    preloadImage,
    preloadImages,
    isLoaded: (src: string) => loadedImages.has(src),
    isLoading: (src: string) => loadingImages.has(src)
  };
};

export default OptimizedImageAdvanced;
export { ImageSkeleton };