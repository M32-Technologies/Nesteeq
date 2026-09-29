"use client"

import React, { useState, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  User,
  Mail,
  Phone,
  Home,
  Building2,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Lock,
  Save,
  Loader2,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  BadgeCheck,
} from "lucide-react"

import { authClient, useSession } from "@/lib/auth-client"
import api from "@/lib/axios"
import type { ApartmentData } from "../../settings/types"
import { resolveFlatName } from "../../settings/types"
import { useResidentDashboard } from "../hooks/use-resident-dashboard"

export function ResidentProfilePage() {
  const queryClient = useQueryClient()
  const { data: session, isPending: sessionLoading } = useSession()
  const user = session?.user

  const isInitializedRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Contextual fallback from resident dashboard hook
  const { apartmentName: hookAptName, flatUnitName: hookFlatName } = useResidentDashboard()

  const [copiedEmail, setCopiedEmail] = useState(false)

  // Real user profile fields
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [flatName, setFlatName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  // Fetch real apartment context for society name (/api/v1/apartment/current)
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

  // Populate user profile state once session data arrives
  useEffect(() => {
    if (user && !isInitializedRef.current) {
      setName(user.name || "")
      setPhone(user.phone || "")
      setAvatarUrl(user.image || "")
      setFlatName(resolveFlatName(user.flatId) || hookFlatName || "")
      isInitializedRef.current = true
    }
  }, [user, hookFlatName])

  // Role detection
  const userRole = (user?.role || "resident").toLowerCase()
  const isOwner = userRole === "owner" || userRole.includes("owner")
  const roleLabel = isOwner ? "Owner" : "Resident"

  // Track if profile changes have been made
  const originalName = user?.name || ""
  const originalPhone = user?.phone || ""
  const originalFlatName = resolveFlatName(user?.flatId) || hookFlatName || ""
  const isProfileDirty =
    name !== originalName ||
    phone !== originalPhone ||
    flatName !== originalFlatName

  // Reset form changes back to session state
  const handleResetProfile = () => {
    setName(originalName)
    setPhone(originalPhone)
    setFlatName(originalFlatName)
    toast.info("Changes reverted.")
  }

  // Copy email to clipboard helper
  const handleCopyEmail = () => {
    if (!user?.email) return
    navigator.clipboard.writeText(user.email)
    setCopiedEmail(true)
    toast.success("Email copied to clipboard!")
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  // Image Upload via Express upload endpoint + Better-Auth URL
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file must be under 5MB")
      return
    }

    try {
      setIsUploadingPhoto(true)

      const formData = new FormData()
      formData.append("avatar", file)

      const uploadRes = await api.post("/api/v1/upload/avatar", formData)
      const imageUrl = uploadRes.data?.url

      if (!imageUrl) {
        throw new Error("Failed to get uploaded image URL")
      }

      setAvatarUrl(imageUrl)

      const { error } = await authClient.updateUser({
        image: imageUrl,
      })

      if (error) {
        throw new Error(error.message || "Failed to update profile photo")
      }

      queryClient.invalidateQueries({ queryKey: ["resident"] })
      toast.success("Profile photo updated successfully!")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image"
      toast.error(msg)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  // Save profile changes via Better-Auth
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!name.trim() || name.trim().length < 2) {
      toast.error("Please enter a valid name (at least 2 characters)")
      return
    }

    setIsSubmittingProfile(true)
    try {
      const updatePayload: {
        name: string
        phone?: string
        flatId?: string
      } = {
        name: name.trim(),
      }

      if (phone.trim()) {
        updatePayload.phone = phone.trim()
      }

      if (flatName.trim()) {
        updatePayload.flatId = flatName.trim()
      }

      const { error } = await authClient.updateUser(updatePayload)
      if (error) {
        throw new Error(error.message || "Failed to save profile changes")
      }

      queryClient.invalidateQueries({ queryKey: ["resident"] })
      toast.success("Profile details updated successfully!")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed"
      toast.error(msg)
    } finally {
      setIsSubmittingProfile(false)
    }
  }

  const displayFlat = flatName || resolveFlatName(user?.flatId) || hookFlatName || "Resident Flat"
  const societyName = apartmentData?.name || hookAptName || "Nesteeq Residential Society"
  const initials = (name || user?.name || "R")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  // Clean loading skeleton
  if (sessionLoading && !isInitializedRef.current) {
    return (
      <div className="w-full min-h-[calc(100vh-140px)] flex flex-col space-y-6 pb-14 animate-pulse">
        <div className="h-44 w-full rounded-2xl bg-slate-200" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full">
          <div className="h-20 rounded-xl bg-slate-200" />
          <div className="h-20 rounded-xl bg-slate-200" />
          <div className="h-20 rounded-xl bg-slate-200" />
          <div className="h-20 rounded-xl bg-slate-200" />
        </div>
        <div className="flex-1 w-full rounded-2xl bg-white border border-slate-200 p-6 min-h-[400px]" />
      </div>
    )
  }

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex flex-col space-y-6 pb-14">
      {/* ============================================================== */}
      {/* 1. HERO PROFILE COVER & IDENTITY CARD                          */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {/* Modern Brand Gradient Cover Backdrop */}
        <div className="relative h-36 sm:h-40 w-full bg-gradient-to-r from-[#07584F] via-[#0b6c61] to-[#043d37] p-5 sm:p-6 text-white overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-10 -right-10 size-48 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/3 size-36 rounded-full bg-teal-300/10 blur-lg pointer-events-none" />

          <div className="relative flex flex-col justify-between h-full z-10">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md text-emerald-100 ring-1 ring-white/20">
                <Sparkles className="size-3.5 text-emerald-300" />
                <span>Resident Profile Hub</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-md text-white">
                  <Building2 className="size-3.5 text-emerald-200" />
                  <span>{societyName}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/25 px-2.5 py-1 text-xs font-bold text-emerald-200 ring-1 ring-emerald-300/30">
                  <CheckCircle2 className="size-3.5 text-emerald-300" />
                  Active
                </span>
              </div>
            </div>

            <div className="hidden sm:flex justify-end items-center gap-1.5 text-xs text-emerald-100/90 font-medium">
              <ShieldCheck className="size-4 text-emerald-300" />
              <span>Verified Society Resident Account</span>
            </div>
          </div>
        </div>

        {/* Floating Identity Content Section */}
        <div className="relative px-5 sm:px-6 pb-5 pt-3 sm:pt-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            {/* Avatar & Core Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
              {/* Avatar with Camera Overlay */}
              <div className="relative group shrink-0 -mt-12 sm:-mt-14">
                <div className="relative flex size-20 sm:size-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#07584F] to-[#04332e] text-2xl sm:text-3xl font-extrabold text-white shadow-xl ring-4 ring-white overflow-hidden">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={name || user?.name || "Resident"}
                      className="size-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}

                  {/* Loading spinner overlay */}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs text-white">
                      <Loader2 className="size-5 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {/* Camera Click-to-upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  title="Upload profile picture"
                  className="absolute -bottom-1 -right-1 flex size-7 sm:size-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-md ring-1 ring-slate-200 hover:bg-[#07584F] hover:text-white transition-all cursor-pointer group-hover:scale-110 active:scale-95"
                >
                  <Camera className="size-3.5" />
                </button>
              </div>

              {/* Name & Badges */}
              <div className="space-y-1 sm:pt-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {name || user?.name || "Resident Member"}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#07584F] ring-1 ring-[#07584F]/20">
                    <BadgeCheck className="size-3.5 text-[#07584F]" />
                    {roleLabel}
                  </span>
                  {user?.emailVerified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 font-medium">
                  {user?.email && (
                    <span className="flex items-center gap-1.5 hover:text-slate-800 transition">
                      <Mail className="size-3.5 text-slate-400" />
                      <span>{user.email}</span>
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        title="Copy email"
                        className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      >
                        {copiedEmail ? (
                          <Check className="size-3 text-emerald-600" />
                        ) : (
                          <Copy className="size-3 text-slate-400 hover:text-slate-700" />
                        )}
                      </button>
                    </span>
                  )}

                  {phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3 text-slate-400" />
                      <span>{phone}</span>
                    </span>
                  )}

                  <span className="flex items-center gap-1.5 font-semibold text-[#07584F]">
                    <Home className="size-3 text-[#07584F]" />
                    <span>Unit: {displayFlat}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. TIGHT, COHESIVE METRICS STRIP (4 COMPACT CARDS)             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Residence Unit */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Allocated Unit
            </span>
            <Home className="size-3.5 text-[#07584F]" />
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-900 truncate">
            {displayFlat}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
            Society Flat Directory
          </p>
        </div>

        {/* Society Community */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Society
            </span>
            <Building2 className="size-3.5 text-blue-600" />
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-900 truncate">
            {apartmentData?.name || hookAptName || "Community"}
          </div>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
            <ShieldCheck className="size-3 text-emerald-500" />
            <span>Active Community</span>
          </p>
        </div>

        {/* Account Verification */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Security Status
            </span>
            <Shield className="size-3.5 text-emerald-600" />
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
            <span>Verified</span>
            <CheckCircle2 className="size-3.5 text-emerald-600" />
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
            Auth & KYC Cleared
          </p>
        </div>

        {/* Contact Phone */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Contact Phone
            </span>
            <Phone className="size-3.5 text-purple-600" />
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-900 truncate">
            {phone || user?.phone || "Not set"}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
            Emergency & Gate Pass
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. PROFILE PERSONAL INFORMATION & ACCOUNT CREDENTIALS FORM     */}
      {/* ============================================================== */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="size-4 text-[#07584F]" />
            <span>Personal Information & Account Credentials</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Update your registered contact information and flat identifier linked to the society ledger.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* 2-Column Responsive Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="user-name" className="block text-xs font-semibold text-slate-700">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="user-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                disabled={sessionLoading || isSubmittingProfile}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#07584F] focus:ring-2 focus:ring-[#07584F]/10 font-medium"
              />
              <p className="text-[11px] text-slate-400">
                As displayed in community invoices and receipts.
              </p>
            </div>

            {/* Email Address (Read-Only) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="user-email" className="block text-xs font-semibold text-slate-700">
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
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-xs text-slate-600 outline-none cursor-not-allowed font-medium"
                />
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  title="Copy email"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {copiedEmail ? (
                    <Check className="size-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Used for login access and digital receipts.
              </p>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label htmlFor="user-phone" className="block text-xs font-semibold text-slate-700">
                Contact Phone Number
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
                  disabled={sessionLoading || isSubmittingProfile}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#07584F] focus:ring-2 focus:ring-[#07584F]/10 font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Gate visitor and emergency calls are routed here.
              </p>
            </div>

            {/* Flat Name / Number */}
            <div className="space-y-1.5">
              <label htmlFor="user-flat" className="block text-xs font-semibold text-slate-700">
                Flat Name / Unit Number
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
                  disabled={sessionLoading || isSubmittingProfile}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#07584F] focus:ring-2 focus:ring-[#07584F]/10 font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Your assigned residence unit in {societyName}.
              </p>
            </div>
          </div>

          {/* Bottom In-Card Save Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              {isProfileDirty ? (
                <span className="text-amber-600 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="size-3.5" />
                  <span>You have unsaved changes</span>
                </span>
              ) : (
                <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  <span>All profile details up-to-date</span>
                </span>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center gap-2 w-full sm:w-auto">
              {isProfileDirty && (
                <button
                  type="button"
                  onClick={handleResetProfile}
                  className="w-full sm:w-auto rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer text-center"
                >
                  Discard
                </button>
              )}
              <button
                type="submit"
                disabled={!isProfileDirty || isSubmittingProfile}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
                  isProfileDirty && !isSubmittingProfile
                    ? "bg-[#07584F] text-white hover:bg-[#064C44] active:scale-95 cursor-pointer"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                }`}
              >
                {isSubmittingProfile ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResidentProfilePage
