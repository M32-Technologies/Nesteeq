"use client"

import React, { useRef } from "react"
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react"
import { ProfileBanner } from "./ProfileBanner"
import { ProfileAvatar } from "./ProfileAvatar"

export interface ProfileHeaderProps {
  bannerUrl?: string
  bannerPosition?: string
  name: string
  roleBadge: string
  roleIcon?: React.ComponentType<{ className?: string }>
  email: string
  phone?: string
  location?: string
  apartmentName?: string
  memberSince?: string
  avatarUrl?: string | null
  isVerified?: boolean
  tagline?: string
  onAvatarChange?: (file: File) => void
  isUpdatingAvatar?: boolean
}

export function ProfileHeader({
  bannerUrl = "/images/apartment-banner.png",
  bannerPosition,
  name,
  roleBadge,
  roleIcon: RoleIcon = Briefcase,
  email,
  phone,
  location,
  apartmentName,
  memberSince,
  avatarUrl,
  isVerified = true,
  tagline = "Well-managed spaces create better lives.",
  onAvatarChange,
  isUpdatingAvatar = false,
}: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onAvatarChange) {
      onAvatarChange(file)
    }
    // Reset file input so re-selecting same file triggers change
    if (e.target) {
      e.target.value = ""
    }
  }

  // Format name with proper title capitalization
  const formattedName = name
    ? name
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")
    : "User"

  // Display location with proper capitalization
  const rawLocation = location || apartmentName || ""
  const displayLocation = rawLocation
    ? rawLocation
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(", ")
    : ""

  return (
    <section className="relative w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <ProfileBanner bannerUrl={bannerUrl} objectPosition={bannerPosition}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 size-full">
          {/* Left Column: Avatar & User Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 min-w-0 max-w-full lg:max-w-[65%] xl:max-w-[68%]">
            {/* Avatar with Camera upload trigger */}
            <ProfileAvatar
              name={formattedName}
              avatarUrl={avatarUrl}
              size="xl"
              showUploadButton={Boolean(onAvatarChange)}
              onUploadClick={() => fileInputRef.current?.click()}
              isLoading={isUpdatingAvatar}
            />

            {/* Identity Information */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              {/* Name + Verified Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-[#08281E] tracking-tight leading-tight truncate">
                  {formattedName}
                </h1>
                {isVerified && (
                  <span
                    title="Verified Account"
                    className="inline-flex items-center justify-center shrink-0 text-[#0F8C5E]"
                  >
                    <CheckCircle2 className="size-5 fill-[#0F8C5E] text-white stroke-[2.5]" />
                  </span>
                )}
              </div>

              {/* Role Badge */}
              <div className="mt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E8F2EC] text-[#0A3D2D] border border-[#CCE4D7] text-xs font-semibold leading-none">
                  <RoleIcon className="size-3.5 shrink-0 text-[#0F5F45] stroke-[2.2]" />
                  <span>{roleBadge}</span>
                </span>
              </div>

              {/* Contact & Meta Row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs text-[#2C4A3E]">
                {email && (
                  <div className="inline-flex items-center gap-1.5 leading-none" title="Email address">
                    <Mail className="size-3.5 shrink-0 text-[#4E7564]" />
                    <span className="truncate max-w-[220px] sm:max-w-none">{email}</span>
                  </div>
                )}

                {phone && (
                  <>
                    <span className="text-[#B5CCC1] select-none hidden sm:inline" aria-hidden="true">•</span>
                    <div className="inline-flex items-center gap-1.5 leading-none" title="Phone number">
                      <Phone className="size-3.5 shrink-0 text-[#4E7564]" />
                      <span>{phone}</span>
                    </div>
                  </>
                )}

                {displayLocation && (
                  <>
                    <span className="text-[#B5CCC1] select-none hidden sm:inline" aria-hidden="true">•</span>
                    <div className="inline-flex items-center gap-1.5 leading-none" title="Location">
                      <MapPin className="size-3.5 shrink-0 text-[#4E7564]" />
                      <span className="truncate max-w-[190px] sm:max-w-none">{displayLocation}</span>
                    </div>
                  </>
                )}

                {memberSince && (
                  <>
                    <span className="text-[#B5CCC1] select-none hidden sm:inline" aria-hidden="true">•</span>
                    <div className="inline-flex items-center gap-1.5 leading-none" title="Member since">
                      <Calendar className="size-3.5 shrink-0 text-[#4E7564]" />
                      <span>Member since {memberSince}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Tagline / Motto */}
              {tagline && (
                <p className="text-xs sm:text-[13px] italic text-[#3D6352] font-normal mt-1.5 leading-relaxed">
                  &ldquo;{tagline}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      </ProfileBanner>
    </section>
  )
}
