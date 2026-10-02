"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { ApartmentInactiveModal } from "./apartment-inactive-modal";

interface InactiveEventDetail {
  apartmentName?: string | null;
  reason?: string | null;
  apartmentId?: string | null;
}

export function GlobalApartmentInactiveListener() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState<InactiveEventDetail>({});

  const user = session?.user;
  const userRole = (user as { role?: string } | undefined)?.role;

  // Also check if current session already indicates inactive apartment
  useEffect(() => {
    const rawUser = user as {
      apartmentStatus?: string | null;
      inactiveReason?: string | null;
      apartmentName?: string | null;
    } | undefined;

    if (
      rawUser?.apartmentStatus === "inactive" &&
      userRole !== "admin" &&
      userRole !== "super_admin"
    ) {
      setModalData({
        apartmentName: rawUser.apartmentName,
        reason: rawUser.inactiveReason,
      });
      setIsOpen(true);
    }
  }, [user, userRole]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleInactiveEvent = (event: Event) => {
      const customEvent = event as CustomEvent<InactiveEventDetail>;
      const detail = customEvent.detail || {};

      // Ignore if user is admin
      if (userRole === "admin" || userRole === "super_admin") {
        return;
      }

      setModalData({
        apartmentName: detail.apartmentName,
        reason: detail.reason,
      });
      setIsOpen(true);
    };

    window.addEventListener("nesteeq:apartment_inactive", handleInactiveEvent);

    return () => {
      window.removeEventListener("nesteeq:apartment_inactive", handleInactiveEvent);
    };
  }, [userRole]);

  if (!isOpen) return null;

  return (
    <ApartmentInactiveModal
      isOpen={isOpen}
      role={userRole}
      apartmentName={modalData.apartmentName}
      reason={modalData.reason}
      onLogout={() => setIsOpen(false)}
    />
  );
}
