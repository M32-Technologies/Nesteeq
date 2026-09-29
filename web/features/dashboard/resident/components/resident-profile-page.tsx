"use client"

import React, { useState } from "react"
import { Home, Loader2, UserRound } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { authClient, useSession } from "@/lib/auth-client"
import api from "@/lib/axios"
import { ProfileHeader } from "@/components/profile/shared/ProfileHeader"
import { PersonalDetails } from "@/components/profile/shared/PersonalDetails"
import { ResidentInformation } from "@/components/profile/resident/ResidentInformation"
import type { ApartmentData } from "../../settings/types"
import { resolveFlatName } from "../../settings/types"
import { useResidentDashboard } from "../hooks/use-resident-dashboard"

function formatMemberSince(dateString?: string | Date | null): string {
  if (!dateString) return "Sep 2026"
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return "Sep 2026"
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  } catch {
    return "Sep 2026"
  }
}

export function ResidentProfilePage() {
  const queryClient = useQueryClient()
  const { data: session, isPending: isSessionLoading } = useSession()
  const user = session?.user

  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Contextual fallback from resident dashboard hook
  const { apartmentName: hookAptName, flatUnitName: hookFlatName } = useResidentDashboard()

  // Fetch real Apartment application data
  const { data: apartmentData } = useQuery<ApartmentData | null>({
    queryKey: ["current-apartment-details"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/v1/apartment/current")
        return res.data?.data || null
      } catch {
        return null
      }
    },
    staleTime: 1000 * 60 * 5,
  })

  // Format real location
  const formattedLocation = [apartmentData?.city, apartmentData?.state]
    .filter(Boolean)
    .join(", ") || apartmentData?.address || ""

  const societyName = apartmentData?.name || hookAptName || "Community"
  const displayFlat = resolveFlatName(user?.flatId) || hookFlatName || "Unit Assigned"

  // Role detection
  const userRole = (user?.role || "resident").toLowerCase()
  const isOwner = userRole === "owner" || userRole.includes("owner")
  const roleBadge = isOwner ? "Owner" : "Resident"

  const memberSince = formatMemberSince(user?.createdAt)

  // Handle avatar upload via Express endpoint and Better-Auth updateUser
  const handleAvatarUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file must be under 5MB")
      return
    }

    try {
      setIsUploadingAvatar(true)

      const formData = new FormData()
      formData.append("avatar", file)

      const uploadRes = await api.post("/api/v1/upload/avatar", formData)
      const imageUrl = uploadRes.data?.url

      if (!imageUrl) {
        throw new Error("Failed to get uploaded image URL")
      }

      const { error } = await authClient.updateUser({
        image: imageUrl,
      })

      if (error) {
        throw new Error(error.message || "Failed to update profile photo")
      }

      await queryClient.invalidateQueries()
      toast.success("Profile photo updated successfully")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload photo"
      toast.error(msg)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Handle personal details save
  const handleSavePersonalDetails = async (data: {
    name: string
    phone: string
    alternatePhone?: string
  }) => {
    try {
      setIsSavingProfile(true)
      const updatePayload: { name: string; phone?: string } = {
        name: data.name.trim(),
      }
      if (data.phone.trim()) {
        updatePayload.phone = data.phone.trim()
      }

      const { error } = await authClient.updateUser(updatePayload)
      if (error) {
        throw new Error(error.message || "Failed to save profile changes")
      }

      await queryClient.invalidateQueries()
      toast.success("Personal details updated successfully!")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed"
      toast.error(msg)
    } finally {
      setIsSavingProfile(false)
    }
  }

  if (isSessionLoading && !user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#08281E]" />
      </div>
    )
  }

  return (
    <div className="space-y-3 pb-4 max-w-[1400px] mx-auto">
      {/* 1. Shared Profile Header (Community Banner + Identity Info) */}
      <ProfileHeader
        bannerUrl="/images/apartment-banner.png"
        name={user?.name || "Resident"}
        roleBadge={roleBadge}
        roleIcon={Home}
        email={user?.email || ""}
        phone={user?.phone || ""}
        location={formattedLocation}
        apartmentName={societyName}
        memberSince={memberSince}
        avatarUrl={user?.image}
        isVerified={Boolean(user?.emailVerified ?? true)}
        tagline="Comfortable living in a connected community."
        onAvatarChange={handleAvatarUpload}
        isUpdatingAvatar={isUploadingAvatar}
      />

      {/* 2. Sub-Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6" aria-label="Resident profile navigation tabs">
          {/* Tab 1: My Profile */}
          <button
            type="button"
            className="flex items-center gap-1.5 pb-2 text-xs sm:text-[13px] font-semibold border-b-2 border-[#08281E] text-[#08281E] transition-colors cursor-pointer"
          >
            <UserRound className="size-3.5 stroke-[2.2]" />
            <span>My Profile</span>
          </button>
        </nav>
      </div>

      {/* 3. Main Content: 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Left Column: Personal Details Form (approx 68% - lg:col-span-8) */}
        <div className="lg:col-span-8">
          <PersonalDetails
            initialData={{
              name: user?.name || "",
              email: user?.email || "",
              phone: user?.phone || "",
              avatarUrl: user?.image,
              isVerified: Boolean(user?.emailVerified ?? true),
            }}
            onSave={handleSavePersonalDetails}
            onAvatarUpload={handleAvatarUpload}
            isSaving={isSavingProfile}
            isUploadingAvatar={isUploadingAvatar}
          />
        </div>

        {/* Right Column: Residence & Account Information (approx 35% - lg:col-span-4) */}
        <div className="lg:col-span-4">
          <ResidentInformation
            role={roleBadge}
            flatName={displayFlat}
            apartmentName={societyName}
            accountStatus="Active"
            isEmailVerified={Boolean(user?.emailVerified ?? true)}
            memberSince={memberSince}
          />
        </div>
      </div>
    </div>
  )
}

export default ResidentProfilePage
