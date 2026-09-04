import {
  Bell,
  Inbox,
} from "lucide-react"

import {
  formatDate,
  formatLabel,
} from "../../shared/components/facility-ui"

type NotificationItem = {
  id: string
  title: string
  message: string
  severity: string
  createdAt: string
}

function NotificationRow({ item }: { item: NotificationItem }) {
  return (
    <div className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#111111]">{item.title}</p>
          <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#66737F]">
            {item.message}
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-[#F3F5F7] px-2 py-1 text-[11px] font-semibold text-[#687481]">
          {formatLabel(item.severity)}
        </span>
      </div>
      <p className="mt-2 text-[12px] text-[#8793A0]">{formatDate(item.createdAt)}</p>
    </div>
  )
}

export function NotificationsPanel({
  notifications = { unread: 0, alerts: [] },
}: {
  notifications?: {
    unread: number
    alerts: NotificationItem[]
  }
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#E2E8EE] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#E2E8EE] bg-[#FBFCFD] px-4 py-4">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-[#07584F]" />
          <h2 className="text-[16px] font-semibold text-[#111111]">
            Notifications
          </h2>
        </div>
        <span className="rounded-md bg-[#FFF8EA] px-2.5 py-1 text-[12px] font-semibold text-[#946415]">
          {notifications.unread} unread
        </span>
      </div>

      {notifications.alerts.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-5 text-[13px] text-[#66737F]">
          <Inbox className="size-4 text-[#5579B8]" />
          No notifications.
        </div>
      ) : (
        <div className="divide-y divide-[#EEF2F5]">
          {notifications.alerts.map((item) => (
            <NotificationRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
