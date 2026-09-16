import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import MaintenanceJobDetails from "@/features/dashboard/maintenance-technician/components/maintenance-job-details"

type PageProps = {
  params: Promise<{
    jobId: string
  }>
}

export default async function JobDetailsPage({ params }: PageProps) {
  const { jobId } = await params

  return (
    <div className="space-y-6 p-6">
      {/* Back button & header */}
      <div className="flex flex-col gap-2">
        <Link
          href="/maintenance-technician/jobs"
          className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-[#0F5F45]"
        >
          <ArrowLeft size={14} />
          Back to Jobs
        </Link>
        <div>
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-slate-900">
            Job Details
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review complaint details, location, resident info, and assignment status.
          </p>
        </div>
      </div>

      <MaintenanceJobDetails jobId={jobId} />
    </div>
  )
}