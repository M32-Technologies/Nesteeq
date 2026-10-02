"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient, useSession } from "@/lib/auth-client";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { notificationQueryKeys } from "../hooks/use-notifications";
import type { NotificationItem, UnreadNotificationCountResponse } from "../types";

/**
 * Listens for real-time Socket.IO notification events:
 * 1. Automatically connects and joins user, apartment, and role rooms.
 * 2. When an SOS or emergency alert arrives:
 *    - Updates the Security UI instantly without page refresh (alerts table, summary cards, activity).
 *    - Increments the unread notification badge count in cache.
 *    - Displays a direct toast notification showing the emergency and flat details.
 * 3. When a user is suspended / force logged out by an admin:
 *    - Immediately disconnects socket, revokes local auth session, and redirects to /login.
 */
export function NotificationSocketListener() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const handledIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const user = session?.user;
    if (!user?.id) {
      disconnectSocket();
      return;
    }

    const handleForceLogout = async (data?: {
      reason?: string;
      banned?: boolean;
    }) => {
      disconnectSocket();

      const reason =
        data?.reason ||
        "Your account has been suspended by an administrator. Please contact support.";

      toast.error("Account Suspended", {
        id: "account-suspended",
        description: reason,
        duration: 10000,
      });

      try {
        await authClient.signOut();
      } catch (err) {
        console.error("Error signing out during forced logout:", err);
      }

      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
    };

    // If session already marks user as banned, force logout immediately
    if ((user as { banned?: boolean })?.banned) {
      handleForceLogout({
        reason: "Your account has been suspended by an administrator.",
      });
      return;
    }

    const socketAuth = {
      userId: user.id,
      apartmentId: user.apartmentId ?? null,
      role: user.role ?? null,
    };

    const socket = getSocket(socketAuth);

    const joinRooms = () => {
      socket.emit("join", socketAuth);
    };

    if (!socket.connected) {
      socket.connect();
    } else {
      joinRooms();
    }

    socket.on("connect", joinRooms);

    const userRole = (user.role || "").toLowerCase().replace(/[\s-]+/g, "_");
    const isSecurity = userRole === "security_staff";

    const handleIncomingNotification = (notification: NotificationItem) => {
      const notifId =
        notification?.relatedResourceId ||
        notification?._id ||
        notification?.title ||
        "";

      // Robust deduplication: prevent duplicate processing for the same alert within 5 seconds
      if (notifId) {
        if (handledIdsRef.current.has(notifId)) {
          return;
        }
        handledIdsRef.current.add(notifId);
        setTimeout(() => {
          handledIdsRef.current.delete(notifId);
        }, 5000);
      }

      const normType = (notification?.type || "").toUpperCase();
      const isEmergency =
        normType.includes("EMERGENCY") ||
        normType.includes("SOS") ||
        (notification?.severity || "").toUpperCase() === "ERROR";

      // 1. Immediately update unread count in cache (single increment)
      queryClient.setQueryData<UnreadNotificationCountResponse>(
        notificationQueryKeys.unreadCount(),
        (old) => ({ count: (old?.count ?? 0) + 1 })
      );

      // 2. Invalidate all notification queries to fetch latest list
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });

      // 3. Invalidate feeds across views
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      queryClient.invalidateQueries({ queryKey: ["resident", "announcements"] });
      queryClient.invalidateQueries({ queryKey: ["resident", "dashboard"] });

      // 4. Update Security UI without refreshing
      if (isEmergency) {
        queryClient.invalidateQueries({ queryKey: ["security-alerts"] });
        queryClient.invalidateQueries({ queryKey: ["security", "summary"] });
        queryClient.invalidateQueries({ queryKey: ["security", "activity"] });
        queryClient.invalidateQueries({ queryKey: ["resident", "alerts"] });

        // Show single emergency alert toast to security with explicit id to guarantee no duplicates
        if (isSecurity) {
          toast.error(notification.title || "New Emergency Alert", {
            id: `sos-${notifId || "alert"}`,
            description: notification.message,
            duration: 8000,
          });
        }
      }
    };

    const handleSosAlert = () => {
      // Invalidate security queries instantly so tables/counters update without page refresh
      queryClient.invalidateQueries({ queryKey: ["security-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["security", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["security", "activity"] });
    };

    const handleSosAlertUpdated = () => {
      // Invalidate queries without refresh when alert status changes
      queryClient.invalidateQueries({ queryKey: ["security-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["security", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["security", "activity"] });
      queryClient.invalidateQueries({ queryKey: ["resident", "alerts"] });
    };

    const handleApartmentDeactivated = (data: {
      apartmentId?: string;
      status?: string;
      reason?: string;
      apartmentName?: string;
    }) => {
      if (userRole === "admin" || userRole === "super_admin") {
        return;
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("nesteeq:apartment_inactive", {
            detail: {
              apartmentName: data?.apartmentName,
              reason: data?.reason,
              apartmentId: data?.apartmentId,
            },
          })
        );
      }
    };

    const handleApartmentStatusChanged = (data: {
      apartmentId?: string;
      status?: string;
      reason?: string;
      apartmentName?: string;
    }) => {
      if (data?.status === "inactive") {
        handleApartmentDeactivated(data);
      }
    };

    // Tab visibility fallback: check if user session was revoked while tab was hidden
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        try {
          const { data: currentSession } = await authClient.getSession();
          if (!currentSession?.user) {
            if (user?.id) {
              handleForceLogout({
                reason: "Your session has ended. Please log in again.",
              });
            }
          } else if ((currentSession.user as { banned?: boolean })?.banned) {
            handleForceLogout({
              reason: "Your account has been suspended by an administrator.",
            });
          }
        } catch {
          // ignore transient network check errors
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    socket.on("notification", handleIncomingNotification);
    socket.on("sos_alert", handleSosAlert);
    socket.on("sos_alert_updated", handleSosAlertUpdated);
    socket.on("apartment_deactivated", handleApartmentDeactivated);
    socket.on("apartment:status_changed", handleApartmentStatusChanged);
    socket.on("user:force_logout", handleForceLogout);
    socket.on("user_banned", handleForceLogout);

    return () => {
      socket.off("connect", joinRooms);
      socket.off("notification", handleIncomingNotification);
      socket.off("sos_alert", handleSosAlert);
      socket.off("sos_alert_updated", handleSosAlertUpdated);
      socket.off("apartment_deactivated", handleApartmentDeactivated);
      socket.off("apartment:status_changed", handleApartmentStatusChanged);
      socket.off("user:force_logout", handleForceLogout);
      socket.off("user_banned", handleForceLogout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session?.user, queryClient]);

  return null;
}


