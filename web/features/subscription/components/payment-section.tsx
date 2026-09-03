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
    <div>
      <div className="mx-auto mb-7 flex w-fit items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-[var(--brand)] text-sm font-bold text-white">
          N
        </span>

        <span className="text-[22px] font-semibold tracking-[-0.03em]">
          Nesteeq
        </span>
      </div>

      <div className="mb-8 text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
          Secure payment
        </p>

        <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-[var(--ink)]">
          Review and activate
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-[0_16px_40px_rgba(4,59,53,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold text-[var(--brand)]">
                  {getDurationLabel(plan.durationMonths)}
                </p>

                <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[var(--brand-dark)]">
                  {plan.planName}
                </h2>

                {plan.freeTrial.enabled && (
                  <p className="mt-2 text-sm font-medium text-[var(--text)]">
                    {plan.freeTrial.days}-day trial included
                  </p>
                )}
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--green-soft)] text-[var(--brand)]">
                <ReceiptText className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {plan.features.slice(0, 6).map((feature) => (
                <div
                  key={feature}
                  className="flex min-h-10 items-start gap-3 rounded-lg bg-[var(--surface)] px-3 py-2.5"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand)]" />

                  <span className="text-sm leading-5 text-[var(--text)]">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-[0_16px_40px_rgba(4,59,53,0.06)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--soft-blue)] text-[var(--blue)]">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-[var(--ink)]">
                  Registration details
                </h2>

                <p className="text-sm text-[var(--text-muted)]">
                  {user.email || "Signed-in manager"}
                </p>
              </div>
            </div>

            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <DetailItem label="Apartment" value={apartment.name} />
              <DetailItem
                label="Contact"
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
                label="Parking"
                value={`${apartment.parkingSlots} slots`}
              />
              <DetailItem
                label="Emergency"
                value={apartment.emergencyContact || "Not added"}
              />
            </dl>
          </section>
        </div>

        <aside className="h-fit rounded-lg border border-[var(--border)] bg-white p-5 shadow-[0_18px_50px_rgba(4,59,53,0.08)] lg:sticky lg:top-6">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-[var(--ink)]">
                Payment total
              </h2>

              <p className="mt-1 text-sm text-[var(--text-muted)]">
                GST included at 18%
              </p>
            </div>

            <CreditCard className="h-5 w-5 text-[var(--brand)]" />
          </div>

          <div className="space-y-3 py-5">
            <SummaryRow
              label="Plan price before tax"
              value={formatCurrency(priceSummary.beforeTax)}
            />
            <SummaryRow
              label="GST (18%)"
              value={formatCurrency(priceSummary.tax)}
            />
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
            <span className="text-base font-semibold text-[var(--ink)]">
              Total
            </span>

            <span className="text-[26px] font-semibold tracking-[-0.04em] text-[var(--brand-dark)]">
              {formatCurrency(priceSummary.total)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void startPayment()}
            disabled={isProcessing}
            className="mt-6 flex h-[50px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--green-soft)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing
              </>
            ) : (
              <>
                Pay securely
                <CreditCard className="h-4 w-4" />
              </>
            )}
          </button>
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
    <div className="rounded-lg bg-[var(--surface)] px-3 py-3">
      <dt className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {label}
      </dt>

      <dd className="mt-1 text-sm font-medium leading-5 text-[var(--ink)]">
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
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-[var(--text)]">{label}</span>
      <span className="font-semibold text-[var(--ink)]">{value}</span>
    </div>
  );
}
