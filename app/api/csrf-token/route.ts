import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken } from '../../lib/security';

export async function GET(request: NextRequest) {
  try {
    // Generar nuevo token CSRF
    const csrfToken = generateCSRFToken();
    
    // Crear respuesta con el token
    const response = NextResponse.json({ 
      token: csrfToken,
      timestamp: Date.now(),
    });
    
    // Establecer cookie segura con el token
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    });
    
    // Headers de seguridad adicionales
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    return response;
    
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

// Método POST para validar tokens CSRF
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Obtener token de la cookie
    const cookieToken = request.cookies.get('csrf-token')?.value;
    
    if (!cookieToken) {
      return NextResponse.json(
        { error: 'No CSRF token found in cookies' },
        { status: 403 }
      );
    }
    
    // Validar token
    const isValid = token === cookieToken;
    
    return NextResponse.json({
      valid: isValid,
      timestamp: Date.now(),
    });
    
  } catch (error) {
    console.error('Error validating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to validate CSRF token' },
      { status: 500 }
    );
  }
}