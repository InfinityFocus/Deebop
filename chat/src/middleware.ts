import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.CHAT_JWT_SECRET || 'deebop-chat-dev-secret-change-in-production';
const COOKIE_NAME = 'deebop-chat-auth';

// Routes that require parent authentication
const parentRoutes = [
  '/dashboard',
  '/children',
  '/approvals',
  '/settings',
];

// Routes that require child authentication
const childRoutes = [
  '/friends',
  '/chat',
];

// Auth routes (redirect to dashboard/home if already authenticated)
const authRoutes = [
  '/login',
  '/parent/login',
  '/parent/register',
  '/child/login',
];

// Public routes (no auth required)
const publicRoutes = [
  '/',
  '/api',
];

interface JWTPayload {
  type: 'parent' | 'child';
  id: string;
  parentId?: string;
  email?: string;
  username?: string;
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const encodedSecret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes (they handle their own auth)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Skip static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/avatars') ||
    pathname.includes('.') // files with extensions
  ) {
    return NextResponse.next();
  }

  // Get auth token
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;

  const isAuthenticated = !!payload;
  const isParent = payload?.type === 'parent';
  const isChild = payload?.type === 'child';

  // Check if current route requires auth
  const isParentRoute = parentRoutes.some(route => pathname.startsWith(route));
  const isChildRoute = childRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname === route || pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname === route);

  // Handle parent routes
  if (isParentRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/parent/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isParent) {
      // Child trying to access parent routes
      return NextResponse.redirect(new URL('/friends', request.url));
    }
  }

  // Handle child routes
  if (isChildRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/child/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isChild) {
      // Parent trying to access child routes
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Handle auth routes (redirect if already logged in)
  if (isAuthRoute && isAuthenticated) {
    if (isParent) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (isChild) {
      return NextResponse.redirect(new URL('/friends', request.url));
    }
  }

  // Handle child default route (/) - redirect to friends if logged in as child
  if (pathname === '/' && isChild) {
    return NextResponse.redirect(new URL('/friends', request.url));
  }

  // Handle parent default route (/) - redirect to dashboard if logged in as parent
  if (pathname === '/' && isParent) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
