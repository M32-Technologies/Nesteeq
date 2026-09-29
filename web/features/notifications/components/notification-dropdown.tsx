"use client";

import React from "react";
import {
  NotificationDrawer,
  type NotificationDrawerProps,
} from "./notification-drawer";

export interface NotificationDropdownProps extends NotificationDrawerProps {
  /**
   * Legacy alignment prop from dropdown/popover (ignored in drawer).
   */
  align?: "start" | "center" | "end";
  /**
   * Legacy side offset from dropdown/popover (ignored in drawer).
   */
  sideOffset?: number;
}

/**
 * NotificationDropdown is now backed by NotificationDrawer to provide
 * a modern, comfortable slide-over experience instead of a cramped modal/popover.
 */
export function NotificationDropdown(props: NotificationDropdownProps) {
  return <NotificationDrawer {...props} />;
}
