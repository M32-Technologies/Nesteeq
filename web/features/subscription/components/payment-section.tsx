"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CreditCard,
  Loader2,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import type { CreatedApartment } from "@/features/onboarding/api/apartment.api";
import type { SubscriptionPlan } from "../subscription.types";
import {
  promoteCurrentUserToPropertyManager,
  refreshAuthSessionFromDatabase,
  useCreateSubscription,
  useVerifySubscriptionPayment,
} from "../subscription.query";

type PaymentSectionProps = {
  apartment: CreatedApartment;
  plan: SubscriptionPlan;
  user: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: {
    description?: string;
    reason?: string;
  };
};

type RazorpayCheckout = {
  open: () => void;
  on: (
    event: "payment.failed",
    callback: (response: RazorpayFailureResponse) => void,
  ) => void;
};

type RazorpayPaymentInstrument = {
  method: string;
  banks?: string[];
  wallets?: string[];
  issuers?: string[];
  types?: string[];
  apps?: string[];
};

type RazorpayOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  image?: string;
  prefill: {
    name?: string | null;
    email?: string | null;
    contact?: string | null;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  config?: {
    display: {
      blocks: Record<
        string,
        {
          name: string;
          instruments: RazorpayPaymentInstrument[];
        }
      >;
      sequence: string[];
      preferences: {
        show_default_blocks: boolean;
      };
    };
  };
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  modal: {
    ondismiss: () => void;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayCheckout;
  }
}

const GST_RATE = 0.18;

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const getDurationLabel = (durationMonths: number) => {
  if (durationMonths === 1) return "Monthly";
  if (durationMonths === 12) return "Yearly";

  return `${durationMonths} months`;
};

const loadRazorpayCheckout = () => {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Razorpay can only be loaded in the browser."));
      return;
    }

    if (window.Razorpay) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Unable to load Razorpay checkout.")),
        {
          once: true,
        },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      reject(new Error("Unable to load Razorpay checkout."));
    };

    document.body.appendChild(script);
  });
};

