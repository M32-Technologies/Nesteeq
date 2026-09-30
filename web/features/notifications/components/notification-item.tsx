"use client";

import React, { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Megaphone,
  ShieldAlert,
  Trash2,
  UserCheck,
  Wrench,
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

function getNotificationCategory(type?: string, severity?: string) {
  const normType = (type || "").toUpperCase();
  const normSev = (severity || "").toLowerCase();

  const isEmergency =
    normType.includes("EMERGENCY") ||
    normSev.includes("error") ||
    normSev.includes("critical") ||
    normSev.includes("urgent");

  if (isEmergency) {
    return {
      label: "Emergency Alert",
      variant: "emergency" as const,
      icon: <ShieldAlert className="size-4.5 text-white" />,
      iconBg: "bg-rose-600 text-white shadow-xs shadow-rose-200",
      badgeBg: "bg-rose-50 text-rose-700 ring-1 ring-rose-300 font-semibold",
      unreadDotBg: "bg-rose-600 ring-2 ring-rose-200 animate-pulse",
      accentBorder: "border-l-4 border-l-rose-600",
      cardBgUnread: "bg-rose-50/50 hover:bg-rose-50/70",
    };
  }

  if (normType.includes("ANNOUNCE") || normType === "GENERAL") {
    return {
      label: "Announcement",
      variant: "announcement" as const,
      icon: <Megaphone className="size-4.5 text-[#07584F]" />,
      iconBg: "bg-emerald-50 text-[#07584F] ring-1 ring-emerald-200 shadow-2xs",
      badgeBg: "bg-emerald-50 text-[#07584F] ring-1 ring-emerald-200 font-medium",
      unreadDotBg: "bg-[#07584F] ring-2 ring-emerald-100",
      accentBorder: "border-l-4 border-l-[#07584F]",
      cardBgUnread: "bg-emerald-50/20 hover:bg-emerald-50/40",
    };
  }

  if (normType.includes("COMPLAINT")) {
    return {
      label: "Complaint",
      variant: "complaint" as const,
      icon: <AlertCircle className="size-4.5 text-amber-600" />,
      iconBg: "bg-amber-50 text-amber-600 ring-1 ring-amber-200 shadow-2xs",
      badgeBg: "bg-amber-50 text-amber-800 ring-1 ring-amber-200 font-medium",
      unreadDotBg: "bg-amber-500 ring-2 ring-amber-100",
      accentBorder: "border-l-4 border-l-amber-500",
      cardBgUnread: "bg-amber-50/20 hover:bg-amber-50/40",
    };
  }

  if (
    normType.includes("RESIDENT") ||
    normType.includes("STAFF") ||
    normType.includes("INVITE")
  ) {
    return {
      label: "Member Update",
      variant: "member" as const,
      icon: <UserCheck className="size-4.5 text-blue-600" />,
      iconBg: "bg-blue-50 text-blue-600 ring-1 ring-blue-200 shadow-2xs",
      badgeBg: "bg-blue-50 text-blue-800 ring-1 ring-blue-200 font-medium",
      unreadDotBg: "bg-blue-500 ring-2 ring-blue-100",
      accentBorder: "border-l-4 border-l-blue-500",
      cardBgUnread: "bg-blue-50/20 hover:bg-blue-50/40",
    };
  }

  if (
    normType.includes("MAINTENANCE") ||
    normType.includes("WORK") ||
    normType.includes("TASK") ||
    normType.includes("SCHEDULE")
  ) {
    return {
      label: "Maintenance",
      variant: "maintenance" as const,
      icon: <Wrench className="size-4.5 text-purple-600" />,
      iconBg: "bg-purple-50 text-purple-600 ring-1 ring-purple-200 shadow-2xs",
      badgeBg: "bg-purple-50 text-purple-800 ring-1 ring-purple-200 font-medium",
      unreadDotBg: "bg-purple-500 ring-2 ring-purple-100",
      accentBorder: "border-l-4 border-l-purple-500",
      cardBgUnread: "bg-purple-50/20 hover:bg-purple-50/40",
    };
  }

  return {
    label: "Notice",
    variant: "default" as const,
    icon: <Bell className="size-4.5 text-slate-600" />,
    iconBg: "bg-slate-100 text-slate-600 ring-1 ring-slate-200 shadow-2xs",
    badgeBg: "bg-slate-100 text-slate-700 ring-1 ring-slate-200 font-medium",
    unreadDotBg: "bg-slate-500 ring-2 ring-slate-100",
    accentBorder: "border-l-4 border-l-slate-300",
    cardBgUnread: "bg-slate-50/70 hover:bg-slate-100/70",
  };
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

  const category = getNotificationCategory(
    notification.type,
    notification.severity
  );
  const isEmergency = category.variant === "emergency";

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

  const isLongMessage =
    notification.message && notification.message.length > 120;

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
        "group relative flex items-start gap-3.5 px-5 py-4 text-left transition-all duration-150 cursor-pointer outline-none border-b border-slate-100",
        category.accentBorder,
        isUnread
          ? category.cardBgUnread
          : "bg-white hover:bg-slate-50/60",
        isDeleting && "opacity-40 pointer-events-none"
      )}
    >
      {/* Category Icon */}
      <div
        className={cn(
          "flex size-9.5 shrink-0 items-center justify-center rounded-xl transition-transform duration-150 group-hover:scale-105 mt-0.5",
          category.iconBg
        )}
        aria-hidden="true"
      >
        {category.icon}
      </div>

      {/* Content Area */}
      <div className="min-w-0 flex-1 pr-7">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={cn(
              "text-xs leading-snug tracking-tight",
              isUnread
                ? isEmergency
                  ? "font-bold text-rose-950"
                  : "font-semibold text-slate-900"
                : "font-medium text-slate-700"
            )}
          >
            {notification.title}
          </p>

          {isUnread && (
            <span
              className={cn("size-2 rounded-full shrink-0", category.unreadDotBg)}
              title="Unread notification"
              aria-label="Unread"
            />
          )}
        </div>

        {/* Message with newline handling */}
        <p
          className={cn(
            "mt-1 text-xs text-slate-600 leading-relaxed whitespace-pre-line break-words",
            !isExpanded && isLongMessage && "line-clamp-2"
          )}
        >
          {notification.message}
        </p>

        {isLongMessage && (
          <button
            type="button"
            onClick={handleToggleExpand}
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#07584F] hover:text-[#06423B] transition-colors"
          >
            <span>{isExpanded ? "Show less" : "Read more"}</span>
            {isExpanded ? (
              <ChevronUp className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
          </button>
        )}

        {/* Clean Meta Footer without raw ObjectId */}
        <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
              category.badgeBg
            )}
          >
            {isEmergency && (
              <span className="size-1.5 rounded-full bg-rose-600 animate-ping" />
            )}
            {category.label}
          </span>

          {relativeTime && (
            <>
              <span className="text-slate-300">•</span>
              <span
                title={fullDate}
                className="inline-flex items-center gap-1 text-slate-400"
              >
                <Clock className="size-3" />
                <span>{relativeTime}</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Hover Quick Actions */}
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
