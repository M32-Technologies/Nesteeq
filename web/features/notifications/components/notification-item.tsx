import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationItem as NotificationItemType, NotificationSeverity } from "../types";

interface NotificationItemProps {
  notification: NotificationItemType;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: NotificationItemType) => void;
  isDeleting?: boolean;
}

function getSeverityIcon(severity?: NotificationSeverity) {
  switch (severity) {
    case "success":
      return <CheckCircle2 className="size-4 text-emerald-600" />;
    case "warning":
      return <AlertTriangle className="size-4 text-amber-600" />;
    case "error":
    case "critical":
      return <AlertCircle className="size-4 text-rose-600" />;
    case "info":
    default:
      return <Info className="size-4 text-[#07584F]" />;
  }
}

function getSeverityBadgeBg(severity?: NotificationSeverity) {
  switch (severity) {
    case "success":
      return "bg-emerald-50 border-emerald-100";
    case "warning":
      return "bg-amber-50 border-amber-100";
    case "error":
    case "critical":
      return "bg-rose-50 border-rose-100";
    case "info":
    default:
      return "bg-[#E7F0ED] border-[#D1E2DB]";
  }
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  isDeleting = false,
}: NotificationItemProps) {
  const isUnread = !notification.readAt;

  const formattedTime = React.useMemo(() => {
    if (!notification.createdAt) return "";
    try {
      const date = new Date(notification.createdAt);
      if (isNaN(date.getTime())) return "";
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "";
    }
  }, [notification.createdAt]);

  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead(notification._id);
    }
    if (onClick) {
      onClick(notification);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification._id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        "group relative flex items-start gap-3 p-3.5 text-left transition-colors duration-150 cursor-pointer outline-none focus-visible:bg-slate-50",
        isUnread
          ? "bg-slate-50/70 hover:bg-slate-100/70"
          : "bg-white hover:bg-slate-50/70",
        isDeleting && "opacity-50 pointer-events-none"
      )}
    >
      {/* Icon / Severity representation */}
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full border shadow-2xs transition-transform group-hover:scale-105",
          getSeverityBadgeBg(notification.severity)
        )}
        aria-hidden="true"
      >
        {getSeverityIcon(notification.severity)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pr-6">
        <div className="flex items-start justify-between gap-1">
          <p
            className={cn(
              "text-xs leading-snug line-clamp-1",
              isUnread
                ? "font-semibold text-slate-900"
                : "font-medium text-slate-700"
            )}
          >
            {notification.title}
          </p>
        </div>

        <p className="mt-0.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>

        <div className="mt-1.5 flex items-center gap-2">
          {formattedTime && (
            <span className="text-[11px] text-slate-400 font-normal">
              {formattedTime}
            </span>
          )}

          {isUnread && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#07584F]">
              <span className="size-1.5 rounded-full bg-[#07584F]" />
              Unread
            </span>
          )}
        </div>
      </div>

      {/* Actions: Delete Button */}
      <div className="absolute right-3 top-3 flex items-center">
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Delete notification"
          title="Delete notification"
          disabled={isDeleting}
          className="flex size-6 cursor-pointer items-center justify-center rounded-md text-slate-400 opacity-0 transition-all hover:bg-slate-200/60 hover:text-slate-700 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
