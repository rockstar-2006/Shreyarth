import { NextRequest, NextResponse } from 'next/server';

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/api/auth/session', '/_next', '/favicon.ico', '/smvitm-logo'];

// Role → allowed path prefixes
const ROLE_PATHS: Record<string, string[]> = {
  admin: ['/admin'],
  swb_member: ['/swb'],
  student: ['/student'],
};

// Role → redirect dashboard
const ROLE_DASHBOARD: Record<string, string> = {
  admin: '/admin/dashboard',
  swb_member: '/swb/dashboard',
  student: '/student/dashboard',
};

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname === '/';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths and static assets
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const role = request.cookies.get('session_role')?.value;
  const uid = request.cookies.get('session_uid')?.value;

  // Unauthenticated: redirect to login
  if (!role || !uid) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  const allowedPaths = ROLE_PATHS[role] ?? [];
  const hasAccess = allowedPaths.some((p) => pathname.startsWith(p));

  if (!hasAccess) {
    // Redirect to the user's correct dashboard
    const dashboard = ROLE_DASHBOARD[role] ?? '/login';
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|smvitm-logo|public).*)',
  ],
};
