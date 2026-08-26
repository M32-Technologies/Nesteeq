import { isAxiosError } from "axios";

import api from "@/lib/axios";
import type { CreateApartmentInput } from "../schemas/create-apartment";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type ApiErrorResponse = {
  message?: string;
};

export type CreatedApartment = CreateApartmentInput & {
  id: string;
  managerId: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export const createApartment = async (input: CreateApartmentInput) => {
  try {
    const response = await api.post<ApiResponse<CreatedApartment>>(
      "/api/v1/apartment",
      input,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Unable to create apartment.",
      );
    }

    return response.data.data;
  } catch (error) {
    if (isAxiosError<ApiErrorResponse>(error)) {
      throw new Error(
        error.response?.data?.message || "Unable to create apartment.",
      );
    }

    throw error;
  }
};

