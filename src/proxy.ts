import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

// Use the lightweight Edge-safe config (no Prisma) for middleware.
// auth.ts uses the full config (with Prisma) only in Node.js API routes.
const { auth } = NextAuth(authConfig);

const protectedPaths = ['/dashboard', '/profile', '/notifications'];
const authPaths = ['/login', '/register'];

const MAX_COOKIE_BYTES = 4096;
const NEXTAUTH_COOKIE_PREFIXES = ['next-auth.', '__Secure-next-auth.'];

function hasOversizedCookies(req: Request): boolean {
  const cookieHeader = req.headers.get('cookie') ?? '';
  for (const pair of cookieHeader.split(';')) {
    const [name, ...rest] = pair.trim().split('=');
    const isAuthCookie = NEXTAUTH_COOKIE_PREFIXES.some((p) => name?.trim().startsWith(p));
    if (isAuthCookie && rest.join('=').length > MAX_COOKIE_BYTES) return true;
  }
  return false;
}

export default auth((req) => {
  if (hasOversizedCookies(req)) {
    const loginUrl = new URL('/login', req.nextUrl);
    const res = NextResponse.redirect(loginUrl);
    const cookieHeader = req.headers.get('cookie') ?? '';
    for (const pair of cookieHeader.split(';')) {
      const name = pair.trim().split('=')[0]?.trim();
      if (name && NEXTAUTH_COOKIE_PREFIXES.some((p) => name.startsWith(p))) {
        res.cookies.delete(name);
      }
    }
    return res;
  }

  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const path = nextUrl.pathname;

  if (protectedPaths.some((p) => path.startsWith(p)) && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  if (authPaths.includes(path) && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|icon\\.svg|.*\\.(?:png|jpg|ico|webp)).*)',
  ],
};
