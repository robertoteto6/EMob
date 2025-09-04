'use client';

import { NextRequest, NextResponse } from 'next/server';
import { SecurityValidator, generateCSRFToken, validateCSRFToken } from './security';

// Tipos para el middleware de seguridad
interface SecurityConfig {
  enableCSRF?: boolean;
  enableRateLimit?: boolean;
  enableInputValidation?: boolean;
  maxRequestSize?: number;
  allowedOrigins?: string[];
  rateLimitWindow?: number; // en milisegundos
  rateLimitMax?: number; // máximo de requests por ventana
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Almacén en memoria para rate limiting (en producción usar Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clase principal del middleware de seguridad
export class SecurityMiddleware {
  private config: SecurityConfig;
  private validator: SecurityValidator;

  constructor(config: SecurityConfig = {}) {
    this.config = {
      enableCSRF: true,
      enableRateLimit: true,
      enableInputValidation: true,
      maxRequestSize: 1024 * 1024, // 1MB
      allowedOrigins: ['http://localhost:3000', 'https://emob.vercel.app'],
      rateLimitWindow: 15 * 60 * 1000, // 15 minutos
      rateLimitMax: 100, // 100 requests por ventana
      ...config,
    };
    this.validator = SecurityValidator.getInstance();
  }

  // Middleware principal
  public async handle(request: NextRequest): Promise<NextResponse | null> {
    try {
      // 1. Validar CORS
      const corsResponse = this.handleCORS(request);
      if (corsResponse) return corsResponse;

      // 2. Rate limiting
      if (this.config.enableRateLimit) {
        const rateLimitResponse = this.handleRateLimit(request);
        if (rateLimitResponse) return rateLimitResponse;
      }

      // 3. Validar tamaño de request
      const sizeValidation = await this.validateRequestSize(request);
      if (sizeValidation) return sizeValidation;

      // 4. Validar CSRF para métodos que modifican datos
      if (this.config.enableCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const csrfResponse = await this.handleCSRF(request);
        if (csrfResponse) return csrfResponse;
      }

      // 5. Validar y sanitizar input
      if (this.config.enableInputValidation) {
        const inputValidation = await this.validateInput(request);
        if (inputValidation) return inputValidation;
      }

      // 6. Agregar headers de seguridad
      return this.addSecurityHeaders(request);

    } catch (error) {
      console.error('Security middleware error:', error);
      return new NextResponse('Internal Security Error', { status: 500 });
    }
  }

  // Manejar CORS
  private handleCORS(request: NextRequest): NextResponse | null {
    const origin = request.headers.get('origin');
    
    // Para requests preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': this.isAllowedOrigin(origin) ? origin! : 'null',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Validar origen para requests normales
    if (origin && !this.isAllowedOrigin(origin)) {
      return new NextResponse('CORS: Origin not allowed', { status: 403 });
    }

    return null;
  }

  // Verificar si el origen está permitido
  private isAllowedOrigin(origin: string | null): boolean {
    if (!origin) return true; // Requests sin origen (ej: Postman)
    return this.config.allowedOrigins!.includes(origin);
  }

  // Manejar rate limiting
  private handleRateLimit(request: NextRequest): NextResponse | null {
    const clientIP = this.getClientIP(request);
    const key = `rate_limit_${clientIP}`;
    const now = Date.now();
    
    let entry = rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Nueva ventana o primera request
      entry = {
        count: 1,
        resetTime: now + this.config.rateLimitWindow!,
      };
      rateLimitStore.set(key, entry);
      return null;
    }
    
    if (entry.count >= this.config.rateLimitMax!) {
      return new NextResponse('Rate limit exceeded', {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': this.config.rateLimitMax!.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
        },
      });
    }
    
    entry.count++;
    rateLimitStore.set(key, entry);
    return null;
  }

