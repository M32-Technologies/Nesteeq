import MaintenanceStats from "@/features/dashboard/maintenance-technician/components/maintenance-stats"

export default function MaintenanceTechnicianPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-slate-900">
          Maintenance Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track your assigned, in-progress, and completed jobs.
        </p>
      </div>

      <MaintenanceStats />
    </div>
  )
}