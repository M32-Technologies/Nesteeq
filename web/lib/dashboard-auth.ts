import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import {
  getDashboardRoleRouteSegment,
  normalizeDashboardRole,
  type DashboardRole,
} from "@/features/dashboard/config/sidebar-navigation"

import { isAdminRole } from "@/lib/auth-client"

type AuthSessionUser = {
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
}

type AuthSessionResponse = {
  user?: AuthSessionUser | null
  session?: unknown
} | null

export type DashboardSession = {
  role: DashboardRole
  user: {
    name: string
    email: string
    image?: string | null
  }
}

export type AdminSession = {
  role: "admin"
  user: {
    name: string
    email: string
    image?: string | null
  }
}

function getAuthBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured")
  }

  return baseUrl.replace(/\/$/, "")
}

export function getDashboardHomePath(role: DashboardRole) {
  return `/${getDashboardRoleRouteSegment(role)}`
}

export async function getRawAuthSession(): Promise<AuthSessionResponse> {
  const cookieHeader = (await cookies()).toString()

  if (!cookieHeader) {
    return null
  }

  try {
    const response = await fetch(`${getAuthBaseUrl()}/api/auth/get-session`, {
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as AuthSessionResponse
  } catch {
    return null
  }
}

export async function getCurrentDashboardSession() {
  const data = await getRawAuthSession()

  if (!data?.user) {
    return null
  }

  const role = normalizeDashboardRole(data.user.role)
  const name =
    data.user.name || data.user.email?.split("@")[0] || "Dashboard user"

  return {
    role,
    user: {
      name,
      email: data.user.email || "",
      image: data.user.image || undefined,
    },
  } satisfies DashboardSession
}

export async function requireCurrentDashboardSession() {
  const dashboardSession = await getCurrentDashboardSession()

  if (!dashboardSession) {
    redirect("/login")
  }

  return dashboardSession
}

export async function requireAdminSession(): Promise<AdminSession> {
  const data = await getRawAuthSession()

  if (!data?.user) {
    redirect("/admin/login")
  }

  if (!isAdminRole(data.user.role)) {
    redirect("/")
  }

  const name =
    data.user.name || data.user.email?.split("@")[0] || "Administrator"

  return {
    role: "admin",
    user: {
      name,
      email: data.user.email || "",
      image: data.user.image || undefined,
    },
  }
}
