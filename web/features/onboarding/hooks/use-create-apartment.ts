import { useMutation } from "@tanstack/react-query";

import { createApartment } from "../api/apartment.api";

export const useCreateApartment = () => {
  return useMutation({
    mutationFn: createApartment,
  });
};

