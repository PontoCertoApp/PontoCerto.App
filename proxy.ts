import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { nextUrl } = req;

  // Checar cookie de sessão diretamente — evita race condition com JWT
  // NextAuth v5 pode usar prefixo "authjs" ou "next-auth" dependendo do ambiente
  const sessionToken =
    req.cookies.get("next-auth.session-token")?.value ??
    req.cookies.get("__Secure-next-auth.session-token")?.value ??
    req.cookies.get("authjs.session-token")?.value ??
    req.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoggedIn = !!sessionToken;

  // NUNCA bloquear rotas do NextAuth (signout, csrf, session, callback, etc.)
  if (nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isAuthRoute = ["/login", "/register"].includes(nextUrl.pathname);

  // Usuário autenticado tentando acessar /login ou /register → /dashboard
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Rota pública da landing page
  if (nextUrl.pathname === "/") {
    return NextResponse.next();
  }

  // Rota protegida sem sessão → /login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
