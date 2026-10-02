"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertOctagon,
  Building2,
  HelpCircle,
  Loader2,
  LogOut,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { normalizeDashboardRole } from "@/features/dashboard/config/sidebar-navigation";

export interface ApartmentInactiveModalProps {
  isOpen: boolean;
  role?: string | null;
  apartmentName?: string | null;
  reason?: string | null;
  onLogout?: () => void;
}

export function ApartmentInactiveModal({
  isOpen,
  role,
  apartmentName,
  reason,
  onLogout,
}: ApartmentInactiveModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const normalizedRole = normalizeDashboardRole(role);
  const isManager = normalizedRole === "property_manager";

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    startTransition(async () => {
      try {
        await authClient.signOut();
      } catch {
        // Continue with redirect even if signOut API fails
      }
      if (onLogout) {
        onLogout();
      }
      router.replace("/login");
      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="inactive-modal-title"
        aria-describedby="inactive-modal-description"
      >
        {/* Backdrop (solid blur preventing dashboard interaction) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[500px] overflow-hidden rounded-[24px] border border-rose-200/80 bg-white shadow-2xl"
        >
          {/* Top Decorative Alert Stripe */}
          <div className="h-2 w-full bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

          <div className="p-6 sm:p-8">
            {/* Header Icon + Badge */}
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 shadow-xs">
                {isManager ? (
                  <ShieldAlert className="h-6 w-6 stroke-[2]" />
                ) : (
                  <AlertOctagon className="h-6 w-6 stroke-[2]" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                  Inactive Apartment
                </span>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2 mb-6">
              <h2
                id="inactive-modal-title"
                className="text-[22px] font-bold tracking-tight text-slate-900"
              >
                {isManager
                  ? "Apartment Temporarily Deactivated"
                  : "Platform Access Restricted"}
              </h2>

              <p
                id="inactive-modal-description"
                className="text-[13px] leading-relaxed text-slate-600"
              >
                {isManager
                  ? "Your apartment community has been temporarily deactivated by the Nesteeq platform administrator. Resident and staff access is currently suspended."
                  : "Your apartment community is currently inactive. Access to features and resident portals is temporarily restricted."}
              </p>
            </div>

            {/* Context Box */}
            <div className="mb-6 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 space-y-3">
              {apartmentName && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="truncate">{apartmentName}</span>
                </div>
              )}

              {/* Role-Specific Content */}
              {isManager ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-slate-700">
                    <span className="font-semibold text-slate-900 shrink-0">
                      Reason:
                    </span>
                    <span className="text-slate-700 italic">
                      {reason || "Subscription inactive or administrative review."}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 leading-normal">
                    Note: All member records, bills, flat structures, and community data remain intact and will be restored immediately upon reactivation.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs">
                  <p className="font-semibold text-slate-800">
                    Please contact your Property Manager
                  </p>
                  <p className="text-[12px] text-slate-600 leading-normal">
                    For details regarding reactivation or community status, please get in touch with your building administrator or society committee.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isPending}
                className="w-full flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:opacity-60 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span>Sign Out &amp; Return to Login</span>
              </button>

              {isManager && (
                <a
                  href="mailto:support@nesteeq.com?subject=Reactivate%20Apartment%20Inquiry"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span>Contact Support</span>
                </a>
              )}
            </div>

            {/* Trust Footer Note */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Need help? Visit support or contact your management team.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
