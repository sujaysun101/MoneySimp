import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  // Protect all routes except the public ones (adjust as needed)
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (your login page)
     * - (add other public routes here)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login).*)",
  ],
};