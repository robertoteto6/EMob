"use client";

import { useState, useCallback, useRef } from 'react';
import OptimizedImage from './OptimizedImage';

interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  enableProgressive?: boolean;
}

interface CompressedImageProps {
  src: string;
  alt: string;
  className?: string;
  compressionOptions?: ImageCompressionOptions;
  fallbackSrc?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

// Función para detectar soporte de formatos modernos
function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

function supportsAVIF(): Promise<boolean> {
  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2);
    };
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
}

// Cache para resultados de soporte de formatos
let webpSupport: boolean | null = null;
let avifSupport: boolean | null = null;

export default function CompressedImage({
  src,
  alt,
  className,
  compressionOptions = {},
  fallbackSrc,
  priority = false,
  onLoad,
  onError,
}: CompressedImageProps) {
  const [optimizedSrc, setOptimizedSrc] = useState<string>(src);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 85,
    format = 'webp',
    enableProgressive = true,
  } = compressionOptions;

  const processImage = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    try {
      // Verificar soporte de formatos si no se ha hecho antes
      if (webpSupport === null) {
        webpSupport = await supportsWebP();
      }
      if (avifSupport === null) {
        avifSupport = await supportsAVIF();
      }

      // Determinar el mejor formato soportado
      let targetFormat = format;
      if (avifSupport && format === 'webp') {
        targetFormat = 'avif';
      } else if (!webpSupport && format === 'webp') {
        targetFormat = 'jpeg';
      }

      // Construir URL optimizada (asumiendo un servicio de optimización)
      const params = new URLSearchParams({
        w: maxWidth.toString(),
        h: maxHeight.toString(),
        q: quality.toString(),
        f: targetFormat,
        auto: 'format,compress',
        ...(enableProgressive && { progressive: 'true' }),
      });

      // Si la imagen es de un CDN conocido, usar sus parámetros
      if (src.includes('pandascore.co')) {
        setOptimizedSrc(`${src}?${params.toString()}`);
      } else {
        // Para otras imágenes, usar el servicio de Next.js
        setOptimizedSrc(src);
      }
    } catch (error) {
      console.warn('Error optimizing image:', error);
      setOptimizedSrc(src);
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [src, maxWidth, maxHeight, quality, format, enableProgressive]);

  // Procesar imagen al montar el componente
  useState(() => {
    processImage();
  });

  const handleLoad = useCallback(() => {
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    // Si falla la imagen optimizada, intentar con la original
    if (optimizedSrc !== src) {
      setOptimizedSrc(src);
    } else {
      onError?.();
    }
  }, [optimizedSrc, src, onError]);

  return (
    <OptimizedImage
      src={optimizedSrc}
      alt={alt}
      className={className}
      fallbackSrc={fallbackSrc}
      priority={priority}
      quality={quality}
      placeholder="blur"
      loading={priority ? 'eager' : 'lazy'}
      onLoad={handleLoad}
      onError={handleError}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  );
}

// Hook para precargar imágenes críticas
export function useImagePreloader(urls: string[], options?: ImageCompressionOptions) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const preloadImages = useCallback(async () => {
    setIsLoading(true);
    const promises = urls.map(async (url) => {
      try {
        const img = new Image();
        img.src = url;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        setLoadedImages(prev => new Set([...prev, url]));
      } catch (error) {
        console.warn(`Failed to preload image: ${url}`, error);
      }
    });

    await Promise.allSettled(promises);
    setIsLoading(false);
  }, [urls]);

  return {
    preloadImages,
    loadedImages,
    isLoading,
    isImageLoaded: (url: string) => loadedImages.has(url),
  };
}

// Componente para galería de imágenes optimizada
interface OptimizedGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  className?: string;
  itemClassName?: string;
  compressionOptions?: ImageCompressionOptions;
}

export function OptimizedGallery({
  images,
  className,
  itemClassName,
  compressionOptions,
}: OptimizedGalleryProps) {
  const { preloadImages, isImageLoaded } = useImagePreloader(
    images.slice(0, 3).map(img => img.src), // Precargar las primeras 3 imágenes
    compressionOptions
  );

  useState(() => {
    preloadImages();
  });

  return (
    <div className={className}>
      {images.map((image, index) => (
        <div key={image.src} className={itemClassName}>
          <CompressedImage
            src={image.src}
            alt={image.alt}
            priority={index < 2} // Priorizar las primeras 2 imágenes
            compressionOptions={compressionOptions}
          />
          {image.caption && (
            <p className="mt-2 text-sm text-gray-600">{image.caption}</p>
          )}
        </div>
      ))}
    </div>
  );
}