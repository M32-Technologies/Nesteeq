"use client"

import { useState } from "react"

import StaffHeader, { type StaffTab } from "./staff-header"
import StaffInvitationsTableSection from "./staff-invitations-table-section"
import StaffTableSection from "./staff-table-section"

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState<StaffTab>("members")
  const [inviteOpen, setInviteOpen] = useState(false)

  return (
    <div className="space-y-6 p-6">
      <StaffHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        inviteOpen={inviteOpen}
        onInviteOpenChange={setInviteOpen}
      />

      {activeTab === "members" ? (
        <StaffTableSection />
      ) : (
        <StaffInvitationsTableSection />
      )}
    </div>
  )
}
