import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeSessionPayload(token: string): { role?: string; sub?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const base64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static / Next.js internals / API routes to ignore
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get('moneysimp_session')?.value;
  const isAuthenticated = Boolean(sessionToken);

  const isAuthRoute = pathname === '/login';
  const isLandingRoute = pathname === '/';

  // If user is logged in and visits login page, redirect to dashboard
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is NOT logged in and attempts to access protected routes
  if (!isAuthenticated && !isAuthRoute && !isLandingRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route protection: Only users with role === 'admin' can enter /admin
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated || !sessionToken) {
      return NextResponse.redirect(new URL('/login?from=/admin', request.url));
    }
    const sessionPayload = decodeSessionPayload(sessionToken);
    if (!sessionPayload || sessionPayload.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
