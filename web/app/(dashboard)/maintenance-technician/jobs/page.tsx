import AssignedJobsList from "@/features/dashboard/maintenance-technician/components/assigned-jobs-list"

export default function AssignedJobsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-slate-900">
          Assigned Jobs
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage and track maintenance jobs assigned to you.
        </p>
      </div>

      <AssignedJobsList />
    </div>
  )
}