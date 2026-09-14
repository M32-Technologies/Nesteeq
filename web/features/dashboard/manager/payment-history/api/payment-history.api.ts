import {
  Bill,
  FinanceSummary,
  GetManagerBillsParams,
  GetManagerPaymentsParams,
  Payment,
} from "../types/payment-history";

const getApiBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  return apiUrl.replace(/\/$/, "");
};

const getErrorMessage = async (response: Response) => {
  try {
    const data = await response.json();
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;
    const details = Array.isArray(data?.details)
      ? data.details
          .map((detail: unknown) => {
            if (
              detail &&
              typeof detail === "object" &&
              "message" in detail
            ) {
              const path =
                "path" in detail &&
                typeof detail.path === "string"
                  ? `${detail.path}: `
                  : "";

              return `${path}${String(detail.message)}`;
            }

            return String(detail);
          })
          .filter(Boolean)
      : [];

    return details.length
      ? `${message}: ${details.join("; ")}`
      : message;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

const request = async <T>(
  path: string,
  options: RequestInit = {},
) => {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result = await response.json();

  if (
    result &&
    typeof result === "object" &&
    "data" in result
  ) {
    return result.data as T;
  }

  return result as T;
};

const toQuery = (params: object) => {
  const searchParams = new URLSearchParams();

  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (
      (typeof value === "string" ||
        typeof value === "number") &&
      value !== ""
    ) {
      if (key === "status" && value === "ALL") return;
      if (key === "source" && value === "ALL") return;
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const getFinanceSummary = () =>
  request<FinanceSummary>("/api/finance/summary");

export const getManagerBills = (params: GetManagerBillsParams = {}) =>
  request<Bill[]>(`/api/bills${toQuery(params)}`);

export const getManagerPayments = (params: GetManagerPaymentsParams = {}) =>
  request<Payment[]>(`/api/payments${toQuery(params)}`);
