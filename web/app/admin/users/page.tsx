import type { Metadata } from "next"
import UsersPage from "@/features/admin/users/components/users-page"

export const metadata: Metadata = {
  title: "Property Managers & Users | Nesteeq Admin OS",
  description: "User directory, credential verification, and property manager account administration.",
}

export default function AdminUsersRoute() {
  return <UsersPage />
}
