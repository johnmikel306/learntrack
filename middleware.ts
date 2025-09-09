import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/role-setup(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId } = auth();
    if (!userId) {
      const url = new URL('/sign-in', req.url);
      return NextResponse.redirect(url);
    }
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)']
};
