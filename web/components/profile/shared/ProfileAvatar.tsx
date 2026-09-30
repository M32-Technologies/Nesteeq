import React from "react"
import Image from "next/image"
import { Camera, Loader2 } from "lucide-react"

export interface ProfileAvatarProps {
  name: string
  avatarUrl?: string | null
  size?: "sm" | "md" | "lg" | "xl"
  showUploadButton?: boolean
  onUploadClick?: () => void
  isLoading?: boolean
  className?: string
}

export function ProfileAvatar({
  name,
  avatarUrl,
  size = "xl",
  showUploadButton = false,
  onUploadClick,
  isLoading = false,
  className = "",
}: ProfileAvatarProps) {
  const getInitials = (str: string) => {
    if (!str || !str.trim()) return "U"
    const parts = str.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const initials = getInitials(name)

  const sizeClasses = {
    sm: "size-9 text-xs",
    md: "size-11 text-sm font-semibold",
    lg: "size-[54px] text-base font-bold",
    xl: "size-18 sm:size-20 lg:size-[88px] text-lg sm:text-xl font-extrabold",
  }

  const buttonSizeClasses = {
    sm: "size-5 -bottom-0.5 -right-0.5",
    md: "size-6.5 -bottom-0.5 -right-0.5",
    lg: "size-7.5 -bottom-1 -right-1",
    xl: "size-8 sm:size-8.5 bottom-0 right-0",
  }

  const iconSizes = {
    sm: "size-2.5",
    md: "size-3",
    lg: "size-3.5",
    xl: "size-4",
  }

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <div
        className={`
          relative
          flex
          items-center
          justify-center
          rounded-full
          overflow-hidden
          bg-gradient-to-br
          from-[#08281E]
          to-[#0F3E30]
          text-white
          tracking-wider
          ring-4
          ring-white
          shadow-lg
          select-none
          ${sizeClasses[size]}
        `}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name || "User Avatar"}
            fill
            sizes="128px"
            unoptimized
            className="object-cover size-full rounded-full"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {showUploadButton && (
        <button
          type="button"
          onClick={onUploadClick}
          disabled={isLoading}
          title="Change profile picture"
          aria-label="Change profile picture"
          className={`
            absolute
            flex
            items-center
            justify-center
            rounded-full
            bg-white
            text-[#08281E]
            shadow-md
            ring-2
            ring-[#E2E8F0]
            hover:bg-[#F8FAFC]
            hover:scale-105
            active:scale-95
            transition-all
            duration-150
            cursor-pointer
            ${buttonSizeClasses[size]}
          `}
        >
          {isLoading ? (
            <Loader2 className={`${iconSizes[size]} animate-spin text-[#08281E]`} />
          ) : (
            <Camera className={`${iconSizes[size]} text-[#08281E] stroke-[2.2]`} />
          )}
        </button>
      )}
    </div>
  )
}