export default function PaymentSection({
  apartment,
  plan,
  user,
}: PaymentSectionProps) {
  const router = useRouter();
  const createSubscriptionMutation = useCreateSubscription();
  const verifyPaymentMutation = useVerifySubscriptionPayment();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const priceSummary = useMemo(() => {
    const total = plan.price;
    const beforeTax = total / (1 + GST_RATE);
    const tax = total - beforeTax;

    return {
      beforeTax,
      tax,
      total,
    };
  }, [plan.price]);

  const isProcessing =
    isCheckoutOpen ||
    createSubscriptionMutation.isPending ||
    verifyPaymentMutation.isPending;

  const completeVerifiedPayment = async (
    response: RazorpaySuccessResponse,
  ) => {
    try {
      await verifyPaymentMutation.mutateAsync(response);
      await promoteCurrentUserToPropertyManager();
      await refreshAuthSessionFromDatabase();

      toast.success("Payment verified. Welcome to your dashboard.");
      router.push("/property-manager");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Payment was captured, but verification could not finish.",
      );
    } finally {
      setIsCheckoutOpen(false);
    }
  };

  const startPayment = async () => {
    try {
      setIsCheckoutOpen(true);
      await loadRazorpayCheckout();
      await refreshAuthSessionFromDatabase();

      const subscription = await createSubscriptionMutation.mutateAsync(
        plan._id,
      );

      if (!subscription.razorpayKeyId) {
        throw new Error("Razorpay key is not configured.");
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout is not available.");
      }

      const checkout = new window.Razorpay({
        key: subscription.razorpayKeyId,
        subscription_id: subscription.subscriptionId,
        name: "Nesteeq",
        description: `${plan.planName} subscription`,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone ?? apartment.contactNumber,
        },
        notes: {
          apartmentId: apartment.id,
          apartmentName: apartment.name,
          planId: plan._id,
        },
        theme: {
          color: "#07584F",
        },
        config: {
          display: {
            blocks: {
              testbanking: {
                name: "Test mode banking",
                instruments: [
                  {
                    method: "upi",
                  },
                  {
                    method: "netbanking",
                  },
                  {
                    method: "card",
                  },
                  {
                    method: "wallet",
                  },
                  {
                    method: "paylater",
                  },
                ],
              },
            },
            sequence: [
              "block.testbanking",
              "upi",
              "netbanking",
              "card",
              "wallet",
              "paylater",
            ],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        handler: (response) => {
          void completeVerifiedPayment(response);
        },
        modal: {
          ondismiss: () => {
            setIsCheckoutOpen(false);
          },
        },
      });

      checkout.on("payment.failed", (response) => {
        setIsCheckoutOpen(false);
        toast.error(
          response.error?.description ||
            response.error?.reason ||
            "Payment failed. Please try again.",
        );
      });

      checkout.open();
    } catch (error) {
      setIsCheckoutOpen(false);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to start payment.",
      );
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto mb-6 flex w-fit items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#07584F] text-sm font-bold text-white shadow-sm">
          N
        </span>

        <span className="text-[22px] font-semibold tracking-[-0.03em] text-[#111111]">
          Nesteeq
        </span>
      </div>

      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#dce7e3] bg-[#f7faf8] px-3.5 py-1.5 shadow-xs">
          <ShieldCheck className="size-3.5 text-[#07584F]" strokeWidth={2.25} />
          <span className="text-xs font-semibold text-[#07584F]">
            Secure checkout
          </span>
        </div>

        <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-[#111111] sm:text-[34px]">
          Review and activate
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#68746f]">
          Confirm your community registration and subscription plan to unlock your management dashboard.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          {/* Plan Summary Card */}
          <section className="rounded-2xl border border-[#dfe6e2] bg-white p-6 shadow-[0_16px_40px_rgba(7,88,79,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center rounded-full bg-[#e7f0ed] px-2.5 py-1 text-xs font-semibold text-[#07584F]">
                  {getDurationLabel(plan.durationMonths)}
                </span>

                <h2 className="mt-2.5 text-[24px] font-semibold tracking-[-0.03em] text-[#043B35]">
                  {plan.planName}
                </h2>

                {plan.freeTrial.enabled && (
                  <p className="mt-1 text-xs font-medium text-[#56625d]">
                    Includes {plan.freeTrial.days}-day complimentary trial
                  </p>
                )}
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e7f0ed] text-[#07584F]">
                <ReceiptText className="h-5 w-5" />
              </div>
            </div>

            <div className="my-5 h-px bg-[#eef2f0]" />

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Included with this plan
              </p>

              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {plan.features.slice(0, 6).map((feature) => (
                  <div
                    key={feature}
                    className="flex min-h-10 items-center gap-2.5 rounded-xl border border-[#eef2f0] bg-[#f8faf9] px-3.5 py-2"
                  >
                    <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#eaf3ef] text-[#07584F]">
                      <Check className="size-2.5" strokeWidth={3} />
                    </div>

                    <span className="text-xs font-medium leading-relaxed text-[#56625d]">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Registration Details Card */}
          <section className="rounded-2xl border border-[#dfe6e2] bg-white p-6 shadow-[0_16px_40px_rgba(7,88,79,0.06)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e7f0ed] text-[#07584F]">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-[#111111]">
                  Apartment registration
                </h2>

                <p className="text-xs text-slate-500">
                  Manager: {user.email || "Signed-in property manager"}
                </p>
              </div>
            </div>

            <div className="my-4 h-px bg-[#eef2f0]" />

            <dl className="grid gap-2.5 sm:grid-cols-2">
              <DetailItem label="Apartment Name" value={apartment.name} />
              <DetailItem
                label="Primary Contact"
                value={apartment.contactNumber}
              />
              <DetailItem
                label="Address"
                value={`${apartment.address}, ${apartment.city}, ${apartment.state}`}
              />
              <DetailItem
                label="Structure"
                value={`${apartment.totalBlocks} blocks, ${apartment.totalUnits} units`}
              />
              <DetailItem
                label="Parking Capacity"
                value={`${apartment.parkingSlots} total slots`}
              />
              <DetailItem
                label="Emergency Contact"
                value={apartment.emergencyContact || "Not configured"}
              />
            </dl>
          </section>
        </div>

        {/* Sticky Total Sidebar */}
        <aside className="h-fit rounded-2xl border border-[#dfe6e2] bg-white p-6 shadow-[0_18px_50px_rgba(7,88,79,0.08)] lg:sticky lg:top-6">
          <div className="flex items-center justify-between gap-4 border-b border-[#eef2f0] pb-4">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#111111]">
                Payment summary
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                GST included at standard 18%
              </p>
            </div>

            <div className="flex size-9 items-center justify-center rounded-lg bg-[#e7f0ed] text-[#07584F]">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-3 py-5">
            <SummaryRow
              label="Base plan price"
              value={formatCurrency(priceSummary.beforeTax)}
            />
            <SummaryRow
              label="GST (18%)"
              value={formatCurrency(priceSummary.tax)}
            />
          </div>

          <div className="flex items-center justify-between border-t border-[#eef2f0] pt-4">
            <span className="text-base font-semibold text-[#111111]">
              Total amount
            </span>

            <span className="text-[26px] font-semibold tracking-[-0.04em] text-[#043B35]">
              {formatCurrency(priceSummary.total)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void startPayment()}
            disabled={isProcessing}
            className="mt-6 flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#07584F] text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#064C44] active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-[#07584F]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing payment...
              </>
            ) : (
              <>
                Pay securely
                <CreditCard className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="mt-3.5 text-center text-[11px] text-slate-400">
            Encrypted 256-bit checkout · Instant community activation
          </p>
        </aside>
      </div>
    </div>
  );
}

type DetailItemProps = {
  label: string;
  value: string;
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="rounded-xl border border-[#eef2f0] bg-[#f8faf9] px-3.5 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </dt>

      <dd className="mt-1 truncate text-xs font-semibold leading-relaxed text-slate-900">
        {value}
      </dd>
    </div>
  );
}

type SummaryRowProps = {
  label: string;
  value: string;
};

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
