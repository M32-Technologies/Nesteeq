"use client"

import React, { useState } from "react"
import { Briefcase, Loader2, Shield, UserRound, Wrench } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { authClient, useSession } from "@/lib/auth-client"
import api from "@/lib/axios"
import { ProfileHeader } from "../shared/ProfileHeader"
import { PersonalDetails } from "../shared/PersonalDetails"
import { WorkInformation } from "./WorkInformation"
import type { ApartmentData } from "@/features/dashboard/settings/types"

export type StaffProfileTab = "profile" | "work"

function formatMemberSince(dateString?: string | Date | null): string {
  if (!dateString) return "Aug 2026"
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return "Aug 2026"
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  } catch {
    return "Aug 2026"
  }
}

export function StaffProfile() {
  const queryClient = useQueryClient()
  const { data: session, isPending: isSessionLoading } = useSession()
  const user = session?.user

  const [activeTab, setActiveTab] = useState<StaffProfileTab>("profile")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Determine normalized staff role and presentation details
  const rawRole = (user?.role || "").toLowerCase().trim()
  const isSecurity = rawRole.includes("security")
  const isTechnician = rawRole.includes("maintenance") || rawRole.includes("technician")

  const displayRole = isSecurity
    ? "Security Staff"
    : isTechnician
      ? "Maintenance Technician"
      : "Staff Member"

  const roleIcon = isSecurity ? Shield : isTechnician ? Wrench : Briefcase

  const tagline = isSecurity
    ? "Keeping our community safe and secure."
    : isTechnician
      ? "Keeping your community safe, clean and comfortable."
      : "Serving our residents with care and dedication."

  // Fetch real Apartment application data from Nesteeq backend API
  const { data: apartmentData, isLoading: isApartmentLoading } = useQuery<ApartmentData | null>({
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

  // Format real location from apartment city & state or address
  const formattedLocation = [apartmentData?.city, apartmentData?.state]
    .filter(Boolean)
    .join(", ") || apartmentData?.address || ""

  const memberSince = formatMemberSince(user?.createdAt)

  // Handle avatar upload via backend upload endpoint and Better Auth
  const handleAvatarUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image file must be under 2MB")
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
    <div className="space-y-4 pb-6 max-w-[1400px] mx-auto">
      {/* 1. Shared Profile Header (Community Banner + Identity Info) */}
      <ProfileHeader
        bannerUrl="/images/apartment-banner.png"
        name={user?.name || "Staff Member"}
        roleBadge={displayRole}
        roleIcon={roleIcon}
        email={user?.email || ""}
        phone={user?.phone || ""}
        location={formattedLocation}
        apartmentName={apartmentData?.name || "Community"}
        memberSince={memberSince}
        avatarUrl={user?.image}
        isVerified={Boolean(user?.emailVerified ?? true)}
        tagline={tagline}
        onAvatarChange={handleAvatarUpload}
        isUpdatingAvatar={isUploadingAvatar}
      />

      {/* 2. Sub-Navigation Tabs (Only 2 tabs for Staff) */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6" aria-label="Staff profile navigation tabs">
          {/* Tab 1: My Profile */}
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`
              flex
              items-center
              gap-2
              pb-2.5
              text-xs
              sm:text-[13px]
              font-semibold
              border-b-2
              transition-colors
              cursor-pointer
              ${
                activeTab === "profile"
                  ? "border-[#08281E] text-[#08281E]"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }
            `}
          >
            <UserRound className="size-4 stroke-[2.2]" />
            <span>My Profile</span>
          </button>

          {/* Tab 2: Work Information */}
          <button
            type="button"
            onClick={() => setActiveTab("work")}
            className={`
              flex
              items-center
              gap-2
              pb-2.5
              text-xs
              sm:text-[13px]
              font-semibold
              border-b-2
              transition-colors
              cursor-pointer
              ${
                activeTab === "work"
                  ? "border-[#08281E] text-[#08281E]"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }
            `}
          >
            <Briefcase className="size-4" />
            <span>Work Information</span>
          </button>
        </nav>
      </div>

      {/* 3. Tab Content */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Left Column: Personal Details Form (~68%) */}
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
              showAlternatePhone={false}
            />
          </div>

          {/* Right Column: Work Information Card + Community Message (~32%) */}
          <div className="lg:col-span-4">
            <WorkInformation
              role={displayRole}
              apartmentName={apartmentData?.name}
              accountStatus="Active"
              memberSince={memberSince}
            />
          </div>
        </div>
      )}

      {/* 4. Tab 2: Dedicated Work Information View */}
      {activeTab === "work" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          <div className="lg:col-span-7">
            <WorkInformation
              role={displayRole}
              apartmentName={apartmentData?.name}
              accountStatus="Active"
              memberSince={memberSince}
            />
          </div>
        </div>
      )}
    </div>
  )
}
