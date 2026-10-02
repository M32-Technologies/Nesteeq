"use client"

import React, { useState } from "react"
import { Building2, CreditCard, Loader2, UserRound } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { authClient, useSession } from "@/lib/auth-client"
import api from "@/lib/axios"
import { uploadAvatarToS3 } from "@/lib/upload"
import {
  dashboardRoleLabels,
  normalizeDashboardRole,
} from "@/features/dashboard/config/sidebar-navigation"
import { ProfileHeader } from "../shared/ProfileHeader"
import { PersonalDetails } from "../shared/PersonalDetails"
import { ManagementInformation } from "./ManagementInformation"
import type { ApartmentData, SubscriptionData } from "@/features/dashboard/settings/types"
import { ApartmentDetails } from "./ApartmentDetails"
import { SubscriptionSettingsPanel } from "@/features/dashboard/settings/components/subscription-settings-panel"

export type ProfileTab = "profile" | "apartment" | "subscription"

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

export function ManagementProfile() {
  const queryClient = useQueryClient()
  const { data: session, isPending: isSessionLoading } = useSession()
  const user = session?.user

  const normalizedRole = normalizeDashboardRole(user?.role)
  const isPropertyManager =
    normalizedRole === "property_manager" ||
    user?.role?.trim().toLowerCase() === "admin" ||
    user?.role?.trim().toLowerCase() === "super_admin"

  const roleBadge =
    user?.role?.trim().toLowerCase() === "admin"
      ? "Administrator"
      : dashboardRoleLabels[normalizedRole] || "Management"

  const defaultTagline = isPropertyManager
    ? "Well-managed spaces create better lives."
    : normalizedRole === "treasurer"
      ? "Ensuring financial transparency and sound management."
      : normalizedRole === "facility_manager"
        ? "Maintaining excellence across our facilities."
        : "Dedicated to our community."

  const [activeTab, setActiveTab] = useState<ProfileTab>("profile")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

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

  // Fetch real Subscription data only for Property Manager
  const { data: subscriptionData, isLoading: isSubscriptionLoading } = useQuery<SubscriptionData | null>({
    queryKey: ["current-subscription-details"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/v1/subscriptions/current")
        return res.data?.data || null
      } catch {
        return null
      }
    },
    enabled: isPropertyManager,
    staleTime: 1000 * 60 * 5,
  })

  // Format real location from apartment city & state
  const formattedLocation = [apartmentData?.city, apartmentData?.state]
    .filter(Boolean)
    .join(", ") || apartmentData?.address || ""

  const memberSince = formatMemberSince(user?.createdAt)

  // Handle avatar upload via direct S3 presigned URL and Better-Auth
  const handleAvatarUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file must be under 5MB")
      return
    }

    try {
      setIsUploadingAvatar(true)

      const s3Key = await uploadAvatarToS3(file)

      const { error } = await authClient.updateUser({
        image: s3Key,
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
        name={user?.name || roleBadge}
        roleBadge={roleBadge}
        email={user?.email || ""}
        phone={user?.phone || apartmentData?.contactNumber || ""}
        location={formattedLocation}
        apartmentName={apartmentData?.name || "Community"}
        memberSince={memberSince}
        avatarUrl={user?.image}
        isVerified={Boolean(user?.emailVerified ?? true)}
        tagline={defaultTagline}
        onAvatarChange={handleAvatarUpload}
        isUpdatingAvatar={isUploadingAvatar}
      />

      {/* 2. Sub-Navigation Tabs (Only Property Manager can access Apartment & Subscription) */}
      {isPropertyManager && (
        <div className="border-b border-slate-200">
          <nav className="flex space-x-6" aria-label="Profile navigation tabs">
            {/* Tab 1: My Profile */}
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`
                flex
                items-center
                gap-1.5
                pb-2
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
              <UserRound className="size-3.5 stroke-[2.2]" />
              <span>My Profile</span>
            </button>

            {/* Tab 2: Apartment */}
            <button
              type="button"
              onClick={() => setActiveTab("apartment")}
              className={`
                flex
                items-center
                gap-1.5
                pb-2
                text-xs
                sm:text-[13px]
                font-semibold
                border-b-2
                transition-colors
                cursor-pointer
                ${
                  activeTab === "apartment"
                    ? "border-[#08281E] text-[#08281E]"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }
              `}
            >
              <Building2 className="size-3.5" />
              <span>Apartment</span>
            </button>

            {/* Tab 3: Subscription */}
            <button
              type="button"
              onClick={() => setActiveTab("subscription")}
              className={`
                flex
                items-center
                gap-1.5
                pb-2
                text-xs
                sm:text-[13px]
                font-semibold
                border-b-2
                transition-colors
                cursor-pointer
                ${
                  activeTab === "subscription"
                    ? "border-[#08281E] text-[#08281E]"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }
              `}
            >
              <CreditCard className="size-3.5" />
              <span>Subscription</span>
            </button>
          </nav>
        </div>
      )}

      {/* 3. Tab Content */}
      {(!isPropertyManager || activeTab === "profile") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Left Column: Personal Details Form (approx 68%) */}
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

          {/* Right Column: Account / Management Information (approx 35%) */}
          <div className="lg:col-span-4">
            <ManagementInformation
              role={roleBadge}
              apartmentName={apartmentData?.name || "Community"}
              accountStatus={apartmentData?.status === "active" ? "Active" : "Active"}
              isEmailVerified={Boolean(user?.emailVerified ?? true)}
              memberSince={memberSince}
            />
          </div>
        </div>
      )}

      {/* 2. Apartment Tab Panel (Property Manager only) */}
      {isPropertyManager && activeTab === "apartment" && (
        <div className="pt-1">
          <ApartmentDetails
            apartmentData={apartmentData}
            isLoading={isApartmentLoading}
          />
        </div>
      )}

      {/* 3. Subscription Tab Panel (Property Manager only) */}
      {isPropertyManager && activeTab === "subscription" && (
        <div className="pt-2">
          <SubscriptionSettingsPanel
            subscriptionData={subscriptionData}
            isLoading={isSubscriptionLoading}
          />
        </div>
      )}
    </div>
  )
}
