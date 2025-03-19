import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // Using jose for Edge Runtime compatibility

// List of routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/wallet',
  '/transactions',
];

// Routes that are public (no auth needed)
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const path = request.nextUrl.pathname;
  
  // Check if it's an API route that should be protected
  const isProtectedApiRoute = path.startsWith('/api/') && 
    !path.includes('/api/authentication') && 
    !path.startsWith('/api/public');

  // Check if it's a protected page route
  const isProtectedPageRoute = protectedRoutes.some(route => 
    path.startsWith(route)
  );

  // If it's a public route, allow access
  if (publicRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }
  
  // If it needs protection and there's no token, redirect to login
  if ((isProtectedApiRoute || isProtectedPageRoute) && !token) {
    if (isProtectedApiRoute) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    // Redirect to login for page routes
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  // If there is a token, validate it
  if (token) {
    try {
      // JWT verification - replace with your actual secret
      const secretKey = new TextEncoder().encode(
        process.env.JWT_SECRET as string
      );
      
      const { payload } = await jwtVerify(token, secretKey);
      
      // Add user info to request headers for route handlers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId as string);
      requestHeaders.set('x-user-role', payload.role as string);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error('Token verification error:', error);
      // Token is invalid - clear it and redirect to login
      const response = isProtectedApiRoute
        ? NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url));
      
      response.cookies.delete('auth_token');
      return response;
    }
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