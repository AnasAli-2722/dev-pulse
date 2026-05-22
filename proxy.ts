import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const publicPaths = ["/login", "/auth/callback"];

export async function proxy(request: NextRequest) {
  const { user, supabaseResponse, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Helper to safely redirect while preserving Supabase session cookies
  const safeRedirect = (url: URL) => {
    const redirectResponse = NextResponse.redirect(url);
    // CRITICAL: We must copy the cookies from supabaseResponse to the redirectResponse
    // Otherwise, any refreshed session tokens are lost and the user falls into an auth loop
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        domain: cookie.domain,
        path: cookie.path,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
      });
    });
    return redirectResponse;
  };

  // Rule 1: Unauthenticated user trying to access protected routes → redirect to /login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return safeRedirect(url);
  }

  // Rule 2: Authenticated user trying to access /login → redirect to /
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return safeRedirect(url);
  }

  // Rule 3: Check onboarding status for authenticated users
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    const hasProfile = !!profile;

    if (!hasProfile && pathname !== "/onboarding" && pathname !== "/auth/callback") {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return safeRedirect(url);
    }

    if (hasProfile && pathname === "/onboarding") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return safeRedirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Static assets (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
