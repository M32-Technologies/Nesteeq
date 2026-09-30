"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { notificationQueryKeys } from "../hooks/use-notifications";
import type { NotificationItem } from "../types";

export function NotificationSocketListener() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    const user = session?.user;
    if (!user?.id) {
      disconnectSocket();
      return;
    }

    const socket = getSocket({
      userId: user.id,
      apartmentId: user.apartmentId ?? null,
      role: user.role ?? null,
    });

    if (!socket.connected) {
      socket.connect();
    }

    const handleNotification = (notification: NotificationItem) => {
      // 1. Invalidate React Query cache so notification bell & list update immediately
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });

      // 2. Display toast notification
      const title = notification.title || "New Notification";
      const description = notification.message;
      const severity = (notification.severity || "info").toLowerCase();

      switch (severity) {
        case "error":
        case "critical":
          toast.error(title, { description, duration: 6000 });
          break;
        case "warning":
          toast.warning(title, { description, duration: 5000 });
          break;
        case "success":
          toast.success(title, { description, duration: 4000 });
          break;
        default:
          toast.info(title, { description, duration: 4000 });
          break;
      }
    };

    const handleEmergencyAlert = (alert: NotificationItem) => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });

      toast.error(`🚨 ${alert.title || "EMERGENCY ALERT"}`, {
        description: alert.message,
        duration: 15000,
      });
    };

    socket.on("notification", handleNotification);
    socket.on("emergency_alert", handleEmergencyAlert);

    return () => {
      socket.off("notification", handleNotification);
      socket.off("emergency_alert", handleEmergencyAlert);
    };
  }, [session?.user, queryClient]);

  return null;
}
