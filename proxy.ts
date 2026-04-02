import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  // Protected routes - redirect to sign-in if not authenticated
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");

  if (isDashboardRoute && !user) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  // Auth routes - redirect to dashboard if already authenticated
  if (isAuthRoute && user && request.nextUrl.pathname !== "/auth/callback") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
