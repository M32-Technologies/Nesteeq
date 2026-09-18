"use client"

import React, { useState } from "react"
import {
  ShieldAlert,
  Flame,
  HeartPulse,
  Shield,
  AlertCircle,
  PhoneCall,
  CheckCircle2,
  Clock,
  Radio,
  Send,
  X,
  Sparkles,
  Lock,
} from "lucide-react"
import { toast } from "sonner"
import {
  createResidentEmergencyAlert,
  type ResidentEmergencyAlertType,
} from "../api/alert.api"

type CategoryConfig = {
  type: ResidentEmergencyAlertType
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  themeBg: string
  themeBorder: string
  themeText: string
  activeRing: string
  quickPresets: string[]
}

const EMERGENCY_CATEGORIES: CategoryConfig[] = [
  {
    type: "SOS",
    title: "General SOS",
    subtitle: "Immediate threat or danger",
    icon: ShieldAlert,
    themeBg: "bg-red-50 text-red-600",
    themeBorder: "border-red-200",
    themeText: "text-red-700",
    activeRing: "border-red-600 ring-2 ring-red-500/20 bg-red-50/50",
    quickPresets: [
      "Immediate danger inside flat",
      "Assistance needed urgently",
      "Child / Person trapped inside",
      "Door lock jammed / cannot exit",
    ],
  },
  {
    type: "MEDICAL",
    title: "Medical",
    subtitle: "Ambulance, injury, health",
    icon: HeartPulse,
    themeBg: "bg-rose-50 text-rose-600",
    themeBorder: "border-rose-200",
    themeText: "text-rose-700",
    activeRing: "border-rose-600 ring-2 ring-rose-500/20 bg-rose-50/50",
    quickPresets: [
      "Ambulance needed immediately",
      "Elderly person fall / severe injury",
      "Severe chest pain / breathing issue",
      "Patient unconscious / unresponsive",
    ],
  },
  {
    type: "FIRE",
    title: "Fire & Gas",
    subtitle: "Smoke, fire, LPG leak",
    icon: Flame,
    themeBg: "bg-orange-50 text-orange-600",
    themeBorder: "border-orange-200",
    themeText: "text-orange-700",
    activeRing: "border-orange-600 ring-2 ring-orange-500/20 bg-orange-50/50",
    quickPresets: [
      "Smoke detected in flat / corridor",
      "Fire outbreak in kitchen or balcony",
      "Strong LPG gas leak smell detected",
      "Electrical sparking / burning smell",
    ],
  },
  {
    type: "SECURITY",
    title: "Security",
    subtitle: "Intruder, theft, threat",
    icon: Shield,
    themeBg: "bg-amber-50 text-amber-600",
    themeBorder: "border-amber-200",
    themeText: "text-amber-800",
    activeRing: "border-amber-600 ring-2 ring-amber-500/20 bg-amber-50/50",
    quickPresets: [
      "Suspicious person outside door",
      "Forced entry / attempted break-in",
      "Violent disturbance in floor corridor",
      "Theft / burglary in progress",
    ],
  },
  {
    type: "OTHER",
    title: "Other Urgent",
    subtitle: "Lift stuck, burst pipe",
    icon: AlertCircle,
    themeBg: "bg-slate-100 text-slate-700",
    themeBorder: "border-slate-200",
    themeText: "text-slate-800",
    activeRing: "border-slate-700 ring-2 ring-slate-700/20 bg-slate-50",
    quickPresets: [
      "Person trapped inside elevator / lift",
      "Severe water pipe burst / flooding",
      "Total power failure in flat",
      "Structural concern / glass breakdown",
    ],
  },
]

const SOCIETY_HOTLINES = [
  {
    name: "Main Security Gate",
    intercom: "Ext: 101",
    phone: "+91 98765 43210",
    status: "24/7 Active",
  },
  {
    name: "Society Control Room",
    intercom: "Ext: 100",
    phone: "+91 98765 43211",
    status: "CCTV & Rapid Response",
  },
]

const NATIONAL_HELPLINES = [
  { label: "Emergency", number: "112" },
  { label: "Ambulance", number: "108" },
  { label: "Fire Service", number: "101" },
  { label: "Police", number: "100" },
]

