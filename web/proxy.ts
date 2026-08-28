import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

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
