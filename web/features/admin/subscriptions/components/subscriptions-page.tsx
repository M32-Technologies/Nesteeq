import { Layers } from "lucide-react"

export default function SubscriptionsPage() {
  return (
    <div className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200/70 bg-white p-8 sm:p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#07584F]">
          <Layers className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-[#0F172A]">
          Society Active Subscriptions
        </h2>
        <p className="mt-1 text-xs text-[#64748B] max-w-md mx-auto">
          Active society subscriptions, renewal statuses, and tier allocations are displayed here.
        </p>
      </div>
    </div>
  )
}
