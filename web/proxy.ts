import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
<<<<<<< HEAD
=======
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

  return normalizeDashboardRole(session?.user?.role);
}
>>>>>>> origin/dev

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
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
