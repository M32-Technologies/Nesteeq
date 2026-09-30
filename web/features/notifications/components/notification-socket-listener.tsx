"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { notificationQueryKeys } from "../hooks/use-notifications";
import { EmergencyAlertModal } from "./emergency-alert-modal";
import type { NotificationItem } from "../types";

/**
 * Listens for real-time Socket.IO notification events:
 * 1. For regular notifications: Updates the unread badge count and notification list
 *    quietly in real-time (NO toasters).
 * 2. For emergency broadcasts: Immediately displays the prominent EmergencyAlertModal.
 */
export function NotificationSocketListener() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [activeEmergency, setActiveEmergency] = useState<NotificationItem | null>(null);
  const lastEmergencyIdRef = useRef<string | null>(null);

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

    const isEmergency = (item: NotificationItem) => {
      const type = (item.type || "").toUpperCase();
      const sev = (item.severity || "").toUpperCase();
      return (
        type.includes("EMERGENCY") ||
        sev === "ERROR" ||
        sev === "CRITICAL" ||
        sev === "URGENT"
      );
    };

    const triggerEmergencyModal = (alert: NotificationItem) => {
      // Refresh queries for real-time unread count and announcement feeds
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });

      const alertId = alert._id || alert.relatedResourceId || alert.title;
      if (lastEmergencyIdRef.current === alertId) {
        return;
      }
      lastEmergencyIdRef.current = alertId;

      // Reset deduplication lock after 4 seconds
      setTimeout(() => {
        if (lastEmergencyIdRef.current === alertId) {
          lastEmergencyIdRef.current = null;
        }
      }, 4000);

      // Display dedicated Emergency Modal Dialog (No toaster)
      setActiveEmergency(alert);
    };

    const handleNotification = (notification: NotificationItem) => {
      // 1. Invalidate cache so bell icon unread count and notification drawer update quietly
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });

      // 2. If it's an emergency notification, pop the emergency modal
      if (isEmergency(notification)) {
        triggerEmergencyModal(notification);
      }
      // 3. Normal notifications: NO toaster popup per design requirement
    };

    const handleEmergencyAlert = (alert: NotificationItem) => {
      triggerEmergencyModal(alert);
    };

    socket.on("notification", handleNotification);
    socket.on("emergency_alert", handleEmergencyAlert);

    return () => {
      socket.off("notification", handleNotification);
      socket.off("emergency_alert", handleEmergencyAlert);
    };
  }, [session?.user, queryClient]);

  return (
    <EmergencyAlertModal
      emergency={activeEmergency}
      onClose={() => setActiveEmergency(null)}
      userRole={session?.user?.role}
    />
  );
}
