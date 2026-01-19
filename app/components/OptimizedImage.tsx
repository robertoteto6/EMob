"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '../lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc = '/placeholder-image.svg',
  priority = false,
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  objectFit = 'cover',
  loading = 'lazy',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [_hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const maxRetries = 3;

  // Generar blur placeholder automáticamente si no se proporciona
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

  // Optimizar sizes automáticamente basado en el viewport
  const optimizedSizes = sizes || (
    width && height 
      ? `(max-width: 640px) ${Math.min(width, 640)}px, (max-width: 1024px) ${Math.min(width, 1024)}px, ${width}px`
      : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
  );

  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    if (retryCount < maxRetries && imageSrc !== fallbackSrc) {
      // Intentar recargar la imagen original
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageSrc(src + `?retry=${retryCount + 1}`);
      }, 1000 * (retryCount + 1)); // Backoff exponencial
    } else {
      setHasError(true);
      setIsLoading(false);
      setImageSrc(fallbackSrc);
      onError?.();
    }
  };

  const imageProps = {
    ref: imgRef,
    src: imageSrc,
    alt,
    quality,
    priority,
    loading,
    placeholder,
    blurDataURL: blurDataURL || defaultBlurDataURL,
    sizes: optimizedSizes,
    onLoad: handleLoad,
    onError: handleError,
    className: cn(
      'transition-opacity duration-300',
      isLoading && 'opacity-0',
      !isLoading && 'opacity-100',
      className
    ),
    style: {
      objectFit,
    },
  };

  if (fill) {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        <Image
          {...imageProps}
          fill
          className={cn(
            'transition-opacity duration-300',
            isLoading && 'opacity-0',
            !isLoading && 'opacity-100'
          )}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <Image
        {...imageProps}
        width={width}
        height={height}
      />
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width, height }}
        />
      )}
    </div>
  );
}

// Componente de imagen con lazy loading avanzado
export function LazyImage({
  src,
  alt,
  className,
  ...props
}: OptimizedImageProps) {
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={className}>
      {isInView ? (
        <OptimizedImage
          src={src}
          alt={alt}
          {...props}
        />
      ) : (
        <div className="bg-gray-200 animate-pulse rounded" style={{ width: props.width, height: props.height }} />
      )}
    </div>
  );
}

// Hook para precargar imágenes
export function useImagePreloader(urls: string[]) {
  useEffect(() => {
    const preloadImages = urls.map(url => {
      const img = new window.Image();
      img.src = url;
      return img;
    });

    return () => {
      preloadImages.forEach(img => {
        img.src = '';
      });
    };
  }, [urls]);
}

// Componente para avatar optimizado
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className,
  fallback,
}: {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
  fallback?: string;
}) {
  const [hasError, setHasError] = useState(false);
  
  if (!src || hasError) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-gray-600 text-white rounded-full text-sm font-medium',
          className
        )}
        style={{ width: size, height: size }}
      >
        {fallback || alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      onError={() => setHasError(true)}
      quality={90}
      priority={size > 64} // Priorizar avatares grandes
    />
  );
}