import CompletedJobsList from "@/features/dashboard/maintenance-technician/components/completed-jobs-list"

export default function CompletedJobsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-slate-900">
          Completed Jobs
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View history and records of successfully completed maintenance jobs.
        </p>
      </div>

      <CompletedJobsList />
    </div>
  )
}