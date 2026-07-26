import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/__clerk/(.*)',
]);

const isAuthPage = createRouteMatcher([
  '/',
]);

export default clerkMiddleware(
  async (auth, req) => {
    const { userId } = await auth();
    const isApiRoute = req.nextUrl.pathname.startsWith('/api/');

    if (userId && isAuthPage(req)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  },
  {
    isSatellite: process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE === "true",
    domain: process.env.NEXT_PUBLIC_CLERK_DOMAIN,
    satelliteAutoSync: true,
  }
);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.[\\w]+$|_next/image|_next/static|favicon.ico).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
