export type ApartmentData = {
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

export type PlanId =
  | "TRIAL"
  | "MONTHLY"
  | "HALF_YEARLY"
  | "YEARLY";

export type CheckoutPlanId = Exclude<PlanId, "TRIAL">;

export type SelectedPlan = {
  planId: PlanId;
  name: string;
  duration: string;
  amount: number;
};

export type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type RazorpayErrorResponse = {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
  };
};

export type RazorpayOptions = {
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

export type RazorpayInstance = {
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

export type CheckoutOrderResponse = {
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

export type VerifyPaymentResponse = {
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

export type ApartmentResponse = {
  success: boolean;
  apartment?: ApartmentData;
  data?: ApartmentData;
};

export type ApiErrorResponse = {
  success?: boolean;
  message?: string;
  details?: Array<{
    path?: string;
    message?: string;
  }>;
};
