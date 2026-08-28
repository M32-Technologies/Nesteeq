import {
  dashboardRoleLabels,
  type DashboardRole,
  type NavigationItem,
} from "@/features/dashboard/config/sidebar-navigation"

type DashboardPlaceholderPageProps = {
  role: DashboardRole
  item: NavigationItem
}

export default function DashboardPlaceholderPage({
  role,
  item,
}: DashboardPlaceholderPageProps) {
  const Icon = item.icon

  return (
    <section className="min-h-[calc(100svh-2.5rem)] rounded-xl bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-lg bg-[#EEF4FA] text-[#16477C]">
          <Icon className="size-5 stroke-[1.8]" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-[#64748B]">
            {dashboardRoleLabels[role]}
          </p>
          <h1 className="text-2xl font-semibold text-[#0F172A]">
            {item.title}
          </h1>
        </div>
      </div>

      <div className="mt-8 border-t border-[#E7EBF0] pt-6">
        <p className="max-w-xl text-sm leading-6 text-[#64748B]">
          This dashboard section is routed and ready for its main UI.
        </p>
      </div>
    </section>
  )
}
