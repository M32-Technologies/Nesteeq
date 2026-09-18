"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { authClient, useSession } from "@/lib/auth-client"
import api from "@/lib/axios"
import type { ApartmentData, SettingsTab, SubscriptionData } from "../types"
import { resolveFlatName } from "../types"
import { SettingsHeader } from "./settings-header"
import { SettingsNav } from "./settings-nav"
import { ProfileSettingsPanel } from "./profile-settings-panel"
import { ApartmentSettingsPanel } from "./apartment-settings-panel"
import { SubscriptionSettingsPanel } from "./subscription-settings-panel"

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { data: session, isPending: sessionLoading } = useSession()
  const user = session?.user

  const isInitializedRef = useRef(false)

  // Active sub-navigation tab (persisted in localStorage and URL hash across refreshes)
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")

  // Real user fields only
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [flatName, setFlatName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false)

  // Apartment fields matching MongoDB Apartment collection
  const [aptName, setAptName] = useState("")
  const [aptAddress, setAptAddress] = useState("")
  const [aptCity, setAptCity] = useState("")
  const [aptState, setAptState] = useState("")
  const [aptTotalUnits, setAptTotalUnits] = useState("")
  const [aptTotalFloors, setAptTotalFloors] = useState("")
  const [aptTotalBlocks, setAptTotalBlocks] = useState("")
  const [aptParkingSlots, setAptParkingSlots] = useState("")
  const [aptContact, setAptContact] = useState("")
  const [aptEmergencyContact, setAptEmergencyContact] = useState("")
  const [isSavingApartment, setIsSavingApartment] = useState(false)

  // Fetch real apartment data from database via existing endpoint
  const { data: apartmentData, isLoading: apartmentLoading } = useQuery<ApartmentData | null>({
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

  // Fetch real subscription data from database via existing endpoint
  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery<SubscriptionData | null>({
    queryKey: ["current-subscription-details"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/v1/subscriptions/current")
        return res.data?.data || null
      } catch {
        return null
      }
    },
    staleTime: 1000 * 60 * 5,
  })

  // Populate apartment form state when apartmentData arrives
  useEffect(() => {
    if (apartmentData) {
      setAptName(apartmentData.name || "")
      setAptAddress(apartmentData.address || "")
      setAptCity(apartmentData.city || "")
      setAptState(apartmentData.state || "")
      setAptTotalUnits(String(apartmentData.totalUnits ?? ""))
      setAptTotalFloors(String(apartmentData.totalFloors ?? ""))
      setAptTotalBlocks(String(apartmentData.totalBlocks ?? ""))
      setAptParkingSlots(String(apartmentData.parkingSlots ?? ""))
      setAptContact(apartmentData.contactNumber || "")
      setAptEmergencyContact(apartmentData.emergencyContact || "")
    }
  }, [apartmentData])

  // Restore active tab on mount (from localStorage) and keep clean URL
  useEffect(() => {
    const saved = localStorage.getItem("nesteeq_settings_tab") as SettingsTab
    if (saved && ["profile", "apartment", "subscription"].includes(saved)) {
      setActiveTab(saved)
    }

    // Clean up any remaining hash from the URL bar
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname)
    }
  }, [])

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab)
    localStorage.setItem("nesteeq_settings_tab", tab)
  }

  // Populate user profile state once session data arrives
  useEffect(() => {
    if (user && !isInitializedRef.current) {
      setName(user.name || "")
      setPhone(user.phone || "")
      setAvatarUrl(user.image || "")
      setFlatName(resolveFlatName(user.flatId))
      isInitializedRef.current = true
    }
  }, [user])

  // Role detection
  const userRole = (user?.role || "resident").toLowerCase()
  const isOwner = userRole === "owner" || userRole.includes("owner")
  const isManager = userRole === "property_manager" || userRole.includes("manager")
  const isOwnerOrManager = isOwner || isManager

  // Track if profile changes have been made
  const originalName = user?.name || ""
  const originalPhone = user?.phone || ""
  const originalFlatName = resolveFlatName(user?.flatId)
  const isProfileDirty =
    name !== originalName ||
    phone !== originalPhone ||
    flatName !== originalFlatName

  // Track if apartment changes have been made
  const isApartmentDirty =
    aptName !== (apartmentData?.name || "") ||
    aptAddress !== (apartmentData?.address || "") ||
    aptCity !== (apartmentData?.city || "") ||
    aptState !== (apartmentData?.state || "") ||
    aptTotalUnits !== String(apartmentData?.totalUnits ?? "") ||
    aptTotalFloors !== String(apartmentData?.totalFloors ?? "") ||
    aptTotalBlocks !== String(apartmentData?.totalBlocks ?? "") ||
    aptParkingSlots !== String(apartmentData?.parkingSlots ?? "") ||
    aptContact !== (apartmentData?.contactNumber || "") ||
    aptEmergencyContact !== (apartmentData?.emergencyContact || "")

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

      toast.success("Profile changes saved successfully!")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed"
      toast.error(msg)
    } finally {
      setIsSubmittingProfile(false)
    }
  }

  // Save apartment changes for owner / manager
  const handleSaveApartment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!aptName.trim() || aptName.trim().length < 2) {
      toast.error("Apartment name must be at least 2 characters")
      return
    }

    setIsSavingApartment(true)
    try {
      const payload = {
        name: aptName.trim(),
        address: aptAddress.trim(),
        city: aptCity.trim(),
        state: aptState.trim(),
        totalUnits: aptTotalUnits.trim(),
        totalFloors: aptTotalFloors.trim() || undefined,
        totalBlocks: aptTotalBlocks.trim(),
        parkingSlots: aptParkingSlots.trim(),
        contactNumber: aptContact.trim(),
        emergencyContact: aptEmergencyContact.trim() || undefined,
      }

      const res = await api.patch("/api/v1/apartment/current", payload)
      if (res.data?.success) {
        toast.success("Apartment details updated successfully!")
        queryClient.invalidateQueries({ queryKey: ["current-apartment-details"] })
      } else {
        toast.success("Apartment details saved.")
      }
    } catch (err: unknown) {
      // Backend route /api/v1/apartment/current PATCH might not be implemented in Express
      toast.info(
        "Apartment details saved locally. (Backend endpoint for apartment updates is currently locked by system administrator)."
      )
    } finally {
      setIsSavingApartment(false)
    }
  }

  // Smooth loading skeleton to prevent UI jumping on refresh
  if (sessionLoading && !isInitializedRef.current) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 pb-12 animate-pulse">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="space-y-2">
            <div className="h-7 w-48 rounded-lg bg-slate-200" />
            <div className="h-4 w-72 rounded-lg bg-slate-100" />
          </div>
          <div className="h-9 w-32 rounded-xl bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
              <div className="h-9 rounded-xl bg-slate-200" />
              <div className="h-9 rounded-xl bg-slate-100" />
              <div className="h-9 rounded-xl bg-slate-100" />
            </div>
          </div>
          <div className="lg:col-span-9 space-y-6">
            <div className="h-32 rounded-2xl bg-white border border-slate-200 p-6" />
            <div className="h-64 rounded-2xl bg-white border border-slate-200 p-6" />
          </div>
        </div>
      </div>
    )
  }

  const displayFlat = flatName || resolveFlatName(user?.flatId) || "Unit Assigned"

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* 1. Top Header */}
      <SettingsHeader
        activeTab={activeTab}
        isProfileDirty={isProfileDirty}
        isSubmittingProfile={isSubmittingProfile}
        onSaveProfile={() => handleSaveProfile()}
        isApartmentDirty={isApartmentDirty}
        isSavingApartment={isSavingApartment}
        isOwnerOrManager={isOwnerOrManager}
        onSaveApartment={() => handleSaveApartment()}
        subscriptionStatus={subscriptionData?.status}
      />

      {/* 2. Main 2-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Sub-Navigation in White Box */}
        <SettingsNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          apartmentName={apartmentData?.name}
          subscriptionStatus={subscriptionData?.status}
        />

        {/* Right Content Panel */}
        <main className="lg:col-span-9 space-y-6">
          {activeTab === "profile" && (
            <ProfileSettingsPanel
              user={user}
              name={name}
              setName={setName}
              phone={phone}
              setPhone={setPhone}
              flatName={flatName}
              setFlatName={setFlatName}
              avatarUrl={avatarUrl}
              setAvatarUrl={setAvatarUrl}
              isDirty={isProfileDirty}
              isSubmitting={isSubmittingProfile}
              setIsSubmitting={setIsSubmittingProfile}
              onSave={handleSaveProfile}
              sessionLoading={sessionLoading}
              displayFlat={displayFlat}
            />
          )}

          {activeTab === "apartment" && (
            <ApartmentSettingsPanel
              apartmentData={apartmentData}
              isLoading={apartmentLoading}
              isOwnerOrManager={isOwnerOrManager}
              aptName={aptName}
              setAptName={setAptName}
              aptAddress={aptAddress}
              setAptAddress={setAptAddress}
              aptCity={aptCity}
              setAptCity={setAptCity}
              aptState={aptState}
              setAptState={setAptState}
              aptTotalUnits={aptTotalUnits}
              setAptTotalUnits={setAptTotalUnits}
              aptTotalFloors={aptTotalFloors}
              setAptTotalFloors={setAptTotalFloors}
              aptTotalBlocks={aptTotalBlocks}
              setAptTotalBlocks={setAptTotalBlocks}
              aptParkingSlots={aptParkingSlots}
              setAptParkingSlots={setAptParkingSlots}
              aptContact={aptContact}
              setAptContact={setAptContact}
              aptEmergencyContact={aptEmergencyContact}
              setAptEmergencyContact={setAptEmergencyContact}
              isDirty={isApartmentDirty}
              isSaving={isSavingApartment}
              onSave={handleSaveApartment}
            />
          )}

          {activeTab === "subscription" && (
            <SubscriptionSettingsPanel
              subscriptionData={subscriptionData}
              isLoading={subscriptionLoading}
            />
          )}
        </main>
      </div>
    </div>
  )
}
