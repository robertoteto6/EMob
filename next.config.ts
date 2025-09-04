import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimización de rendimiento
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
    styledComponents: true,
  },
  
  // Optimización de bundle
  poweredByHeader: false,
  
  // Optimización de imágenes avanzada
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24 horas
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['cdn.pandascore.co', 'static.pandascore.co', 'images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.pandascore.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.pandascore.co',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: false,
  },
  
  // Headers de seguridad y performance mejorados
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.pandascore.co https://vercel.live; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;",
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
         source: '/:path*\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)',
         headers: [
           {
             key: 'Cache-Control',
             value: 'public, max-age=31536000, immutable',
           },
         ],
       },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
  
  // Compresión
  compress: true,
  
  // Optimización experimental
  experimental: {
    optimizeCss: true,
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
