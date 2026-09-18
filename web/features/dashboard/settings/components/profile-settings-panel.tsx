"use client"

import { useRef } from "react"
import {
  Camera,
  CheckCircle2,
  Home,
  Loader2,
  Lock,
  Mail,
  Phone,
  Save,
  Shield,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import {
  dashboardRoleLabels,
  type DashboardRole,
} from "@/features/dashboard/config/sidebar-navigation"

type UserProfile = {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
  phone?: string | null
  flatId?: string | null
  emailVerified?: boolean | null
}

type ProfileSettingsPanelProps = {
  user?: UserProfile | null
  name: string
  setName: (v: string) => void
  phone: string
  setPhone: (v: string) => void
  flatName: string
  setFlatName: (v: string) => void
  avatarUrl: string
  setAvatarUrl: (v: string) => void
  isDirty: boolean
  isSubmitting: boolean
  setIsSubmitting: (v: boolean) => void
  onSave: (e?: React.FormEvent) => Promise<void>
  sessionLoading: boolean
  displayFlat: string
}

export function ProfileSettingsPanel({
  user,
  name,
  setName,
  phone,
  setPhone,
  flatName,
  setFlatName,
  avatarUrl,
  setAvatarUrl,
  isDirty,
  isSubmitting,
  setIsSubmitting,
  onSave,
  sessionLoading,
  displayFlat,
}: ProfileSettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Role detection
  const userRole = (user?.role || "resident").toLowerCase()
  const isOwner = userRole === "owner" || userRole.includes("owner")
  const isResident = userRole === "resident" || userRole.includes("resident")

  const roleLabel = isOwner
    ? "Owner"
    : isResident
    ? "Resident"
    : dashboardRoleLabels[user?.role as DashboardRole] || "Property Manager"

  const initials = (user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  // Image Upload via Better-Auth
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image file must be under 2MB")
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const result = reader.result as string
      setAvatarUrl(result)
      try {
        setIsSubmitting(true)
        const { error } = await authClient.updateUser({
          image: result,
        })
        if (error) {
          throw new Error(error.message || "Failed to update profile photo")
        }
        toast.success("Profile photo updated successfully!")
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to upload image"
        toast.error(msg)
      } finally {
        setIsSubmitting(false)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      {/* Profile Identity Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar with Camera Upload */}
          <div className="relative group shrink-0">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F5F45] to-[#071D35] text-2xl font-bold text-white shadow-sm overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={user?.name || "Avatar"}
                  className="size-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {/* Camera Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              title="Upload photo"
              className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-white text-slate-700 shadow-md ring-1 ring-slate-200 hover:bg-slate-50 transition cursor-pointer"
            >
              <Camera className="size-3.5 text-[#0F5F45]" />
            </button>
          </div>

          {/* Identity Meta */}
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 truncate">
                {user?.name || "User"}
              </h2>

              {/* Role Badge */}
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-bold ${
                  isOwner
                    ? "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20"
                    : isResident
                    ? "bg-emerald-50 text-[#0F5F45] ring-1 ring-[#0F5F45]/20"
                    : "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                }`}
              >
                <Shield className="size-3" />
                {roleLabel}
              </span>

              {/* Verified Badge */}
              {user?.emailVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <CheckCircle2 className="size-3.5" />
                  Verified
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 truncate">
              {user?.email}
            </p>

            {/* Flat Name for Resident or Owner */}
            {displayFlat && (
              <p className="flex items-center gap-1.5 text-xs font-bold text-[#0F5F45] pt-0.5">
                <Home className="size-3.5" />
                <span>Flat: {displayFlat}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Personal Information Form Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <User className="size-4 text-[#0F5F45]" />
            Personal Details
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Update your account details and contact information.
          </p>
        </div>

        <form onSubmit={onSave} className="space-y-4 pt-1">
          {/* Name Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="user-name"
              className="block text-xs font-semibold text-slate-700"
            >
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="user-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              disabled={sessionLoading || isSubmitting}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
            />
          </div>

          {/* Email (Read-Only) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="user-email"
                className="block text-xs font-semibold text-slate-700"
              >
                Email Address
              </label>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <Lock className="size-3" />
                Authentication email
              </span>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="size-3.5" />
              </div>
              <input
                id="user-email"
                type="email"
                value={user?.email || ""}
                disabled
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 text-xs text-slate-600 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="user-phone"
              className="block text-xs font-semibold text-slate-700"
            >
              Phone Number
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Phone className="size-3.5" />
              </div>
              <input
                id="user-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                disabled={sessionLoading || isSubmitting}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
              />
            </div>
          </div>

          {/* Flat Name / Number */}
          <div className="space-y-1.5 pt-1">
            <label
              htmlFor="user-flat"
              className="block text-xs font-semibold text-slate-700"
            >
              Flat Name / Number
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Home className="size-3.5" />
              </div>
              <input
                id="user-flat"
                type="text"
                value={flatName}
                onChange={(e) => setFlatName(e.target.value)}
                placeholder="e.g. B-201, Flat 402"
                disabled={sessionLoading || isSubmitting}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Your registered flat number in the society.
            </p>
          </div>

          {/* In-Card Save Action */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!isDirty || isSubmitting}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
                isDirty && !isSubmitting
                  ? "bg-[#0F5F45] text-white hover:bg-[#0c4e38] active:scale-95 cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