  // Obtener IP del cliente
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return 'unknown';
  }

  // Validar tamaño de request
  private async validateRequestSize(request: NextRequest): Promise<NextResponse | null> {
    const contentLength = request.headers.get('content-length');
    
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > this.config.maxRequestSize!) {
        return new NextResponse('Request too large', { status: 413 });
      }
    }
    
    return null;
  }

  // Manejar CSRF
  private async handleCSRF(request: NextRequest): Promise<NextResponse | null> {
    const csrfToken = request.headers.get('X-CSRF-Token');
    const sessionToken = request.cookies.get('csrf-token')?.value;
    
    if (!csrfToken || !sessionToken) {
      return new NextResponse('CSRF token missing', { status: 403 });
    }
    
    if (!validateCSRFToken(csrfToken, sessionToken)) {
      return new NextResponse('Invalid CSRF token', { status: 403 });
    }
    
    return null;
  }

  // Validar y sanitizar input
  private async validateInput(request: NextRequest): Promise<NextResponse | null> {
    try {
      const contentType = request.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const body = await request.json();
        
        // Validar cada campo del body
        for (const [key, value] of Object.entries(body)) {
          if (typeof value === 'string') {
            // Verificar patrones maliciosos
            if (!this.validator.validateSQLInjection(value)) {
              return new NextResponse(`Invalid input in field: ${key}`, { status: 400 });
            }
            
            // Sanitizar el valor
            body[key] = this.validator.sanitizeText(value);
          }
        }
        
        // Recrear el request con datos sanitizados
        const sanitizedRequest = new NextRequest(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(body),
        });
        
        // Almacenar datos sanitizados para uso posterior
        (request as any).sanitizedBody = body;
      }
      
    } catch (error) {
      return new NextResponse('Invalid JSON', { status: 400 });
    }
    
    return null;
  }

  // Agregar headers de seguridad
  private addSecurityHeaders(request: NextRequest): NextResponse {
    const response = NextResponse.next();
    
    // Headers de seguridad básicos
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // CORS headers si es necesario
    const origin = request.headers.get('origin');
    if (origin && this.isAllowedOrigin(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    return response;
  }

  // Limpiar entradas expiradas del rate limit store
  public cleanupRateLimit(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Instancia global del middleware
let globalMiddleware: SecurityMiddleware | null = null;

// Función para obtener la instancia global
export function getSecurityMiddleware(config?: SecurityConfig): SecurityMiddleware {
  if (!globalMiddleware) {
    globalMiddleware = new SecurityMiddleware(config);
    
    // Limpiar rate limit store cada 5 minutos
    if (typeof window === 'undefined') { // Solo en el servidor
      setInterval(() => {
        globalMiddleware?.cleanupRateLimit();
      }, 5 * 60 * 1000);
    }
  }
  return globalMiddleware;
}

// Función helper para crear middleware personalizado
export function createSecurityMiddleware(config?: SecurityConfig) {
  const middleware = getSecurityMiddleware(config);
  
  return async (request: NextRequest) => {
    return await middleware.handle(request);
  };
}

// Función para generar y establecer token CSRF
export function setupCSRFProtection(response: NextResponse): NextResponse {
  const csrfToken = generateCSRFToken();
  
  response.cookies.set('csrf-token', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 horas
  });
  
  response.headers.set('X-CSRF-Token', csrfToken);
  
  return response;
}

// Hook para usar en componentes React
export function useCSRFToken() {
  const [csrfToken, setCSRFToken] = useState<string | null>(null);
  
  useEffect(() => {
    // Obtener token CSRF del servidor
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => setCSRFToken(data.token))
      .catch(err => console.error('Error getting CSRF token:', err));
  }, []);
  
  return csrfToken;
}

// Función para hacer requests seguros con CSRF
export async function secureRequest(url: string, options: RequestInit = {}) {
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf-token='))
    ?.split('=')[1];
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || 'GET')) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}

export default SecurityMiddleware;

// Importar useState y useEffect para el hook
import { useState, useEffect } from 'react';