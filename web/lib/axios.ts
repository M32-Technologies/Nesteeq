import axios, { type AxiosError } from "axios";

type ApiErrorResponse = {
  message?: string;
  error?: string;
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
