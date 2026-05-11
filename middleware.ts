import { NextResponse } from 'next/server';
import { auth } from './auth';
import { canAccess } from './lib/permissions';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // List of public paths
  const isPublicPath = 
    nextUrl.pathname === '/' || 
    nextUrl.pathname === '/login' || 
    nextUrl.pathname.startsWith('/api/auth');

  if (isPublicPath) {
    // If logged in and trying to access login, redirect to dashboard
    if (isLoggedIn && nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
    return NextResponse.next();
  }

  // If not logged in and not public, redirect to login
  if (!isLoggedIn) {
    let from = nextUrl.pathname;
    if (nextUrl.search) {
      from += nextUrl.search;
    }
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, nextUrl)
    );
  }

  // Check RBAC for protected routes
  const protectedPrefixes = [
    '/dashboard',
    '/colaboradores',
    '/documentos',
    '/ponto',
    '/penalidades',
    '/premios',
    '/uniformes',
    '/config',
    '/relatorios'
  ];

  const isProtectedPath = protectedPrefixes.some(prefix => nextUrl.pathname.startsWith(prefix));

  if (isProtectedPath) {
    if (!canAccess(userRole, nextUrl.pathname)) {
      // If access denied, redirect to dashboard or a custom 403 page
      // For now, redirecting to dashboard with a query param might be helpful
      return NextResponse.redirect(new URL('/dashboard?error=AccessDenied', nextUrl));
    }
  }

  return NextResponse.next();
});

// Middleware config
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
