import { isAxiosError } from "axios"

type ApiErrorPayload = {
  message?: string
  error?: string
  details?: Array<{
    message?: string
  }>
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<ApiErrorPayload>(error)) {
    const data = error.response?.data
    const validationMessage = data?.details
      ?.map((item) => item.message)
      .filter(Boolean)
      .join(", ")

    return validationMessage || data?.message || data?.error || fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

export function removeEmptyValues<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => {
      if (item === undefined || item === null) return false
      if (typeof item === "string" && item.trim() === "") return false
      return true
    })
  ) as Partial<T>
}
