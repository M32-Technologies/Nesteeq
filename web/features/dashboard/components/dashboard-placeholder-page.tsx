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
    <section className="min-h-[calc(100svh-5rem)] rounded-2xl bg-white p-8" style={{ boxShadow: 'var(--shadow-sm)' }}>

      {/* Page header */}
      <div className="flex items-start gap-4">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'var(--soft-teal)' }}
        >
          <Icon className="size-[22px] stroke-[1.8]" style={{ color: 'var(--teal)' }} />
        </div>

        <div className="min-w-0">
          <p
            className="text-[12px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: 'var(--text-muted)' }}
          >
            {dashboardRoleLabels[role]}
          </p>
          <h1 className="text-[22px] font-bold leading-tight" style={{ color: 'var(--ink)' }}>
            {item.title}
          </h1>
        </div>

        {/* Coming soon badge */}
        <span
          className="ml-auto shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
          style={{ background: 'var(--soft-amber)', color: 'var(--amber)' }}
        >
          Coming soon
        </span>
      </div>

      {/* Divider */}
      <div className="mt-7 border-t" style={{ borderColor: 'var(--border-soft)' }} />

      {/* Body */}
      <div className="mt-7 max-w-lg">
        <p className="text-[14px] leading-7" style={{ color: 'var(--text)' }}>
          The <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{item.title}</strong> section
          is on the roadmap and will be available soon. All routing and authentication
          for this page is already in place.
        </p>

        {/* Feature preview list */}
        <ul className="mt-6 space-y-3">
          {[
            'Full data management interface',
            'Filters, sorting and search',
            'Export and reporting tools',
          ].map((feat) => (
            <li key={feat} className="flex items-center gap-3">
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full"
                style={{ background: 'var(--soft-teal)' }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M2 5.5L4 7.5L8 3" stroke="#0F766E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{feat}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
