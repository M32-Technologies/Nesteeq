"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, X } from "lucide-react";
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

export interface NotificationDrawerProps {
  /**
   * Controlled open state.
   */
  open?: boolean;
  /**
   * Controlled open state change handler.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Optional custom trigger element or render function.
   * If a function is provided, it receives { unreadCount, isOpen }.
   */
  children?:
    | React.ReactNode
    | ((props: { unreadCount: number; isOpen: boolean }) => React.ReactElement);
  /**
   * Optional URL for the "View all notifications" link or full page.
   */
  allNotificationsHref?: string;
  /**
   * Optional callback when an individual notification is clicked.
   */
  onNotificationClick?: (notification: NotificationItemType) => void;
  /**
   * Optional custom drawer title (default: "Notifications").
   */
  title?: string;
  /**
   * Custom className for the drawer container.
   */
  className?: string;
}

export function NotificationDrawer({
  open: controlledOpen,
  onOpenChange,
  children,
  allNotificationsHref,
  onNotificationClick,
  title = "Notifications",
  className,
}: NotificationDrawerProps) {
  // Handle both controlled and uncontrolled states
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  // SSR hydration safety for Portals
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  // Queries
  const { data: countData, refetch: refetchCount } = useUnreadNotificationCount();
  const {
    data: notificationsData,
    isLoading,
    isError,
    refetch: refetchNotifications,
  } = useNotifications({ page: 1, limit: 30 });

  // Mutations
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();

  const unreadCount = countData?.count ?? 0;
  const notifications = notificationsData?.notifications ?? [];

  // Refresh data when drawer opens
  useEffect(() => {
    if (isOpen) {
      refetchCount();
      refetchNotifications();
    }
  }, [isOpen, refetchCount, refetchNotifications]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Keyboard handler for Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setOpen]);

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

  const handleItemClick = (notification: NotificationItemType) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  // Drawer modal and slide-over panel
  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-drawer-heading"
          className="fixed inset-0 z-50 overflow-hidden"
        >
          {/* Subtle backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Slide-over panel */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 pointer-events-none">
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                damping: 32,
                stiffness: 320,
                mass: 0.8,
              }}
              className={cn(
                "pointer-events-auto flex h-full w-screen max-w-md flex-col bg-white shadow-2xl border-l border-slate-200 focus:outline-none",
                className
              )}
            >
              {/* Clean, airy Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 bg-white">
                <div>
                  <h2
                    id="notification-drawer-heading"
                    className="text-lg font-semibold text-slate-900 tracking-tight"
                  >
                    {title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {unreadCount > 0
                      ? `${unreadCount} unread ${unreadCount === 1 ? "notice" : "notices"}`
                      : "All caught up"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mark all as read */}
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      disabled={markAllMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      <CheckCheck className="size-3.5 text-slate-500" />
                      <span>Mark all read</span>
                    </button>
                  )}

                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close notification drawer"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Notification List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {isLoading ? (
                  <NotificationSkeleton count={4} />
                ) : isError ? (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <div className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
                      <Bell className="size-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      Unable to load notifications
                    </p>
                    <p className="mt-1 text-xs text-slate-500 max-w-[240px]">
                      Something went wrong loading your notices.
                    </p>
                    <button
                      type="button"
                      onClick={() => refetchNotifications()}
                      className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <div className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                      <Bell className="size-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      No notifications
                    </p>
                    <p className="mt-1 text-xs text-slate-500 max-w-[240px]">
                      You&apos;re all caught up. New announcements and alerts will
                      appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <NotificationItem
                      key={item._id}
                      notification={item}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDelete}
                      onClick={handleItemClick}
                      isDeleting={
                        deleteMutation.isPending &&
                        deleteMutation.variables === item._id
                      }
                    />
                  ))
                )}
              </div>

              {/* Clean Footer */}
              <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between text-xs text-slate-500 bg-white">
                <span>
                  {notifications.length} {notifications.length === 1 ? "notification" : "notifications"}
                </span>

                <div className="flex items-center gap-3">
                  {allNotificationsHref && (
                    <Link
                      href={allNotificationsHref}
                      onClick={() => setOpen(false)}
                      className="font-medium text-[#07584F] hover:underline"
                    >
                      View all page &rarr;
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  // Compute trigger node
  let triggerNode: React.ReactNode = null;
  if (typeof children === "function") {
    const rendered = children({ unreadCount, isOpen });
    if (React.isValidElement(rendered)) {
      triggerNode = React.cloneElement(
        rendered as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>,
        {
          onClick: (e: React.MouseEvent) => {
            (rendered.props as { onClick?: (e: React.MouseEvent) => void })?.onClick?.(e);
            setOpen(true);
          },
        }
      );
    }
  } else if (children) {
    if (React.isValidElement(children)) {
      triggerNode = React.cloneElement(
        children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>,
        {
          onClick: (e: React.MouseEvent) => {
            (children.props as { onClick?: (e: React.MouseEvent) => void })?.onClick?.(e);
            setOpen(true);
          },
        }
      );
    } else {
      triggerNode = (
        <span onClick={() => setOpen(true)} className="cursor-pointer">
          {children}
        </span>
      );
    }
  } else {
    triggerNode = (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
            : "Notifications"
        }
        className="group relative flex size-9.5 cursor-pointer items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07584F]/30 shadow-2xs"
      >
        <Bell className="size-4.5 transition-transform duration-200 group-hover:rotate-12" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs ring-2 ring-white animate-in zoom-in-75"
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <>
      {triggerNode}
      {mounted && createPortal(drawerContent, document.body)}
    </>
  );
}
