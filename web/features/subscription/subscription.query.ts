import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  CreateSubscriptionResponse,
  CreateSubscriptionResult,
  SubscriptionPlansResponse,
  SubscriptionPlan,
  VerifySubscriptionPaymentInput,
  VerifySubscriptionPaymentResponse,
  VerifySubscriptionPaymentResult,
} from "./subscription.types";

export const fetchSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {

    const response = await api.get<SubscriptionPlansResponse>("/api/v1/subscription-plans");
    if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch plans");
    }

    return response.data.data;
};

export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ["subscription-plans"],
    queryFn: fetchSubscriptionPlans,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const refreshAuthSessionFromDatabase = async () => {
  await api.get("/api/auth/get-session", {
    params: {
      disableCookieCache: true,
    },
  });
};

export const createSubscription = async (
  planId: string,
): Promise<CreateSubscriptionResult> => {
  const response = await api.post<CreateSubscriptionResponse>(
    "/api/v1/subscriptions",
    {
      planId,
    },
  );

  if (!response.data.success) {
    throw new Error(
      response.data.message || "Unable to create subscription.",
    );
  }

  return response.data.data;
};

export const verifySubscriptionPayment = async (
  input: VerifySubscriptionPaymentInput,
): Promise<VerifySubscriptionPaymentResult> => {
  const response = await api.post<VerifySubscriptionPaymentResponse>(
    "/api/v1/subscriptions/verify",
    input,
  );

  if (!response.data.success) {
    throw new Error(
      response.data.message || "Unable to verify payment.",
    );
  }

  return response.data.data;
};

export const promoteCurrentUserToPropertyManager = async () => {
  await api.post("/api/auth/update-user", {
    role: "property_manager",
  });
};

export const useCreateSubscription = () => {
  return useMutation({
    mutationFn: createSubscription,
  });
};

export const useVerifySubscriptionPayment = () => {
  return useMutation({
    mutationFn: verifySubscriptionPayment,
  });
};
