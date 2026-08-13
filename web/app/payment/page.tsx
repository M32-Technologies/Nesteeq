"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ApartmentData = {
  _id?: string;
  id?: string;
  apartmentId?: string;
  name: string;
  state: string;
  city: string;
  address: string;
  totalUnits: string | number;
  totalFloors: string | number;
  totalBlocks: string | number;
  parkingSlots: string | number;
  contactNumber: string;
  emergencyNumber?: string;
  emergencyContact?: string;
};

type PlanId =
  | "TRIAL"
  | "MONTHLY"
  | "HALF_YEARLY"
  | "YEARLY";

type CheckoutPlanId = Exclude<PlanId, "TRIAL">;

type SelectedPlan = {
  planId: PlanId;
  name: string;
  duration: string;
  amount: number;
};

type StoredSelectedPlan = {
  id?: unknown;
  planId?: unknown;
  name?: string;
  duration?: string;
  amount?: number;
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayErrorResponse = {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
  };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;

  handler: (
    response: RazorpaySuccessResponse
  ) => void | Promise<void>;

  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };

  notes?: {
    apartment?: string;
    plan?: string;
  };

  theme?: {
    color?: string;
  };

  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;

  on: (
    event: "payment.failed",
    callback: (
      response: RazorpayErrorResponse
    ) => void
  ) => void;
};

declare global {
  interface Window {
    Razorpay: new (
      options: RazorpayOptions
    ) => RazorpayInstance;
  }
}

type CheckoutOrderResponse = {
  success: boolean;

  message: string;

  data: {
    key: string;

    paymentId: string;

    subscriptionId: string;

    apartmentId: string;

    orderId: string;

    amount: number;

    currency: string;

    plan: {
      id: PlanId;
      name: string;
      amount: number;
    };

    pricing: {
      subtotalAmount: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      taxAmount: number;
      totalAmount: number;
    };
  };
};

type VerifyPaymentResponse = {
  success: boolean;

  message: string;

  data: {
    verified: boolean;
    paymentId: string;
    paymentStatus: "PENDING" | "CAPTURED" | "FAILED";
    razorpayOrderId: string;
    razorpayPaymentId: string;
    amount: number;
    currency: string;
    subscriptionId?: string;
    subscriptionStatus?: string;
  };
};

type ApiErrorResponse = {
  success?: boolean;
  message?: string;
  details?: Array<{
    path?: string;
    message?: string;
  }>;
};

const DEFAULT_PLAN: SelectedPlan = {
  planId: "MONTHLY",
  name: "1 Month Plan",
  duration: "1 Month",
  amount: 2000,
};

const CHECKOUT_PLAN_IDS = [
  "MONTHLY",
  "HALF_YEARLY",
  "YEARLY",
] as const satisfies readonly CheckoutPlanId[];



const BACKEND_API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:6000"
).replace(/\/$/, "");

const USE_PAYMENT_PROXY = (() => {
  try {
    return (
      new URL(BACKEND_API_BASE_URL).port ===
      "6000"
    );
  } catch {
    return false;
  }
})();

const API_BASE_URL = USE_PAYMENT_PROXY
  ? ""
  : BACKEND_API_BASE_URL;

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const isCheckoutPlanId = (
  value: unknown
): value is CheckoutPlanId => {
  return (
    typeof value === "string" &&
    CHECKOUT_PLAN_IDS.includes(
      value as CheckoutPlanId
    )
  );
};

const normalizeStoredPlanId = (
  value: unknown
): PlanId | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "TRIAL") {
    return "TRIAL";
  }

  if (isCheckoutPlanId(normalized)) {
    return normalized;
  }

  if (
    normalized.includes("1_MONTH") ||
    normalized.includes("MONTHLY")
  ) {
    return "MONTHLY";
  }

  if (
    normalized.includes("6_MONTH") ||
    normalized.includes("HALF_YEAR")
  ) {
    return "HALF_YEARLY";
  }

  if (normalized.includes("YEAR")) {
    return "YEARLY";
  }

  return null;
};

const getCheckoutPlanId = (
  planId: PlanId
): CheckoutPlanId => {
  return isCheckoutPlanId(planId)
    ? planId
    : "MONTHLY";
};

