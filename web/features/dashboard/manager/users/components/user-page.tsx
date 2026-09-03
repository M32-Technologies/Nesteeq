"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import UsersHeader, { type UsersTab } from "./users-header"
import UsersInvitationsTableSection from "./users-invitations-table-section"
import UsersTableSection from "./users-table-section"

export default function UsersPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<UsersTab>("members")

  return (
    <div className="space-y-6 p-6">
      <UsersHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onInviteClick={() => router.push("/property-manager/users/invite")}
      />

      {activeTab === "members" ? (
        <UsersTableSection />
      ) : (
        <UsersInvitationsTableSection />
      )}
    </div>
  )
}
