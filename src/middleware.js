import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/login(.*)',
  '/auth/sign-up(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/(.*)',
  '/__clerk/(.*)',
]);

export default clerkMiddleware(
  async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  },
  (req) => {
    const host = req.nextUrl.host || '';
    const isLocalhost = host.includes('localhost');
    const domain = isLocalhost ? host : 'devpass.cashms.in';
    const rawSignInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || 'https://devtech.cashms.in/auth/login';
    const signInUrl = isLocalhost 
      ? 'http://localhost:3000/auth/login' 
      : (rawSignInUrl.startsWith('http') ? rawSignInUrl : `https://devtech.cashms.in${rawSignInUrl}`);
    return {
      isSatellite: !isLocalhost,
      domain,
      satelliteAutoSync: true,
      signInUrl,
    };
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/(api|trpc)(.*)',
  ],
};