const getStoredApartmentId = (
  apartment: ApartmentData
) => {
  return (
    apartment.apartmentId ||
    apartment._id ||
    apartment.id ||
    sessionStorage.getItem("nesteeqApartmentId") ||
    ""
  );
};

const buildApiErrorMessage = (
  result: ApiErrorResponse,
  fallback: string
) => {
  const details =
    Array.isArray(result.details) &&
    result.details.length > 0
      ? result.details
          .map((detail) =>
            detail.path && detail.message
              ? `${detail.path}: ${detail.message}`
              : detail.message
          )
          .filter(Boolean)
          .join("; ")
      : "";

  if (result.message && details) {
    return `${result.message}: ${details}`;
  }

  return result.message || details || fallback;
};

const readApiJson = async <T,>(
  response: Response,
  fallback: string
) => {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(fallback);
  }
};

const getNetworkErrorMessage = (
  error: unknown,
  action: string
) => {
  if (error instanceof TypeError) {
    return `Backend unreachable while trying to ${action}. Make sure the API is running at ${BACKEND_API_BASE_URL}.`;
  }

  return error instanceof Error
    ? error.message
    : `Unable to ${action}`;
};

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript =
      document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

    if (existingScript) {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      existingScript.addEventListener(
        "load",
        () => resolve(Boolean(window.Razorpay)),
        { once: true }
      );

      existingScript.addEventListener(
        "error",
        () => resolve(false),
        { once: true }
      );

      return;
    }

    const script =
      document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => {
      resolve(Boolean(window.Razorpay));
    };

    script.onerror = () => {
      resolve(false);
    };

    document.body.appendChild(script);
  });
};

