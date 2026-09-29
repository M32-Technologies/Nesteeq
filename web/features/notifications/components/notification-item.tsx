"use client";

import React, { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  NotificationItem as NotificationItemType,
  NotificationSeverity,
} from "../types";

export interface NotificationItemProps {
  notification: NotificationItemType;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: NotificationItemType) => void;
  isDeleting?: boolean;
}

function getSeverityIcon(severity?: NotificationSeverity) {
  switch (severity) {
    case "critical":
    case "error":
      return <ShieldAlert className="size-4 text-rose-600" />;
    case "warning":
      return <AlertTriangle className="size-4 text-amber-600" />;
    case "success":
      return <CheckCircle2 className="size-4 text-emerald-600" />;
    case "info":
    default:
      return <Bell className="size-4 text-slate-500" />;
  }
}

function getSeverityBg(severity?: NotificationSeverity) {
  switch (severity) {
    case "critical":
    case "error":
      return "bg-rose-50 text-rose-600";
    case "warning":
      return "bg-amber-50 text-amber-600";
    case "success":
      return "bg-emerald-50 text-emerald-600";
    case "info":
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  isDeleting = false,
}: NotificationItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isUnread = !notification.readAt;

  const { relativeTime, fullDate } = React.useMemo(() => {
    if (!notification.createdAt) {
      return { relativeTime: "", fullDate: "" };
    }
    try {
      const date = new Date(notification.createdAt);
      if (isNaN(date.getTime())) return { relativeTime: "", fullDate: "" };
      return {
        relativeTime: formatDistanceToNow(date, { addSuffix: true }),
        fullDate: format(date, "MMM d, yyyy 'at' h:mm a"),
      };
    } catch {
      return { relativeTime: "", fullDate: "" };
    }
  }, [notification.createdAt]);

  const handleContainerClick = () => {
    if (isUnread) {
      onMarkAsRead(notification._id);
    }
    if (onClick) {
      onClick(notification);
    }
  };

  const handleToggleRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUnread) {
      onMarkAsRead(notification._id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification._id);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  const isLongMessage = notification.message && notification.message.length > 100;

  return (
    <div
      role="article"
      tabIndex={0}
      onClick={handleContainerClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleContainerClick();
        }
      }}
      className={cn(
        "group relative flex items-start gap-3.5 px-5 py-4 text-left transition-colors duration-150 cursor-pointer outline-none border-b border-slate-100",
        isUnread
          ? "bg-slate-50/70 hover:bg-slate-100/60"
          : "bg-white hover:bg-slate-50/60",
        isDeleting && "opacity-40 pointer-events-none"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-150 group-hover:scale-105 mt-0.5",
          getSeverityBg(notification.severity)
        )}
        aria-hidden="true"
      >
        {getSeverityIcon(notification.severity)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pr-10">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-xs leading-snug tracking-tight",
              isUnread
                ? "font-semibold text-slate-900"
                : "font-medium text-slate-700"
            )}
          >
            {notification.title}
          </p>

          {isUnread && (
            <span
              className="size-1.5 rounded-full bg-[#07584F] shrink-0"
              title="Unread notification"
              aria-label="Unread"
            />
          )}
        </div>

        <p
          className={cn(
            "mt-1 text-xs text-slate-600 leading-relaxed",
            !isExpanded && isLongMessage && "line-clamp-2"
          )}
        >
          {notification.message}
        </p>

        {isLongMessage && (
          <button
            type="button"
            onClick={handleToggleExpand}
            className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <span>{isExpanded ? "Show less" : "Read more"}</span>
            {isExpanded ? (
              <ChevronUp className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
          </button>
        )}

        {/* Footer meta info: subtle and clean */}
        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
          {relativeTime && <span title={fullDate}>{relativeTime}</span>}

          {notification.apartment && (
            <>
              <span>•</span>
              <span>Unit {notification.apartment}</span>
            </>
          )}

          {notification.type && (
            <>
              <span>•</span>
              <span className="capitalize">{notification.type.replace(/_/g, " ")}</span>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions Toolbar on hover */}
      <div className="absolute right-3.5 top-3.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isUnread && (
          <button
            type="button"
            onClick={handleToggleRead}
            aria-label="Mark as read"
            title="Mark as read"
            className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
          >
            <Check className="size-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={handleDelete}
          aria-label="Delete notification"
          title="Delete notification"
          disabled={isDeleting}
          className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-40"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
