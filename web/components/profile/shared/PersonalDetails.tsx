"use client"

import React, { useEffect, useRef, useState } from "react"
import {
  Camera,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Save,
  User,
  UserRound,
} from "lucide-react"
import { ProfileAvatar } from "./ProfileAvatar"

export interface PersonalDetailsData {
  name: string
  email: string
  phone?: string
  alternatePhone?: string
  avatarUrl?: string | null
  isVerified?: boolean
}

export interface PersonalDetailsProps {
  initialData: PersonalDetailsData
  onSave: (data: {
    name: string
    phone: string
    alternatePhone?: string
  }) => Promise<void>
  onAvatarUpload?: (file: File) => Promise<void>
  isSaving?: boolean
  isUploadingAvatar?: boolean
  showAlternatePhone?: boolean
}

export function PersonalDetails({
  initialData,
  onSave,
  onAvatarUpload,
  isSaving = false,
  isUploadingAvatar = false,
  showAlternatePhone = true,
}: PersonalDetailsProps) {
  const [name, setName] = useState(initialData.name || "")
  const [phone, setPhone] = useState(initialData.phone || "")
  const [alternatePhone, setAlternatePhone] = useState(initialData.alternatePhone || "")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Keep state synchronized when initialData updates (e.g. session load)
  useEffect(() => {
    setName(initialData.name || "")
    setPhone(initialData.phone || "")
    setAlternatePhone(initialData.alternatePhone || "")
  }, [initialData.name, initialData.phone, initialData.alternatePhone])

  const isDirty =
    name.trim() !== (initialData.name || "").trim() ||
    phone.trim() !== (initialData.phone || "").trim() ||
    alternatePhone.trim() !== (initialData.alternatePhone || "").trim()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onAvatarUpload) {
      await onAvatarUpload(file)
    }
    if (e.target) {
      e.target.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await onSave({
      name: name.trim(),
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim(),
    })
  }

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-7 shadow-xs">
      {/* Hidden file upload input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Card Header */}
      <div className="flex items-center gap-3 pb-4 sm:pb-5 border-b border-[#F1F5F9] mb-5 sm:mb-6">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F0F7F3] text-[#0A3D2D] ring-1 ring-[#D8EADB]">
          <UserRound className="size-4.5 stroke-[2.2]" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Personal Details
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5">
            Update your personal information and contact details.
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
          {/* Full Name */}
          <div className="space-y-2">
            <label
              htmlFor="fullNameInput"
              className="block text-xs font-semibold text-slate-700"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center h-11 rounded-lg border border-slate-200 bg-white focus-within:border-[#093C2E] focus-within:ring-2 focus-within:ring-[#093C2E]/15 transition-all">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User className="size-4" />
              </div>
              <input
                id="fullNameInput"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full h-full rounded-lg bg-transparent pl-9.5 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Email Address (Read-only OTP-based auth) */}
          <div className="space-y-2">
            <label
              htmlFor="emailAddressInput"
              className="block text-xs font-semibold text-slate-700"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center h-11 rounded-lg border border-slate-200 bg-slate-50/80">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="size-4" />
              </div>
              <input
                id="emailAddressInput"
                type="email"
                readOnly
                disabled
                value={initialData.email || ""}
                className="w-full h-full cursor-not-allowed bg-transparent pl-9.5 pr-24 text-xs sm:text-sm text-slate-700 font-medium focus:outline-none"
              />
              {initialData.isVerified && (
                <div className="absolute right-2.5 flex items-center gap-1 rounded-md bg-[#E8F6ED] px-2 py-1 text-[11px] font-semibold text-[#0B7A4B] border border-[#C5E8D2]">
                  <CheckCircle2 className="size-3 stroke-[2.5]" />
                  <span>Verified</span>
                </div>
              )}
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label
              htmlFor="phoneNumberInput"
              className="block text-xs font-semibold text-slate-700"
            >
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center h-11 rounded-lg border border-slate-200 bg-white focus-within:border-[#093C2E] focus-within:ring-2 focus-within:ring-[#093C2E]/15 transition-all">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Phone className="size-4" />
              </div>
              <input
                id="phoneNumberInput"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className="w-full h-full rounded-lg bg-transparent pl-9.5 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Alternate Phone (rendered only when supported) */}
          {showAlternatePhone && (
            <div className="space-y-2">
              <label
                htmlFor="alternatePhoneInput"
                className="block text-xs font-semibold text-slate-700"
              >
                Alternate Phone <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative flex items-center h-11 rounded-lg border border-slate-200 bg-white focus-within:border-[#093C2E] focus-within:ring-2 focus-within:ring-[#093C2E]/15 transition-all">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="size-4" />
                </div>
                <input
                  id="alternatePhoneInput"
                  type="tel"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full h-full rounded-lg bg-transparent pl-9.5 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Profile Picture Section (Horizontal Media Row) */}
        <div className="mt-6 pt-5 border-t border-[#F1F5F9]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <ProfileAvatar
                name={initialData.name || "User"}
                avatarUrl={initialData.avatarUrl}
                size="lg"
                isLoading={isUploadingAvatar}
              />

              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800">Profile Picture</p>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">JPG, PNG or WebP. Max size 2MB.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-slate-200
                bg-white
                px-3.5
                py-2
                text-xs
                sm:text-sm
                font-semibold
                text-slate-700
                shadow-2xs
                hover:bg-slate-50
                hover:border-slate-300
                active:scale-[0.98]
                transition-all
                cursor-pointer
              "
            >
              {isUploadingAvatar ? (
                <Loader2 className="size-3.5 animate-spin text-[#093C2E]" />
              ) : (
                <Camera className="size-3.5 text-slate-600" />
              )}
              <span>Change Picture</span>
            </button>
          </div>
        </div>

        {/* Save Changes Area (Dedicated Footer) */}
        <div className="mt-6 pt-4 sm:pt-4.5 border-t border-[#F1F5F9] flex items-center justify-end">
          <button
            type="submit"
            disabled={!isDirty || isSaving}
            className={`
              inline-flex
              items-center
              justify-center
              gap-2
              w-[150px]
              h-11
              rounded-lg
              text-sm
              font-semibold
              text-white
              shadow-2xs
              transition-all
              ${
                !isDirty || isSaving
                  ? "bg-[#093C2E]/60 cursor-not-allowed opacity-80"
                  : "bg-[#093C2E] hover:bg-[#072F24] active:scale-[0.98] cursor-pointer"
              }
            `}
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin text-white" />
            ) : (
              <Save className="size-4 stroke-[2.2]" />
            )}
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  )
}
