import { NextResponse } from 'next/server';
import { auth } from './auth';
import { canAccess } from './lib/permissions';

/**
 * Next.js 16+ Proxy/Middleware Handler
 * Standardizing on proxy.ts to resolve deployment conflicts.
 */
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Robust origin detection for redirects in proxy environments (Easypanel)
  // Prefer x-forwarded-host so the public-facing domain is used, not the internal container host
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || nextUrl.host;
  const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const baseOrigin = `${protocol}://${host}`;

  const getAbsoluteUrl = (path: string) => {
    return new URL(path, baseOrigin);
  };

  // 1. NUNCA bloquear rotas do NextAuth
  if (nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // 2. List of public paths (Landing, Login, Register, Seed)
  const isAuthRoute = ["/login", "/register", "/seed"].includes(nextUrl.pathname);
  const isPublicPath = nextUrl.pathname === '/' || isAuthRoute;

  if (isPublicPath) {
    // If logged in and trying to access auth routes, redirect to dashboard
    if (isLoggedIn && isAuthRoute) {
      return NextResponse.redirect(getAbsoluteUrl('/dashboard'));
    }
    return NextResponse.next();
  }

  // 3. If not logged in and not public, redirect to login
  if (!isLoggedIn) {
    let from = nextUrl.pathname;
    if (nextUrl.search) {
      from += nextUrl.search;
    }
    return NextResponse.redirect(
      getAbsoluteUrl(`/login?callbackUrl=${encodeURIComponent(from)}`)
    );
  }

  // 4. Check RBAC for protected routes
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
      // Evitar loop de redirecionamento: se já estamos no dashboard com erro, não redireciona de novo
      if (nextUrl.pathname === '/dashboard' && nextUrl.searchParams.has('error')) {
        return NextResponse.next();
      }
      return NextResponse.redirect(getAbsoluteUrl('/dashboard?error=AccessDenied'));
    }
  }

  return NextResponse.next();
});

// Proxy config (matcher)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
