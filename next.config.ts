import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para Turbopack (Next.js 16 usa Turbopack por defecto)
  turbopack: {},
  // Optimización de rendimiento
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Optimización de bundle
  poweredByHeader: false,

  // Optimización de imágenes avanzada
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24 horas
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.pandascore.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn-api.pandascore.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.pandascore.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: false,
    localPatterns: [
      {
        pathname: '/**',
        search: '',
      },
      {
        pathname: '/api/esports/**',
      },
    ],
  },

  // Headers de seguridad y performance mejorados
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';

    // En desarrollo relajamos el CSP para evitar bloquear estilos/HMR
    const cspDev = [
      "default-src 'self'",
      // Permitir inline y eval para React Refresh/Turbopack
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://vercel.live https://va.vercel-scripts.com",
      // Asegurar que las hojas de estilo de Next/Tailwind carguen
      "style-src 'self' 'unsafe-inline' blob: https://fonts.googleapis.com",
      // Algunos navegadores honran style-src-elem si está presente
      "style-src-elem 'self' 'unsafe-inline' blob: https://fonts.googleapis.com",
      // Imágenes locales/remotas y data/blob
      "img-src 'self' data: https: blob:",
      // Cargar fuentes locales y gstatic
      "font-src 'self' data: https://fonts.gstatic.com https://r2cdn.perplexity.ai",
      // HMR/WebSocket + APIs externas necesarias
      "connect-src 'self' http: https: ws: wss: https://api.pandascore.co https://vercel.live",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      // Permitir iframes de Twitch y YouTube
      "frame-src 'self' https://player.twitch.tv https://www.youtube.com https://youtube.com",
    ].join('; ');

    const cspProd = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com https://r2cdn.perplexity.ai",
      "connect-src 'self' https://api.pandascore.co https://vercel.live",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "frame-src 'self' https://player.twitch.tv https://www.youtube.com https://youtube.com",
      'upgrade-insecure-requests',
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: isDev ? cspDev : cspProd },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
        ],
      },
    ];
  },

  // Compresión
  compress: true,

  // Optimización experimental
  experimental: {
    optimizePackageImports: ['react', 'react-dom', 'framer-motion'],
    webpackBuildWorker: true,
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
  },

  // Configuración de webpack para optimización
  webpack: (config, { dev, isServer }) => {
    // Optimizaciones de producción
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