export function ResidentEmergencyPage() {
  const [selectedType, setSelectedType] =
    useState<ResidentEmergencyAlertType>("SOS")
  const [selectedPreset, setSelectedPreset] = useState<string>("")
  const [customMessage, setCustomMessage] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [lastDispatched, setLastDispatched] = useState<{
    type: ResidentEmergencyAlertType
    time: string
    message?: string
  } | null>(null)

  const activeCategory =
    EMERGENCY_CATEGORIES.find((cat) => cat.type === selectedType) ??
    EMERGENCY_CATEGORIES[0]

  const handleSelectCategory = (type: ResidentEmergencyAlertType) => {
    setSelectedType(type)
    setSelectedPreset("")
  }

  const handleSelectPreset = (preset: string) => {
    if (selectedPreset === preset) {
      setSelectedPreset("")
    } else {
      setSelectedPreset(preset)
      setCustomMessage(preset)
    }
  }

  const finalMessage = customMessage.trim() || selectedPreset

  const handleDispatch = async () => {
    setIsSubmitting(true)
    try {
      await createResidentEmergencyAlert({
        alertType: selectedType,
        message: finalMessage || undefined,
      })

      const timeString = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })

      setLastDispatched({
        type: selectedType,
        time: timeString,
        message: finalMessage || undefined,
      })

      toast.success("🚨 Alert dispatched! Security staff has been notified.")
      setIsConfirmModalOpen(false)
      setCustomMessage("")
      setSelectedPreset("")
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Could not dispatch alert. Please call the Security Gate directly."
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2.5 bg-red-600" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
              Live Emergency Dispatch Channel
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">
            Emergency / SOS Alert
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            1-tap alert sends your flat number, block, and situation directly to the Gate Security console.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <a
            href="tel:112"
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
          >
            <PhoneCall className="size-3.5" />
            <span>Call 112 (National Emergency)</span>
          </a>
        </div>
      </div>

      {/* Dispatched Notification Banner */}
      {lastDispatched && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-red-500 bg-red-50/90 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
                <Radio className="size-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    ALERT SENT
                  </span>
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    <Clock className="size-3.5 text-slate-400" />
                    Sent at {lastDispatched.time}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-1">
                  Security guards notified with your Flat location for [{lastDispatched.type}].
                </h3>
                {lastDispatched.message && (
                  <p className="text-xs font-mono text-slate-700 mt-1 bg-white/70 p-1.5 rounded-md border border-red-200 inline-block">
                    &ldquo;{lastDispatched.message}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLastDispatched(null)}
              className="self-end sm:self-center text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-red-100 transition"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Form Box (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
            {/* Step 1: Select Type */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Step 1 • What type of emergency is this?
                </h2>
                <span className="text-[11px] font-semibold text-slate-400">
                  Select 1 option
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {EMERGENCY_CATEGORIES.map((category) => {
                  const isSelected = selectedType === category.type
                  const Icon = category.icon

                  return (
                    <button
                      key={category.type}
                      type="button"
                      onClick={() => handleSelectCategory(category.type)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? category.activeRing
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                      }`}
                    >
                      <div
                        className={`flex size-8 items-center justify-center rounded-lg ${
                          isSelected ? "bg-red-600 text-white" : category.themeBg
                        }`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 mt-2">
                        {category.title}
                      </span>
                      <span className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-1">
                        {category.subtitle}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Quick Presets */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-amber-500" />
                  <span>Step 2 • Quick Situation Options (Tap to select)</span>
                </h2>
                <span className="text-[11px] text-slate-400">No typing needed</span>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {activeCategory.quickPresets.map((preset, idx) => {
                  const isPresetActive = selectedPreset === preset
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-all ${
                        isPresetActive
                          ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      {preset}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 3: Message / Notes */}
            <div className="mt-5">
              <label
                htmlFor="resident-alert-note"
                className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1"
              >
                Step 3 • Notes for Guards (Optional)
              </label>
              <textarea
                id="resident-alert-note"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="You can type extra notes or instructions here, or send immediately without typing..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 transition resize-none"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span className="flex items-center gap-1 text-slate-500">
                  <Lock className="size-3 text-slate-400" />
                  Your Flat number & phone are automatically attached.
                </span>
                <span>{customMessage.length}/500</span>
              </div>
            </div>

            {/* Dispatch Action Button */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(true)}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-3.5 text-sm font-bold text-white shadow-md hover:from-red-700 hover:to-rose-800 hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              >
                <ShieldAlert className="size-5 animate-pulse" />
                <span>DISPATCH [{activeCategory.title.toUpperCase()}] TO SECURITY</span>
              </button>
              <p className="text-center text-[11px] text-slate-400 mt-1.5">
                Security staff monitor receives an active alarm with your flat location in seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Security Contacts & Helplines (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Society Security Desk */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <PhoneCall className="size-4 text-red-600" />
              <span>Society Security Desk</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              For direct voice calls with guards on duty:
            </p>

            <div className="mt-3 space-y-2.5">
              {SOCIETY_HOTLINES.map((hotline, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{hotline.name}</p>
                    <p className="text-[11px] font-mono text-slate-500">
                      {hotline.intercom} • {hotline.status}
                    </p>
                  </div>
                  <a
                    href={`tel:${hotline.phone.replace(/[^0-9+]/g, "")}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition"
                  >
                    <PhoneCall className="size-3 text-red-600" />
                    <span>Call</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* National Helplines */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              City & National Helplines
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {NATIONAL_HELPLINES.map((h, i) => (
                <a
                  key={i}
                  href={`tel:${h.number}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 hover:border-red-300 hover:bg-red-50/40 transition group"
                >
                  <div>
                    <p className="text-[10px] text-slate-500">{h.label}</p>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-red-600">
                      {h.number}
                    </p>
                  </div>
                  <PhoneCall className="size-3.5 text-slate-400 group-hover:text-red-600 transition" />
                </a>
              ))}
            </div>
          </div>

          {/* Guidelines */}
          <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4 text-xs text-amber-900">
            <p className="font-bold flex items-center gap-1.5 text-amber-800">
              <CheckCircle2 className="size-4 text-amber-600" />
              <span>Resident Guidance</span>
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
              Triggering this alert flags your flat on the gate guards&apos; control monitors immediately. Please keep your front door accessible if safe to do so.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isSubmitting}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <ShieldAlert className="size-6 animate-pulse" />
              </div>
              <div>
                <span className="inline-flex items-center rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Confirm Broadcast
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Send {activeCategory.title} Alert?
                </h3>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              This will sound a priority alert on the gate security monitors and display your flat location for immediate response.
            </p>

            {finalMessage && (
              <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Attached Note:
                </span>
                &ldquo;{finalMessage}&rdquo;
              </div>
            )}

            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatch}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 transition"
              >
                {isSubmitting ? (
                  <>
                    <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    <span>Confirm & Send Alert</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
