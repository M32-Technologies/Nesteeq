"use client"

import React, { useState, useEffect } from "react"
import {
  Building2,
  Car,
  CheckCircle2,
  Circle,
  Home,
  Info,
  Layers,
  LayoutGrid,
  Leaf,
  Loader2,
  Map,
  MapPin,
  Phone,
  PhoneCall,
  Save,
  Shield,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import api from "@/lib/axios"
import type { ApartmentData } from "@/features/dashboard/settings/types"

export interface ApartmentDetailsProps {
  apartmentData: ApartmentData | null | undefined
  isLoading?: boolean
}

export function ApartmentDetails({
  apartmentData,
  isLoading = false,
}: ApartmentDetailsProps) {
  const queryClient = useQueryClient()

  // Form State
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [totalUnits, setTotalUnits] = useState("")
  const [totalFloors, setTotalFloors] = useState("")
  const [totalBlocks, setTotalBlocks] = useState("")
  const [parkingSlots, setParkingSlots] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [emergencyContact, setEmergencyContact] = useState("")

  const [isSaving, setIsSaving] = useState(false)

  // Populate form state whenever apartmentData arrives or updates
  useEffect(() => {
    if (apartmentData) {
      setName(apartmentData.name || "")
      setAddress(apartmentData.address || "")
      setCity(apartmentData.city || "")
      setState(apartmentData.state || "")
      setTotalUnits(String(apartmentData.totalUnits ?? ""))
      setTotalFloors(String(apartmentData.totalFloors ?? ""))
      setTotalBlocks(String(apartmentData.totalBlocks ?? ""))
      setParkingSlots(String(apartmentData.parkingSlots ?? ""))
      setContactNumber(apartmentData.contactNumber || "")
      setEmergencyContact(apartmentData.emergencyContact || "")
    }
  }, [apartmentData])

  // Track if changes have been made
  const isDirty = Boolean(
    apartmentData &&
      (name !== (apartmentData.name || "") ||
        address !== (apartmentData.address || "") ||
        city !== (apartmentData.city || "") ||
        state !== (apartmentData.state || "") ||
        totalUnits !== String(apartmentData.totalUnits ?? "") ||
        totalFloors !== String(apartmentData.totalFloors ?? "") ||
        totalBlocks !== String(apartmentData.totalBlocks ?? "") ||
        parkingSlots !== String(apartmentData.parkingSlots ?? "") ||
        contactNumber !== (apartmentData.contactNumber || "") ||
        emergencyContact !== (apartmentData.emergencyContact || ""))
  )

  // Reset form back to loaded values
  const handleCancel = () => {
    if (apartmentData) {
      setName(apartmentData.name || "")
      setAddress(apartmentData.address || "")
      setCity(apartmentData.city || "")
      setState(apartmentData.state || "")
      setTotalUnits(String(apartmentData.totalUnits ?? ""))
      setTotalFloors(String(apartmentData.totalFloors ?? ""))
      setTotalBlocks(String(apartmentData.totalBlocks ?? ""))
      setParkingSlots(String(apartmentData.parkingSlots ?? ""))
      setContactNumber(apartmentData.contactNumber || "")
      setEmergencyContact(apartmentData.emergencyContact || "")
    }
  }

  // Submit updated apartment details
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Apartment name is required")
      return
    }

    try {
      setIsSaving(true)

      const payload = {
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        totalUnits: totalUnits.trim(),
        totalFloors: totalFloors.trim() || undefined,
        totalBlocks: totalBlocks.trim(),
        parkingSlots: parkingSlots.trim(),
        contactNumber: contactNumber.trim(),
        emergencyContact: emergencyContact.trim() || undefined,
      }

      await api.patch("/api/v1/apartment/current", payload)

      await queryClient.invalidateQueries({
        queryKey: ["current-apartment-details"],
      })

      toast.success("Apartment details saved successfully!")
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to save apartment details"
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* ========================================================================= */}
      {/* Left Column: Apartment Details Form (approx 65% width)                     */}
      {/* ========================================================================= */}
      <div className="lg:col-span-8">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
          {/* Card Header */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#E8F2EC] text-[#0E543D] ring-1 ring-[#CCE4D7] shrink-0">
              <Building2 className="size-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#08281E] tracking-tight">
                Apartment Details
              </h2>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Update your society specifications and contact details.
              </p>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="pt-5 space-y-5">
            {/* Grid 2-columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              {/* Field 1: Society / Apartment Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="apt-name"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Society / Apartment Name <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                    <Building2 className="size-4" />
                  </span>
                  <input
                    id="apt-name"
                    type="text"
                    required
                    disabled={isLoading || isSaving}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter apartment name"
                    className="
                      w-full
                      h-10.5
                      pl-10
                      pr-3.5
                      text-sm
                      text-slate-900
                      bg-white
                      rounded-xl
                      border
                      border-slate-200
                      focus:border-[#0E543D]
                      focus:ring-2
                      focus:ring-[#0E543D]/15
                      focus:outline-none
                      transition-all
                      disabled:bg-slate-50
                      disabled:text-slate-400
                    "
                  />
                </div>
              </div>

              {/* Field 2: Street Address */}
              <div className="space-y-1.5">
                <label
                  htmlFor="apt-address"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Street Address
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                    <MapPin className="size-4" />
                  </span>
                  <input
                    id="apt-address"
                    type="text"
                    disabled={isLoading || isSaving}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter street address"
                    className="
                      w-full
                      h-10.5
                      pl-10
                      pr-3.5
                      text-sm
                      text-slate-900
                      bg-white
                      rounded-xl
                      border
                      border-slate-200
                      focus:border-[#0E543D]
                      focus:ring-2
                      focus:ring-[#0E543D]/15
                      focus:outline-none
                      transition-all
                      disabled:bg-slate-50
                      disabled:text-slate-400
                    "
                  />
                </div>
              </div>

              {/* Field 3: City */}
              <div className="space-y-1.5">
                <label
                  htmlFor="apt-city"
                  className="block text-xs font-semibold text-slate-700"
                >
                  City
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                    <MapPin className="size-4" />
                  </span>
                  <input
                    id="apt-city"
                    type="text"
                    disabled={isLoading || isSaving}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="
                      w-full
                      h-10.5
                      pl-10
                      pr-3.5
                      text-sm
                      text-slate-900
                      bg-white
                      rounded-xl
                      border
                      border-slate-200
                      focus:border-[#0E543D]
                      focus:ring-2
                      focus:ring-[#0E543D]/15
                      focus:outline-none
                      transition-all
                      disabled:bg-slate-50
                      disabled:text-slate-400
                    "
                  />
                </div>
              </div>

              {/* Field 4: State */}
              <div className="space-y-1.5">
                <label
                  htmlFor="apt-state"
                  className="block text-xs font-semibold text-slate-700"
                >
                  State
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                    <Map className="size-4" />
                  </span>
                  <input
                    id="apt-state"
                    type="text"
                    disabled={isLoading || isSaving}
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="
                      w-full
                      h-10.5
                      pl-10
                      pr-3.5
                      text-sm
                      text-slate-900
                      bg-white
                      rounded-xl
                      border
                      border-slate-200
                      focus:border-[#0E543D]
                      focus:ring-2
                      focus:ring-[#0E543D]/15
                      focus:outline-none
                      transition-all
                      disabled:bg-slate-50
                      disabled:text-slate-400
                    "
                  />
                </div>
              </div>

              {/* Field 5: Total Units */}
              <div className="space-y-1.5">
                <label
                  htmlFor="apt-units"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Total Units
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                    <Home className="size-4" />
                  </span>
                  <input
                    id="apt-units"
                    type="number"
                    min="0"
                    disabled={isLoading || isSaving}
                    value={totalUnits}
                    onChange={(e) => setTotalUnits(e.target.value)}
                    placeholder="Total units"
                    className="
                      w-full
                      h-10.5
                      pl-10
                      pr-3.5
                      text-sm
                      text-slate-900
                      bg-white
                      rounded-xl
                      border
                      border-slate-200
                      focus:border-[#0E543D]
                      focus:ring-2
                      focus:ring-[#0E543D]/15
                      focus:outline-none
                      transition-all
                      disabled:bg-slate-50
                      disabled:text-slate-400
                    "
                  />
                </div>
              </div>

              {/* Field 6: Total Floors */}
              <div className="space-y-1.5">
                <label
                  htmlFor="apt-floors"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Total Floors
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                    <Layers className="size-4" />
                  </span>
                  <input
                    id="apt-floors"
                    type="number"
                    min="0"
                    disabled={isLoading || isSaving}
                    value={totalFloors}
                    onChange={(e) => setTotalFloors(e.target.value)}
                    placeholder="Total floors"
                    className="
                      w-full
                      h-10.5
                      pl-10
                      pr-3.5
                      text-sm
                      text-slate-900
                      bg-white
                      rounded-xl
                      border
                      border-slate-200
                      focus:border-[#0E543D]
                      focus:ring-2
                      focus:ring-[#0E543D]/15
                      focus:outline-none
                      transition-all
                      disabled:bg-slate-50
                      disabled:text-slate-400
                    "
                  />
                </div>
              </div>

              {/* Field 7: Total Blocks */}
              <div className="space-y-1.5">
                <label
                  htmlFor="apt-blocks"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Total Blocks
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                    <LayoutGrid className="size-4" />
                  </span>
                  <input
                    id="apt-blocks"
                    type="number"
                    min="0"
                    disabled={isLoading || isSaving}
                    value={totalBlocks}
                    onChange={(e) => setTotalBlocks(e.target.value)}
                    placeholder="Total blocks"
                    className="
                      w-full
                      h-10.5
                      pl-10
                      pr-3.5
                      text-sm
                      text-slate-900
                      bg-white
                      rounded-xl
                      border
                      border-slate-200
                      focus:border-[#0E543D]
                      focus:ring-2
                      focus:ring-[#0E543D]/15
                      focus:outline-none
                      transition-all
                      disabled:bg-slate-50
                      disabled:text-slate-400
                    "
                  />
                </div>
              </div>

              {/* Field 8: Parking Slots */}
              <div className="space-y-1.5">
                <label
                  htmlFor="apt-parking"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Parking Slots
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                    <Car className="size-4" />
                  </span>
                  <input
                    id="apt-parking"
                    type="number"
                    min="0"
                    disabled={isLoading || isSaving}
                    value={parkingSlots}
                    onChange={(e) => setParkingSlots(e.target.value)}
                    placeholder="Parking slots"
                    className="
                      w-full
                      h-10.5
                      pl-10
                      pr-3.5
                      text-sm
                      text-slate-900
                      bg-white
                      rounded-xl
                      border
                      border-slate-200
                      focus:border-[#0E543D]
                      focus:ring-2
                      focus:ring-[#0E543D]/15
                      focus:outline-none
                      transition-all
                      disabled:bg-slate-50
                      disabled:text-slate-400
                    "
                  />
                </div>
              </div>

              {/* Field 9: Primary Desk Contact */}
              <div className="space-y-1.5">
                <label
                  htmlFor="apt-contact"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Primary Desk Contact
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                    <Phone className="size-4" />
                  </span>
                  <input
                    id="apt-contact"
                    type="tel"
                    disabled={isLoading || isSaving}
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="Primary contact"
                    className="
                      w-full
                      h-10.5
                      pl-10
                      pr-3.5
                      text-sm
                      text-slate-900
                      bg-white
                      rounded-xl
                      border
                      border-slate-200
                      focus:border-[#0E543D]
                      focus:ring-2
                      focus:ring-[#0E543D]/15
                      focus:outline-none
                      transition-all
                      disabled:bg-slate-50
                      disabled:text-slate-400
                    "
                  />
                </div>
              </div>

              {/* Field 10: Emergency Contact */}
              <div className="space-y-1.5">
                <label
                  htmlFor="apt-emergency"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Emergency Contact
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                    <PhoneCall className="size-4" />
                  </span>
                  <input
                    id="apt-emergency"
                    type="tel"
                    disabled={isLoading || isSaving}
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="e.g. +91 98765 00000"
                    className="
                      w-full
                      h-10.5
                      pl-10
                      pr-3.5
                      text-sm
                      text-slate-900
                      bg-white
                      rounded-xl
                      border
                      border-slate-200
                      focus:border-[#0E543D]
                      focus:ring-2
                      focus:ring-[#0E543D]/15
                      focus:outline-none
                      transition-all
                      disabled:bg-slate-50
                      disabled:text-slate-400
                    "
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons: Cancel and Save Changes */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancel}
                disabled={!isDirty || isSaving}
                className="
                  px-5
                  py-2.5
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50/70
                  hover:bg-slate-100
                  text-slate-700
                  text-sm
                  font-medium
                  transition-colors
                  cursor-pointer
                  disabled:opacity-50
                  disabled:pointer-events-none
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!isDirty || isSaving}
                className="
                  flex
                  items-center
                  gap-2
                  px-5
                  py-2.5
                  rounded-xl
                  bg-[#0E543D]
                  hover:bg-[#0A3D2D]
                  text-white
                  text-sm
                  font-semibold
                  shadow-xs
                  transition-all
                  cursor-pointer
                  disabled:opacity-50
                  disabled:pointer-events-none
                "
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
      </div>

      {/* ========================================================================= */}
      {/* Right Column: Apartment Information & Value Callout (approx 35% width)    */}
      {/* ========================================================================= */}
      <div className="lg:col-span-4 space-y-4">
        {/* Card 1: Apartment Information */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
          {/* Header */}
          <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100">
            <div className="flex size-9 items-center justify-center rounded-full bg-[#E8F2EC] text-[#0E543D] ring-1 ring-[#CCE4D7] shrink-0">
              <Info className="size-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#08281E] tracking-tight">
                Apartment Information
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Key details about your apartment.
              </p>
            </div>
          </div>

          {/* Key Value Items */}
          <div className="divide-y divide-slate-100 text-xs sm:text-[13px] pt-1">
            {/* 1. Registration Status */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5 text-slate-600">
                <Shield className="size-4 text-slate-400" />
                <span>Registration Status</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F2EC] text-[#0F8C5E] text-xs font-semibold">
                <CheckCircle2 className="size-3.5 fill-[#0F8C5E] text-white stroke-[2.5]" />
                <span>Registered</span>
              </div>
            </div>

            {/* 2. Account Status */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5 text-slate-600">
                <Circle className="size-4 text-slate-400" />
                <span>Account Status</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F2EC] text-[#0F8C5E] text-xs font-semibold">
                <span className="size-1.5 rounded-full bg-[#0F8C5E]" />
                <span>Active</span>
              </div>
            </div>

            {/* 3. Total Units */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5 text-slate-600">
                <Home className="size-4 text-slate-400" />
                <span>Total Units</span>
              </div>
              <span className="font-semibold text-slate-900">
                {totalUnits || apartmentData?.totalUnits || 0}
              </span>
            </div>

            {/* 4. Total Blocks */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5 text-slate-600">
                <LayoutGrid className="size-4 text-slate-400" />
                <span>Total Blocks</span>
              </div>
              <span className="font-semibold text-slate-900">
                {totalBlocks || apartmentData?.totalBlocks || 0}
              </span>
            </div>

            {/* 5. Total Floors */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5 text-slate-600">
                <Layers className="size-4 text-slate-400" />
                <span>Total Floors</span>
              </div>
              <span className="font-semibold text-slate-900">
                {totalFloors || apartmentData?.totalFloors || 0}
              </span>
            </div>

            {/* 6. Parking Slots */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5 text-slate-600">
                <Car className="size-4 text-slate-400" />
                <span>Parking Slots</span>
              </div>
              <span className="font-semibold text-slate-900">
                {parkingSlots || apartmentData?.parkingSlots || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Better Communities Brighter Tomorrows Callout Card */}
        <div className="rounded-2xl border border-[#D7E6DE] bg-[#EDF4F0] p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="shrink-0 text-[#0E543D] pt-0.5">
              <Leaf className="size-9 fill-[#0E543D]/20 stroke-[1.8]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#08281E] leading-snug">
                Better Communities <br />
                Brighter Tomorrows
              </h4>
              <p className="text-xs text-[#2D5042] mt-1.5 leading-relaxed font-normal">
                Thank you for helping us create well-managed and happy communities.
              </p>
              {/* Subtle Gold/Warm Accent Bar as in design */}
              <div className="h-[2.5px] w-8 bg-[#C59B27]/80 rounded-full mt-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
