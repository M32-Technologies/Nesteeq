import axios from "axios"

type ApiErrorResponse = {
  message?: unknown
  error?: unknown
}

const unsafeMessagePatterns = [
  /stack/i,
  /trace/i,
  /Mongo(Server)?Error/i,
  /CastError/i,
  /E11000/i,
  /<[^>]+>/,
]

const getCleanMessage = (value: unknown) => {
  if (typeof value !== "string") return null

  const message = value.trim()

  if (!message || message.length > 180) return null

  if (
    unsafeMessagePatterns.some((pattern) =>
      pattern.test(message)
    )
  ) {
    return null
  }

  return message
}

export const getSecurityApiErrorMessage = (
  error: unknown,
  fallback: string
) => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const status = error.response?.status
    const data = error.response?.data
    const message = getCleanMessage(data?.message ?? data?.error)

    if (message && (!status || status < 500)) {
      return message
    }
  }

  return fallback
}
