import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { SubscriptionPlansResponse, SubscriptionPlan } from "./subscription.types";

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