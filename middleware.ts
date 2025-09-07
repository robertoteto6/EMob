import { NextRequest, NextResponse } from 'next/server';
import { getSecurityMiddleware } from './app/lib/securityMiddleware';

// Configuración del middleware de seguridad
const securityMiddleware = getSecurityMiddleware({
  enableCSRF: true,
  enableRateLimit: true,
  // Nota: No es posible leer/modificar el body en Middleware Edge.
  // Realiza la validación de input dentro de los handlers de API.
  enableInputValidation: false,
  maxRequestSize: 2 * 1024 * 1024, // 2MB
  allowedOrigins: [
    'http://localhost:3000',
    'https://emob.vercel.app',
    'https://*.vercel.app',
  ],
  rateLimitWindow: 15 * 60 * 1000, // 15 minutos
  rateLimitMax: 100, // 100 requests por ventana
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Aplicar middleware de seguridad solo a rutas de API
  if (pathname.startsWith('/api/')) {
    const securityResponse = await securityMiddleware.handle(request);
    if (securityResponse) {
      return securityResponse;
    }
  }

  // Headers de seguridad para todas las rutas
  const response = NextResponse.next();
  
  // Headers de seguridad básicos
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  
  // HSTS para producción
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // CSP básico
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.pandascore.co https://vercel.live https://vitals.vercel-insights.com",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // Cache headers optimizados
  if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  } else {
    response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  }
  
  return response;
}

// Configurar qué rutas deben pasar por el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};