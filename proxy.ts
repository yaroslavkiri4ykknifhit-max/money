import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('session_token');
  const { pathname } = request.nextUrl;

  // Protect /lessons routes
  if (pathname.startsWith('/lessons')) {
    if (!token) {
      // Redirect to Gatekeeper (login)
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // If logged in and on the login page, redirect to lessons
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/lessons/1', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/lessons/:path*'],
};
