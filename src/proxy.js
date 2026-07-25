import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware(
  async (auth, req) => {
    // Session is synced automatically for satellite applications.
  },
  {
    isSatellite: process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE === "true",
    domain: process.env.NEXT_PUBLIC_CLERK_DOMAIN,
    satelliteAutoSync: true,
  }
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.[\\w]+$|_next/image|_next/static|favicon.ico).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Ensure Clerk handshake path is matched
    '/__clerk/(.*)',
  ],
};
