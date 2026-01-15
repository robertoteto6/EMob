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

  return NextResponse.next();
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