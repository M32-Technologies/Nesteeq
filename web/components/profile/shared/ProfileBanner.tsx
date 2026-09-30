import React from "react"
import Image from "next/image"

export interface ProfileBannerProps {
  bannerUrl?: string
  alt?: string
  className?: string
  children?: React.ReactNode
  objectPosition?: string
  gradientClassName?: string
}

export function ProfileBanner({
  bannerUrl = "/images/apartment-banner.png",
  alt = "Nesteeq Community Banner",
  className = "",
  children,
  objectPosition = "right 48%",
  gradientClassName = "",
}: ProfileBannerProps) {
  return (
    <div
      className={`
        relative
        w-full
        min-h-[185px]
        sm:min-h-[200px]
        lg:min-h-[218px]
        overflow-hidden
        rounded-2xl
        border
        border-[#DCE7E1]
        bg-gradient-to-r
        from-[#F4F8F5]
        via-[#FAFBF9]
        to-[#EFF5F1]
        shadow-xs
        ${className}
      `}
    >
      {/* Background Banner Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bannerUrl}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1400px"
          style={{ objectPosition }}
          className="object-cover transition-[object-position] duration-300"
        />

        {/* 
          Refined atmospheric wash: 
          - On desktop: solid white-backed protection for text on the left (0% - 35%),
            feathering quickly to transparent by ~65% so the apartment building on the right is 100% crisp and vibrant.
          - On mobile: soft backdrop protection across the banner to ensure readability when text stacks.
        */}
        <div
          className={`
            absolute
            inset-0
            bg-gradient-to-r
            from-white/95
            from-0%
            via-white/80
            via-35%
            via-white/20
            via-55%
            to-transparent
            to-70%
            ${gradientClassName}
          `}
        />

        {/* Subtle mobile readability shield */}
        <div className="sm:hidden absolute inset-0 bg-white/35 pointer-events-none" />
      </div>

      {/* Overlaid Dynamic Content Container */}
      <div className="relative z-10 size-full px-5 py-4.5 sm:px-7 sm:py-5.5 lg:px-8 lg:py-6 flex flex-col justify-center">
        {children}
      </div>
    </div>
  )
}
