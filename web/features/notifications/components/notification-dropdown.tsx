"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useDeleteNotification,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationCount,
} from "../hooks/use-notifications";
import { NotificationItem } from "./notification-item";
import { NotificationSkeleton } from "./notification-skeleton";
import type { NotificationItem as NotificationItemType } from "../types";

export interface NotificationDropdownProps {
  /**
   * Optional custom trigger element or render function.
   * If a function is provided, it receives { unreadCount, isOpen }.
   * If not provided, the standard AMS navbar bell icon with dynamic badge will be used.
   */
  children?:
    | React.ReactNode
    | ((props: { unreadCount: number; isOpen: boolean }) => React.ReactElement);
  /**
   * Alignment of the dropdown relative to the trigger.
   * Default: "end"
   */
  align?: "start" | "center" | "end";
  /**
   * Offset from trigger in pixels.
   * Default: 8
   */
  sideOffset?: number;
  /**
   * Optional URL for the "View all notifications" link.
   */
  allNotificationsHref?: string;
  /**
   * Optional callback when an individual notification is clicked.
   */
  onNotificationClick?: (notification: NotificationItemType) => void;
  /**
   * Custom className for PopoverContent
   */
  className?: string;
}

export function NotificationDropdown({
  children,
  align = "end",
  sideOffset = 8,
  allNotificationsHref,
  onNotificationClick,
  className,
}: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);

  // Queries
  const {
    data: countData,
    refetch: refetchCount,
  } = useUnreadNotificationCount();

  const {
    data: notificationsData,
    isLoading,
    isError,
    refetch: refetchNotifications,
    isRefetching,
  } = useNotifications({ page: 1, limit: 10 });

  // Mutations
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();

  const unreadCount = countData?.count ?? 0;
  const notifications = notificationsData?.notifications ?? [];

  // When dropdown opens, refetch queries to ensure latest state
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      refetchCount();
      refetchNotifications();
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0 || markAllMutation.isPending) return;
    markAllMutation.mutate();
  };

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      {/* Trigger: Use custom children (element or function) or render default navbar notification bell */}
      {typeof children === "function" ? (
        <PopoverTrigger render={children({ unreadCount, isOpen: open })} />
      ) : children ? (
        <PopoverTrigger render={children as React.ReactElement} />
      ) : (
        <PopoverTrigger
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"
          }
          className="relative flex size-9 cursor-pointer items-center justify-center rounded-lg text-[#475569] transition-colors duration-150 hover:bg-[#F1F5F9] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        >
          <Bell className="size-[18px]" />
          {unreadCount > 0 && (
            <span
              className="absolute right-[9px] top-[9px] size-[7px] rounded-full bg-red-500 ring-[1.5px] ring-white"
              aria-hidden="true"
            />
          )}
        </PopoverTrigger>
      )}

      <PopoverContent
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "w-[360px] sm:w-[390px] max-w-[calc(100vw-24px)] rounded-2xl border border-slate-200/80 bg-white p-0 shadow-xl overflow-hidden text-slate-800",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-white">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Notifications
            </h3>
            {unreadCount > 0 ? (
              <span className="inline-flex items-center rounded-full bg-[#E7F0ED] px-2 py-0.5 text-[11px] font-semibold text-[#07584F]">
                {unreadCount} unread
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">
                All caught up
              </span>
            )}
          </div>

          {/* Mark all as read */}
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || markAllMutation.isPending}
            className="flex items-center gap-1 text-xs font-medium text-[#07584F] transition-colors hover:text-[#064C44] disabled:cursor-not-allowed disabled:opacity-40"
            title="Mark all notifications as read"
          >
            <CheckCheck className="size-3.5" />
            <span>Mark all as read</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
          {isLoading ? (
            <NotificationSkeleton count={4} />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-2">
                <Bell className="size-5" />
              </div>
              <p className="text-xs font-semibold text-slate-900">
                Unable to load notifications
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Something went wrong. Please try again.
              </p>
              <button
                type="button"
                onClick={() => refetchNotifications()}
                disabled={isRefetching}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition"
              >
                <RefreshCw
                  className={cn("size-3", isRefetching && "animate-spin")}
                />
                <span>Try again</span>
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2.5">
                <Bell className="size-5 text-slate-400" />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                No notifications
              </p>
              <p className="mt-1 text-xs text-slate-400">
                You&apos;re all caught up.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <NotificationItem
                key={item._id}
                notification={item}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onClick={onNotificationClick}
                isDeleting={
                  deleteMutation.isPending &&
                  deleteMutation.variables === item._id
                }
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-2.5 text-center">
          {allNotificationsHref ? (
            <Link
              href={allNotificationsHref}
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-[#07584F] hover:text-[#064C44] transition-colors py-1 px-3 rounded-lg hover:bg-slate-100/70"
            >
              <span>View all notifications</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1 px-3 rounded-lg hover:bg-slate-100/70 cursor-pointer"
            >
              <span>Close</span>
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
