"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ShieldCheck,
  Mail,
  Phone,
  Camera,
  Trash2,
  Lock,
  Save,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  User,
  Shield,
  Clock,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  X,
  Send,
} from "lucide-react"
import { format, isValid } from "date-fns"
import { toast } from "sonner"

import { authClient, useSession } from "@/lib/auth-client"
import api from "@/lib/axios"

function formatDate(dateValue?: string | Date | null): string {
  if (!dateValue) return "—"
  try {
    const d = typeof dateValue === "string" ? new Date(dateValue) : dateValue
    if (!isValid(d)) return "—"
    return format(d, "dd MMMM yyyy")
  } catch {
    return "—"
  }
}

function getInitials(name?: string | null): string {
  if (!name) return "SA"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const { data: session, isPending: isSessionLoading } = useSession()
  const user = session?.user

  // Form Fields - directly editable
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Loading States
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  // Password Section Visibility (Collapsed by default as requested)
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false)

  // Password Fields
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // Forgot Password / Reset Link State
  const [isSendingResetLink, setIsSendingResetLink] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  // Copied UID Feedback
  const [copiedId, setCopiedId] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync session details when session loads or updates
  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setPhone((user as { phone?: string }).phone || "")
      setAvatarUrl(user.image || null)
    }
  }, [user])

  // Track if personal details have changed
  const isProfileDirty = useMemo(() => {
    if (!user) return false
    const originalName = user.name || ""
    const originalPhone = (user as { phone?: string }).phone || ""
    return name.trim() !== originalName.trim() || phone.trim() !== originalPhone.trim()
  }, [user, name, phone])

  const handleCopyId = () => {
    if (!user?.id) return
    navigator.clipboard.writeText(user.id)
    setCopiedId(true)
    toast.success("Account ID copied to clipboard")
    setTimeout(() => setCopiedId(false), 2000)
  }

  // Handle Photo Upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image (PNG, JPG, WEBP).")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB.")
      return
    }

    try {
      setIsUploadingPhoto(true)
      const formData = new FormData()
      formData.append("avatar", file)

      const uploadRes = await api.post("/api/v1/upload/avatar", formData)
      const imageUrl = uploadRes.data?.url

      if (!imageUrl) {
        throw new Error("Unable to obtain image URL from upload service.")
      }

      setAvatarUrl(imageUrl)

      const { error } = await authClient.updateUser({
        image: imageUrl,
      })

      if (error) {
        throw new Error(error.message || "Failed to link photo with BetterAuth profile.")
      }

      toast.success("Profile photo updated successfully!")
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload photo"
      toast.error(msg)
    } finally {
      setIsUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Handle Remove Photo
  const handleRemovePhoto = async () => {
    if (!avatarUrl) return
    try {
      setIsUploadingPhoto(true)
      const { error } = await authClient.updateUser({
        image: "",
      })

      if (error) {
        throw new Error(error.message || "Failed to remove photo.")
      }

      setAvatarUrl(null)
      toast.success("Profile photo removed.")
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove photo"
      toast.error(msg)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  // Handle Saving Profile Info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Full name cannot be blank.")
      return
    }

    try {
      setIsSavingProfile(true)
      const payload: { name: string; phone?: string } = {
        name: name.trim(),
        phone: phone.trim(),
      }

      const { error } = await authClient.updateUser(payload)

      if (error) {
        throw new Error(error.message || "Failed to update profile details.")
      }

      toast.success("Profile details updated successfully!")
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile"
      toast.error(msg)
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Handle Password Change (when current password is known)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword) {
      toast.error("Please enter your current password.")
      return
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.")
      return
    }

    try {
      setIsUpdatingPassword(true)
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })

      if (error) {
        throw new Error(error.message || "Failed to change password.")
      }

      toast.success("Password updated successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setIsPasswordSectionOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password"
      toast.error(msg)
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  // Handle Forgot Current Password -> Send Reset Link to Admin Email
  const handleSendResetEmail = async () => {
    if (!user?.email) {
      toast.error("No registered email found for this administrator account.")
      return
    }

    try {
      setIsSendingResetLink(true)
      const { error } = await authClient.forgetPassword.emailOtp({
        email: user.email,
      })

      if (error) {
        throw new Error(error.message || "Failed to send reset email.")
      }

      toast.success(`Password reset instructions have been sent to ${user.email}`)
      setShowForgotModal(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email"
      toast.error(msg)
    } finally {
      setIsSendingResetLink(false)
    }
  }

  const initials = getInitials(name || user?.name)

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* Hidden File Input for Avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      {/* Main 2-Column Executive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN (4 cols): The Admin Identity Card             */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
            {/* Avatar & Core Identity */}
            <div className="flex flex-col items-center text-center">
              <div className="relative group">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#07584F] text-white text-2xl font-bold shadow-md ring-4 ring-[#EAF5EE] overflow-hidden">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={name || "Admin"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                {isUploadingPhoto ? (
                  <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto || isSessionLoading}
                    title="Change profile picture"
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-xl bg-white text-[#07584F] shadow-md border border-slate-200 hover:bg-[#EAF5EE] hover:border-emerald-300 transition cursor-pointer"
                  >
                    <Camera className="h-3.5 w-3.5 text-[#07584F]" />
                  </button>
                )}
              </div>

              <h2 className="mt-3.5 text-base font-bold text-[#0F172A] tracking-tight">
                {isSessionLoading ? (
                  <span className="inline-block h-5 w-28 bg-slate-100 rounded animate-pulse" />
                ) : (
                  name || user?.name || "Super Admin"
                )}
              </h2>

              <p className="text-xs text-[#64748B] truncate max-w-[240px] mt-0.5">
                {user?.email || "—"}
              </p>

              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF5EE] border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-[#07584F]">
                  <ShieldCheck className="h-3 w-3 text-[#07584F]" />
                  <span>Super Admin</span>
                </span>

                {user?.emailVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    <span>Verified</span>
                  </span>
                )}
              </div>

              {/* Photo management buttons */}
              <div className="mt-3.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto || isSessionLoading}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Change Photo
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isUploadingPhoto || isSessionLoading}
                    className="rounded-lg px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Account Metadata List */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Platform Role</span>
                <span className="font-semibold text-[#0F172A] capitalize">
                  {user?.role || "Admin"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Scope</span>
                <span className="font-semibold text-[#07584F]">
                  Global Network
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Session</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Authenticated
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Member Since</span>
                <span className="font-semibold text-[#0F172A]">
                  {formatDate(user?.createdAt)}
                </span>
              </div>
            </div>

            {/* User UID with Copy */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Account UID
              </span>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-700 border border-slate-200/70">
                <span className="truncate mr-2 max-w-[190px]">
                  {user?.id || "—"}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer shrink-0"
                  title="Copy UID"
                >
                  {copiedId ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN (8 cols): Interactive Edit & Security Forms   */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Personal Details (Directly Editable Form) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0F172A] tracking-tight">
                  Personal Details
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Update your display name and contact phone number.
                </p>
              </div>

              {isProfileDirty && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md animate-in fade-in">
                  Unsaved changes
                </span>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-name"
                    className="block text-xs font-semibold text-[#0F172A]"
                  >
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="admin-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    disabled={isSessionLoading || isSavingProfile}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#07584F] focus:outline-none focus:ring-1 focus:ring-[#07584F]/10 transition"
                  />
                </div>

                {/* Contact Phone */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-phone"
                    className="block text-xs font-semibold text-[#0F172A]"
                  >
                    Phone Number
                  </label>
                  <input
                    id="admin-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    disabled={isSessionLoading || isSavingProfile}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#07584F] focus:outline-none focus:ring-1 focus:ring-[#07584F]/10 transition"
                  />
                </div>
              </div>

              {/* Email Address (Primary Login - Read Only) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="admin-email"
                    className="block text-xs font-semibold text-[#0F172A]"
                  >
                    Email Address
                  </label>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                    <Lock className="h-3 w-3" />
                    Primary login identity
                  </span>
                </div>
                <input
                  id="admin-email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-xs text-slate-500 cursor-not-allowed outline-none"
                />
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                {isProfileDirty && (
                  <button
                    type="button"
                    onClick={() => {
                      if (user) {
                        setName(user.name || "")
                        setPhone((user as { phone?: string }).phone || "")
                      }
                    }}
                    disabled={isSavingProfile}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition cursor-pointer"
                  >
                    Reset
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSavingProfile || isSessionLoading || !isProfileDirty}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#07584F] px-4 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#064C44] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingProfile ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span>{isSavingProfile ? "Saving changes..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Account Security (Collapsed by default, opens on "Change Password") */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#07584F]">
                  <KeyRound className="h-4 w-4 text-[#07584F]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0F172A] tracking-tight">
                    Account Security
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Manage your administrative password and login credentials.
                  </p>
                </div>
              </div>

              {!isPasswordSectionOpen && (
                <button
                  type="button"
                  onClick={() => setIsPasswordSectionOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] shadow-2xs hover:bg-slate-50 transition cursor-pointer"
                >
                  <KeyRound className="h-3.5 w-3.5 text-[#07584F]" />
                  <span>Change Password</span>
                </button>
              )}
            </div>

            {/* Collapsed State: Clean summary banner */}
            {!isPasswordSectionOpen ? (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#0F172A]">Password</p>
                  <p className="text-[11px] text-[#64748B] font-mono tracking-wider">
                    ••••••••••••••••
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPasswordSectionOpen(true)}
                  className="text-xs font-semibold text-[#07584F] hover:underline cursor-pointer"
                >
                  Update
                </button>
              </div>
            ) : (
              /* Expanded State: Password Form with "Forgot Password" helper */
              <form onSubmit={handleChangePassword} className="space-y-4 animate-in fade-in duration-200">
                {/* Current Password Field + Forgot Password Action */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="pw-current"
                      className="block text-xs font-semibold text-[#0F172A]"
                    >
                      Current Password <span className="text-rose-500">*</span>
                    </label>

                    {/* Forgot Current Password link */}
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] font-semibold text-[#07584F] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <HelpCircle className="h-3 w-3" />
                      <span>Forgot current password?</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      id="pw-current"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      disabled={isUpdatingPassword}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-10 text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#07584F] focus:outline-none focus:ring-1 focus:ring-[#07584F]/10 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password & Confirmation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="pw-new"
                      className="block text-xs font-semibold text-[#0F172A]"
                    >
                      New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="pw-new"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        disabled={isUpdatingPassword}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-10 text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#07584F] focus:outline-none focus:ring-1 focus:ring-[#07584F]/10 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="pw-confirm"
                      className="block text-xs font-semibold text-[#0F172A]"
                    >
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="pw-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      disabled={isUpdatingPassword}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#07584F] focus:outline-none focus:ring-1 focus:ring-[#07584F]/10 transition"
                    />
                  </div>
                </div>

                {/* Action Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPasswordSectionOpen(false)
                      setCurrentPassword("")
                      setNewPassword("")
                      setConfirmPassword("")
                    }}
                    disabled={isUpdatingPassword}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isUpdatingPassword || !currentPassword || !newPassword}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#1E293B] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingPassword ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <KeyRound className="h-3.5 w-3.5" />
                    )}
                    <span>{isUpdatingPassword ? "Updating..." : "Update Password"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Reset Modal / Dialog */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#07584F] border border-emerald-200/80">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">
                    Forgot Current Password?
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Send a password reset link to your email
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              If you don&apos;t remember your current password, BetterAuth will send a secure password reset link to your registered administrator email:
            </p>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 font-mono text-xs text-[#0F172A] font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#07584F] shrink-0 font-sans" />
              <span className="truncate">{user?.email}</span>
            </div>

            <p className="text-[11px] text-slate-400">
              Clicking below will send instructions to set a new password without needing your old password.
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                disabled={isSendingResetLink}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendResetEmail}
                disabled={isSendingResetLink}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#07584F] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#064C44] transition cursor-pointer disabled:opacity-50"
              >
                {isSendingResetLink ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>{isSendingResetLink ? "Sending link..." : "Send Reset Email"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
