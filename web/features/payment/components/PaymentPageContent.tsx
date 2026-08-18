"use client";

import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import PaymentOrderSummary from "./PaymentOrderSummary";
import PaymentSummaryCards from "./PaymentSummaryCards";
import {
  API_BASE_URL,
  DEFAULT_PLAN,
  getCheckoutPlanId,
  normalizeStoredPlanId,
} from "../constraints/payment.constants";
import { storedSelectedPlanSchema } from "../schema/payment.schema";
import type {
  ApiErrorResponse,
  ApartmentResponse,
  CheckoutOrderResponse,
  CheckoutPlanId,
  RazorpayErrorResponse,
  RazorpayOptions,
  RazorpaySuccessResponse,
  SelectedPlan,
  VerifyPaymentResponse,
} from "../types/payment.types";

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
    return `Backend unreachable while trying to ${action}. Make sure the API is running at ${API_BASE_URL}.`;
  }

  return error instanceof Error
    ? error.message
    : `Unable to ${action}`;
};

const fetchApartment = async (apartmentId: string) => {
  const apartmentResponse = await fetch(
    `${API_BASE_URL}/api/apartments/${apartmentId}`,
    {
      credentials: "include",
    }
  );

  const apartmentResult =
    await readApiJson<
      ApartmentResponse | ApiErrorResponse
    >(
      apartmentResponse,
      "Backend returned an invalid apartment response"
    );

  if (!apartmentResponse.ok) {
    throw new Error(
      buildApiErrorMessage(
        apartmentResult,
        "Unable to load apartment"
      )
    );
  }

  const loadedApartment =
    "apartment" in apartmentResult &&
    apartmentResult.apartment
      ? apartmentResult.apartment
      : "data" in apartmentResult
        ? apartmentResult.data
        : null;

  return loadedApartment
    ? {
        ...loadedApartment,
        _id:
          loadedApartment._id ||
          apartmentId,
        apartmentId,
      }
    : null;
};

const createCheckoutOrder = async ({
  apartmentId,
  planId,
}: {
  apartmentId: string;
  planId: CheckoutPlanId;
}) => {
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
        planId,
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

  return orderResult;
};

const verifyCheckoutPayment = async (
  response: RazorpaySuccessResponse
) => {
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

  return result;
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

export default function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apartmentId = searchParams.get("apartmentId");
  const apartmentQuery = useQuery({
    queryKey: ["apartment", apartmentId],
    queryFn: () => fetchApartment(apartmentId as string),
    enabled: Boolean(apartmentId),
    retry: false,
  });
  const createCheckoutOrderMutation = useMutation({
    mutationFn: createCheckoutOrder,
  });
  const verifyCheckoutPaymentMutation = useMutation({
    mutationFn: verifyCheckoutPayment,
  });
  const apartment = apartmentQuery.data ?? null;

  const [plan, setPlan] =
    useState<SelectedPlan>(DEFAULT_PLAN);

  const [isPaying, setIsPaying] =
    useState(false);

  const [paymentMessage, setPaymentMessage] =
    useState("");

  const [paymentError, setPaymentError] =
    useState("");

  useEffect(() => {
    if (apartmentQuery.error) {
      console.error(
        "Failed to read checkout data:",
        apartmentQuery.error
      );
    }
  }, [apartmentQuery.error]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const savedPlan =
          sessionStorage.getItem(
            "nesteeqSelectedPlan"
          );

        if (savedPlan) {
          const parsedPlanResult =
            storedSelectedPlanSchema.safeParse(
              JSON.parse(savedPlan)
            );

          if (parsedPlanResult.success) {
            const parsedPlan =
              parsedPlanResult.data;

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
      const result =
        await verifyCheckoutPaymentMutation.mutateAsync(response);

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

    const currentApartmentId = apartmentId;

    if (!currentApartmentId) {
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

      const orderResult =
        await createCheckoutOrderMutation.mutateAsync({
          apartmentId: currentApartmentId,
          planId: checkoutPlanId,
        });

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
          <PaymentSummaryCards
            apartment={apartment}
            plan={plan}
            onEditApartment={() =>
              router.push(
                "/onboarding"
              )
            }
          />

          <PaymentOrderSummary
            plan={plan}
            subtotal={subtotal}
            cgst={cgst}
            sgst={sgst}
            paymentMessage={paymentMessage}
            paymentError={paymentError}
            isPaying={isPaying}
            onConfirmPayment={handleConfirmPayment}
          />
        </div>
      </div>
    </main>
  );
}
