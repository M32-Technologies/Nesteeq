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

  const response = await fetch(`${baseUrl}/api/auth/get-session`, {
    headers: {
      cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const session = (await response.json()) as AuthSessionResponse;

  return normalizeDashboardRole(session?.user?.role);
}

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const pathname = request.nextUrl.pathname;
  const pathSegment = pathname.split("/")[1]; 

  const requiredRole = getDashboardRoleFromRouteSegment(pathSegment);

  if (!requiredRole) {
    return NextResponse.next();
  }

  const userRole = await getCurrentUserRole(request);

  if (!userRole) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (userRole !== requiredRole) {
    const homeSegment = getDashboardRoleRouteSegment(userRole);
    return NextResponse.redirect(new URL(`/${homeSegment}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/super-admin/:path*",
    "/property-manager/:path*",
    "/treasurer/:path*",
    "/facility-manager/:path*",
    "/security/:path*",
    "/maintenance-technician/:path*",
    "/resident/:path*",
  ],
};
