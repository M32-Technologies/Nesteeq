import Link from "next/link"
import {
  ClipboardList,
  Wrench,
} from "lucide-react"

export function FacilityDashboardActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/facility-manager/complaints"
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#DDE5EC] bg-white px-4 text-[13px] font-semibold text-[#26313D] transition hover:border-[#07584F] hover:text-[#07584F]"
      >
        <ClipboardList className="size-4" />
        Complaints
      </Link>
      <Link
        href="/facility-manager/maintenance"
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#07584F] px-4 text-[13px] font-semibold text-white transition hover:bg-[#064C44]"
      >
        <Wrench className="size-4" />
        Maintenance
      </Link>
    </div>
  )
}