export default function PaymentPage() {
  const router = useRouter();

  const [apartment, setApartment] =
    useState<ApartmentData | null>(null);

  const [plan, setPlan] =
    useState<SelectedPlan>(DEFAULT_PLAN);

  const [isPaying, setIsPaying] =
    useState(false);

  const [paymentMessage, setPaymentMessage] =
    useState("");

  const [paymentError, setPaymentError] =
    useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const savedApartment =
          sessionStorage.getItem(
            "nesteeqOnboarding"
          );

        const savedPlan =
          sessionStorage.getItem(
            "nesteeqSelectedPlan"
          );

        if (savedApartment) {
          const parsedApartment =
            JSON.parse(
              savedApartment
            ) as ApartmentData;

          setApartment(parsedApartment);
        }

        if (savedPlan) {
          const parsedPlan =
            JSON.parse(
              savedPlan
            ) as StoredSelectedPlan;

          const selectedPlanId =
            normalizeStoredPlanId(
              parsedPlan.planId
            ) ||
            normalizeStoredPlanId(
              parsedPlan.id
            ) ||
            normalizeStoredPlanId(
              parsedPlan.name
            ) ||
            DEFAULT_PLAN.planId;

          const planName =
            typeof parsedPlan.name ===
            "string"
              ? parsedPlan.name
              : DEFAULT_PLAN.name;

          const planDuration =
            typeof parsedPlan.duration ===
            "string"
              ? parsedPlan.duration
              : DEFAULT_PLAN.duration;

          const selectedPlan: SelectedPlan = {
            planId: selectedPlanId,

            name: planName,

            duration: planDuration,

            amount:
              typeof parsedPlan.amount ===
                "number" &&
              Number.isFinite(
                parsedPlan.amount
              )
                ? parsedPlan.amount
                : DEFAULT_PLAN.amount,
          };

          setPlan(selectedPlan);
        }
      } catch (error) {
        console.error(
          "Failed to read checkout data:",
          error
        );
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const subtotal = Number(
    (plan.amount / 1.18).toFixed(2)
  );

  const totalTax = Number(
    (plan.amount - subtotal).toFixed(2)
  );

  const cgst = Number(
    (totalTax / 2).toFixed(2)
  );

  const sgst = Number(
    (totalTax - cgst).toFixed(2)
  );

  const verifyPayment = async (
    response: RazorpaySuccessResponse
  ) => {
    setIsPaying(true);

    setPaymentError("");

    setPaymentMessage(
      "Verifying your payment..."
    );

    try {
      const verifyResponse = await fetch(
        `${API_BASE_URL}/api/payments/verify-checkout`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            razorpayOrderId:
              response.razorpay_order_id,

            razorpayPaymentId:
              response.razorpay_payment_id,

            razorpaySignature:
              response.razorpay_signature,
          }),
        }
      );

      const result =
        await readApiJson<
          VerifyPaymentResponse | ApiErrorResponse
        >(
          verifyResponse,
          "Backend returned an invalid verification response"
        );

      if (!verifyResponse.ok) {
        throw new Error(
          buildApiErrorMessage(
            result,
            "Payment verification failed"
          )
        );
      }

      if (
        !result.success ||
        !("data" in result) ||
        !result.data?.verified
      ) {
        throw new Error(
          "Payment could not be verified"
        );
      }

      setPaymentMessage(
        "Payment verified successfully"
      );

      sessionStorage.setItem(
        "nesteeqPaymentVerified",
        "true"
      );

      sessionStorage.setItem(
        "nesteeqRazorpayPaymentId",
        response.razorpay_payment_id
      );

      sessionStorage.setItem(
        "nesteeqPaymentId",
        result.data.paymentId
      );

      sessionStorage.setItem(
        "nesteeqPaymentStatus",
        result.data.paymentStatus
      );

      if (result.data.subscriptionId) {
        sessionStorage.setItem(
          "nesteeqSubscriptionId",
          result.data.subscriptionId
        );
      }

      router.push("/dashboard");
    } catch (error) {
      const message =
        getNetworkErrorMessage(
          error,
          "verify payment"
        );

      setPaymentMessage("");

      setPaymentError(message);

      setIsPaying(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!apartment) {
      setPaymentError(
        "Apartment details are missing"
      );

      return;
    }

    const apartmentId =
      getStoredApartmentId(apartment);

    if (!apartmentId) {
      setPaymentError(
        "Apartment must be saved before payment. Please complete onboarding again."
      );

      return;
    }

    if (
      plan.planId === "TRIAL" ||
      plan.amount <= 0
    ) {
      setPaymentError(
        "Free trial activation will be connected with the subscription service."
      );

      return;
    }

    setIsPaying(true);

    setPaymentError("");

    setPaymentMessage(
      "Preparing secure payment..."
    );

    try {
      const scriptLoaded =
        await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error(
          "Unable to load Razorpay Checkout. Please check your internet connection."
        );
      }

      const checkoutPlanId =
        getCheckoutPlanId(plan.planId);

      const orderResponse = await fetch(
        `${API_BASE_URL}/api/payments/checkout-order`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            apartmentId,
            planId: checkoutPlanId,
          }),
        }
      );

      const orderResult =
        await readApiJson<
          CheckoutOrderResponse | ApiErrorResponse
        >(
          orderResponse,
          "Backend returned an invalid order response"
        );

      if (!orderResponse.ok) {
        throw new Error(
          buildApiErrorMessage(
            orderResult,
            "Unable to create payment order"
          )
        );
      }

      if (
        !orderResult.success ||
        !("data" in orderResult) ||
        !orderResult.data
      ) {
        throw new Error(
          "Invalid payment order response"
        );
      }

      const {
        key,
        paymentId,
        subscriptionId,
        orderId,
        amount,
        currency,
        plan: checkoutPlan,
      } = orderResult.data;

      if (!key) {
        throw new Error(
          "Razorpay key was not returned by the server"
        );
      }

      sessionStorage.setItem(
        "nesteeqPaymentId",
        paymentId
      );

      sessionStorage.setItem(
        "nesteeqSubscriptionId",
        subscriptionId
      );

      const options: RazorpayOptions = {
        key,

        amount,

        currency,

        name: "Nesteeq",

        description: `${checkoutPlan.name} Subscription`,

        order_id: orderId,

        handler: async (
          response: RazorpaySuccessResponse
        ) => {
          await verifyPayment(response);
        },

        prefill: {
          contact:
            apartment.contactNumber,
        },

        notes: {
          apartment:
            apartment.name,

          plan:
            checkoutPlan.name,
        },

        theme: {
          color: "#123F35",
        },

        modal: {
          ondismiss: () => {
            setIsPaying(false);

            setPaymentMessage("");
          },
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        (
          response: RazorpayErrorResponse
        ) => {
          const description =
            response.error
              ?.description ||
            "Payment failed. Please try again.";

          setPaymentError(description);

          setPaymentMessage("");

          setIsPaying(false);
        }
      );

      setPaymentMessage(
        "Complete payment in the Razorpay window."
      );

      razorpay.open();
    } catch (error) {
      const message =
        getNetworkErrorMessage(
          error,
          "start payment"
        );

      console.error(
        "Razorpay checkout error:",
        error
      );

      setPaymentMessage("");

      setPaymentError(message);

      setIsPaying(false);
    }
  };

  if (!apartment) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F6F5] px-6">
        <div className="max-w-md rounded-3xl border border-[#DEE5E1] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6F0EC] text-xl font-bold text-[#123F35]">
            !
          </div>

          <h1 className="mt-5 text-2xl font-bold text-[#17211E]">
            Apartment details not found
          </h1>

          <p className="mt-2 text-sm font-medium leading-6 text-[#55635E]">
            Complete apartment onboarding
            before continuing to payment.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/onboarding")
            }
            className="mt-6 h-12 rounded-xl bg-[#123F35] px-6 text-sm font-bold text-white"
          >
            Go to Onboarding
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F6F5]">
      <header className="h-[72px] border-b border-[#E2E8E5] bg-white">
        <div className="mx-auto flex h-full max-w-[1500px] items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123F35] text-lg font-black text-white">
              N
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight text-[#123F35]">
                Nesteeq
              </h1>

              <p className="text-[11px] font-semibold text-[#68756F]">
                Apartment Management
              </p>
            </div>
          </div>

          <div className="rounded-full bg-[#EEF5F2] px-4 py-2 text-xs font-bold text-[#386354]">
            Secure checkout
          </div>
        </div>
      </header>


      <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-10">

        <div className="mb-7">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#397361]">
            Final Step
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#111A17] lg:text-[38px]">
            Review and confirm your setup
          </h2>

          <p className="mt-2 text-[15px] font-semibold text-[#52605B]">
            Review your apartment and
            subscription details before
            continuing to secure payment.
          </p>
        </div>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_390px]">

          <div className="space-y-6">

            <section className="rounded-3xl border border-[#DEE5E1] bg-white p-7 shadow-[0_8px_30px_rgba(18,63,53,0.04)]">
              <div className="flex items-start justify-between border-b border-[#E9EEEB] pb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-[#426457]">
                    Apartment Details
                  </p>

                  <h3 className="mt-2 text-[26px] font-black text-[#111A17]">
                    {apartment.name}
                  </h3>

                  <p className="mt-2 text-[14px] font-semibold leading-6 text-[#4E5D57]">
                    {apartment.address},{" "}
                    {apartment.city},{" "}
                    {apartment.state}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/onboarding"
                    )
                  }
                  className="rounded-xl border border-[#D8E0DC] bg-white px-4 py-2 text-xs font-bold text-[#315C4E] transition hover:bg-[#F4F7F5]"
                >
                  Edit
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                <DetailCard
                  value={
                    apartment.totalUnits
                  }
                  label="Total Units"
                />

                <DetailCard
                  value={
                    apartment.totalFloors
                  }
                  label="Floors"
                />

                <DetailCard
                  value={
                    apartment.totalBlocks
                  }
                  label="Blocks"
                />

                <DetailCard
                  value={
                    apartment.parkingSlots
                  }
                  label="Parking Slots"
                />
              </div>

              <div className="mt-6 grid gap-4 border-t border-[#E9EEEB] pt-6 md:grid-cols-2">
                <InfoRow
                  label="Apartment Contact"
                  value={`+91 ${apartment.contactNumber}`}
                />

                <InfoRow
                  label="Emergency Contact"
                  value={`+91 ${
                    apartment.emergencyNumber ||
                    apartment.emergencyContact ||
                    ""
                  }`}
                />
              </div>
            </section>


            <section className="rounded-3xl border border-[#DEE5E1] bg-white p-7 shadow-[0_8px_30px_rgba(18,63,53,0.04)]">
              <div className="flex items-center justify-between gap-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-[#426457]">
                    Selected Plan
                  </p>

                  <h3 className="mt-2 text-[26px] font-black text-[#111A17]">
                    {plan.name}
                  </h3>

                  <p className="mt-2 text-sm font-bold text-[#52605B]">
                    {plan.duration} subscription
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[30px] font-black text-[#123F35]">
                    {formatCurrency(
                      plan.amount
                    )}
                  </p>

                  <p className="mt-1 text-xs font-bold text-[#66736E]">
                    GST inclusive
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-[#F2F7F4] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DCECE5] font-black text-[#145240]">
                    ✓
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#27453C]">
                      Ready to activate
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#53645D]">
                      Your subscription will
                      activate after successful
                      payment.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>


          <aside>
            <div className="sticky top-6 rounded-3xl border border-[#D9E2DE] bg-white p-6 shadow-[0_18px_55px_rgba(18,63,53,0.10)]">
              <div className="border-b border-[#E8EDEB] pb-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#426457]">
                  Order Summary
                </p>

                <h3 className="mt-2 text-xl font-black text-[#111A17]">
                  {plan.name}
                </h3>

                <p className="mt-1 text-xs font-bold text-[#5F6D67]">
                  {plan.duration}
                </p>
              </div>

              <div className="space-y-4 py-6">
                <PriceRow
                  label="Subscription value"
                  value={formatCurrency(
                    subtotal
                  )}
                />

                <PriceRow
                  label="CGST (9%)"
                  value={formatCurrency(
                    cgst
                  )}
                />

                <PriceRow
                  label="SGST (9%)"
                  value={formatCurrency(
                    sgst
                  )}
                />

                <div className="border-t border-dashed border-[#C5D0CB] pt-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-[#111A17]">
                        Total Amount
                      </p>

                      <p className="mt-1 text-xs font-bold text-[#64716C]">
                        Inclusive of all taxes
                      </p>
                    </div>

                    <p className="text-[29px] font-black tracking-tight text-[#123F35]">
                      {formatCurrency(
                        plan.amount
                      )}
                    </p>
                  </div>
                </div>
              </div>


              {paymentMessage && (
                <div className="mb-4 rounded-xl border border-[#CFE2D9] bg-[#EFF7F3] px-4 py-3">
                  <p className="text-[12px] font-bold text-[#28604E]">
                    {paymentMessage}
                  </p>
                </div>
              )}


              {paymentError && (
                <div className="mb-4 rounded-xl border border-[#F0CCCC] bg-[#FFF5F5] px-4 py-3">
                  <p className="text-[12px] font-bold text-[#B64242]">
                    {paymentError}
                  </p>
                </div>
              )}


              <button
                type="button"
                onClick={
                  handleConfirmPayment
                }
                disabled={isPaying}
                className="group flex h-[54px] w-full items-center justify-center rounded-xl bg-[#123F35] px-4 text-[15px] font-black text-white shadow-[0_8px_24px_rgba(18,63,53,0.20)] transition hover:-translate-y-0.5 hover:bg-[#0D342C] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isPaying
                  ? "Please wait..."
                  : `Confirm & Pay ${formatCurrency(
                      plan.amount
                    )}`}

                {!isPaying && (
                  <span className="ml-2 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                )}
              </button>


              <div className="mt-5 flex items-center justify-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF4F1] text-xs font-black text-[#315D50]">
                  ✓
                </div>

                <p className="text-xs font-bold text-[#5D6965]">
                  Secure payment powered by
                  Razorpay
                </p>
              </div>

              <p className="mt-4 text-center text-[11px] font-semibold leading-5 text-[#69756F]">
                By confirming payment you
                agree to the subscription
                billing terms.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function DetailCard({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E3EAE6] bg-[#F8FAF9] px-4 py-5 text-center">
      <p className="text-[28px] font-black tracking-tight text-[#174C3F]">
        {value || "—"}
      </p>

      <p className="mt-1 text-xs font-bold text-[#55645E]">
        {label}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-[#65736D]">
        {label}
      </p>

      <p className="mt-1 text-[15px] font-black text-[#1E2D27]">
        {value}
      </p>
    </div>
  );
}

function PriceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-bold text-[#4E5C57]">
        {label}
      </p>

      <p className="text-sm font-black text-[#18251F]">
        {value}
      </p>
    </div>
  );
}
