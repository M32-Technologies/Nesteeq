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
    response = await fetch(`${baseUrl}/api/auth/get-session`, {
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

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionCookie = getSessionCookie(request);

  // 1. Auth routes (/login, /register): Redirect authenticated users to their dashboard
  const isAuthRoute = pathname === "/login" || pathname === "/register";

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

  // 2. Onboarding route (/onboarding):
  // - Unauthenticated users are redirected to login
  // - Users who already completed onboarding (property-manager) are redirected to their dashboard
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
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const pathSegment = pathname.split("/")[1]; 

  const requiredRole = getDashboardRoleFromRouteSegment(pathSegment);

  if (!requiredRole) {
    return NextResponse.next();
  }

  const rawRole = await getCurrentUserRole(request);

  if (!rawRole) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin users must only access the admin portal, not tenant/staff portals
  if (isAdmin(rawRole)) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
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
    "/onboarding",
    "/property-manager/:path*",
    "/treasurer/:path*",
    "/facility-manager/:path*",
    "/security/:path*",
    "/maintenance-technician/:path*",
    "/resident/:path*",
  ],
};
