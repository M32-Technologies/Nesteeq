import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import {
  getDashboardRoleFromRouteSegment,
  normalizeDashboardRole,
  getDashboardRoleRouteSegment,
} from "@/features/dashboard/config/sidebar-navigation";

type AuthSessionResponse = {
  user?: {
    role?: string | null;
  } | null;
} | null;

function getAuthBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? null;
}

async function getCurrentUserRole(request: NextRequest) {
  const baseUrl = getAuthBaseUrl();
  const cookieHeader = request.headers.get("cookie");

  if (!baseUrl || !cookieHeader) {
    return null;
  }

  let response: Response;

  try {
    response = await fetch(`${baseUrl}/api/auth/get-session?disableCookieCache=true`, {
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const session = (await response.json()) as AuthSessionResponse;

  return session?.user?.role ?? null;
}

function isAdmin(role?: string | null): boolean {
  if (!role) return false;
  return role.trim().toLowerCase() === "admin";
}

export default  async function proxy(request: NextRequest) {

  const pathname = request.nextUrl.pathname;

  const sessionCookie = getSessionCookie(request);

  // 1. Auth routes (/login, /register, /admin/login): Redirect authenticated users to their dashboard
  const isAuthRoute = 
    pathname === "/login" || 
    pathname === "/register" || 
    pathname === "/admin/login";

  if (isAuthRoute) {
    if (sessionCookie) {
      const rawRole = await getCurrentUserRole(request);
      if (rawRole) {
        if (isAdmin(rawRole)) {
          return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        }
        const userRole = normalizeDashboardRole(rawRole);
        const homeSegment = getDashboardRoleRouteSegment(userRole);
        return NextResponse.redirect(new URL(`/${homeSegment}`, request.url));
      }
    }
    return NextResponse.next();
  }

  // 2. Onboarding route (/onboarding)
  if (pathname === "/onboarding") {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login?from=pricing", request.url));
    }
    const rawRole = await getCurrentUserRole(request);
    if (isAdmin(rawRole)) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    const userRole = normalizeDashboardRole(rawRole);
    if (userRole === "property_manager") {
      return NextResponse.redirect(new URL("/property-manager", request.url));
    }
    return NextResponse.next();
  }
  
  // 3. Protected routes: Require session cookie
  if (!sessionCookie) {
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const rawRole = await getCurrentUserRole(request);

  if (!rawRole) {
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. Admin Routing Logic
  if (isAdmin(rawRole)) {
    if (!pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 5. Block Normal Users from Admin Routes
  if (pathname.startsWith("/admin")) {
    const userRole = normalizeDashboardRole(rawRole);
    const homeSegment = getDashboardRoleRouteSegment(userRole);
    return NextResponse.redirect(new URL(`/${homeSegment}`, request.url));
  }

  // 6. Normal User Portal Confinement
  const pathSegment = pathname.split("/")[1]; 
  const requiredRole = getDashboardRoleFromRouteSegment(pathSegment);

  if (!requiredRole) {
    return NextResponse.next();
  }

  const userRole = normalizeDashboardRole(rawRole);

  if (userRole !== requiredRole) {
    const homeSegment = getDashboardRoleRouteSegment(userRole);
    return NextResponse.redirect(new URL(`/${homeSegment}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/admin/login",
    "/admin/:path*", 
    "/onboarding",
    "/property-manager/:path*",
    "/treasurer/:path*",
    "/facility-manager/:path*",
    "/security/:path*",
    "/maintenance-technician/:path*",
    "/resident/:path*",
  ],
};