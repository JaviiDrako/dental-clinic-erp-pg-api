import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/login', '/api/auth/login'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Permitir rutas públicas
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verificar sesión en cookie HTTP-only
  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    // Intentar obtener de authUser (para compatibilidad)
    const authUser = request.cookies.get('authUser')?.value;
    if (!authUser) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Verificar expiración del token
  if (sessionCookie) {
    try {
      const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString());
      if (sessionData.exp && sessionData.exp < Date.now()) {
        // Token expirado
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('session');
        return response;
      }
    } catch (error) {
      // Token inválido
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};