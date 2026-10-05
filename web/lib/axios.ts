import axios, { type AxiosError } from "axios";

type ApiErrorResponse = {
  message?: string;
  error?: string;
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const authRoutes = ["/login", "/register", "/verify-email"];
      const isAuthRoute = authRoutes.some((route) =>
        window.location.pathname.startsWith(route)
      );

      if (!isAuthRoute) {
        window.location.assign(new URL("/login", window.location.origin));
      }
    }

    // Intercept APARTMENT_INACTIVE error code
    const errorData = error.response?.data as {
      code?: string;
      message?: string;
      details?: {
        apartmentId?: string;
        apartmentName?: string;
        status?: string;
        inactiveReason?: string;
      };
    } | undefined;

    if (
      (error.response?.status === 403 || error.response?.status === 400) &&
      errorData?.code === "APARTMENT_INACTIVE" &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(
        new CustomEvent("nesteeq:apartment_inactive", {
          detail: {
            apartmentName: errorData.details?.apartmentName,
            reason: errorData.details?.inactiveReason || errorData.message,
            apartmentId: errorData.details?.apartmentId,
          },
        })
      );
    }

    // Populate human-readable error message from backend API response
    const backendMessage =
      error.response?.data?.message || error.response?.data?.error;
    if (backendMessage && typeof backendMessage === "string") {
      error.message = backendMessage;
    }

    return Promise.reject(error);
  }
);

export default api;
