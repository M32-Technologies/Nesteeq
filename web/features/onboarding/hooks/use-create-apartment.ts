import { useMutation, useQuery } from "@tanstack/react-query";

import { createApartment, getPendingApartment } from "../api/apartment.api";

export const useCreateApartment = () => {
  return useMutation({
    mutationFn: createApartment,
  });
};

export const usePendingApartment = (enabled: boolean) => {
  return useQuery({
    queryKey: ["pending-apartment"],
    queryFn: getPendingApartment,
    enabled,
    staleTime: 30 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};
