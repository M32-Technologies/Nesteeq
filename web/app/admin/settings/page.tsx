"use client"

import { useState } from "react"
import { Settings, Shield, Bell, Globe, Save } from "lucide-react"
import { toast } from "sonner"

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState("Nesteeq")
  const [supportEmail, setSupportEmail] = useState("support@nesteeq.com")
  const [currency, setCurrency] = useState("INR")
  const [requireMFA, setRequireMFA] = useState(true)
  const [sessionTimeout, setSessionTimeout] = useState("24")

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Settings saved successfully.")
  }

  return (
    <div className="w-full">
      {/* Header Actions */}
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl bg-[#07584F] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#064C44]"
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-6 max-w-4xl">
        {/* General Settings */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#059669]">
              <Globe className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A]">General Configuration</h2>
              <p className="text-xs text-[#64748B]">Global brand naming and primary communication email.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">
                Platform Brand Name
              </label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-[#07584F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">
                Primary Support Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-[#07584F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-[#07584F] focus:outline-none"
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="AED">AED (د.إ) - UAE Dirham</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & Access */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0D9488]">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A]">Security & Session Governance</h2>
              <p className="text-xs text-[#64748B]">Manage administrative session timeouts and multi-factor enforcement.</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-[#0F172A]">Require Two-Factor Authentication</p>
                <p className="text-[11px] text-[#64748B]">Enforce 2FA for all Super Admin and Property Manager accounts</p>
              </div>
              <input
                type="checkbox"
                checked={requireMFA}
                onChange={(e) => setRequireMFA(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#07584F] focus:ring-[#07584F]"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-semibold text-[#0F172A]">Admin Session Idle Timeout</p>
                <p className="text-[11px] text-[#64748B]">Automatically sign out inactive administrative sessions</p>
              </div>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-[#0F172A] focus:border-[#07584F] focus:outline-none"
              >
                <option value="8">8 Hours</option>
                <option value="24">24 Hours</option>
                <option value="72">3 Days</option>
                <option value="168">7 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
