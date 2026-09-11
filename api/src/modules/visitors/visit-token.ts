import crypto from "crypto"

export const hashGuestPassToken = (token: string) =>
  crypto
    .createHash("sha256")
    .update(token)
    .digest("hex")

export const parseGuestPassQrPayload = (payload: string) => {
  const trimmedPayload = payload.trim()

  if (!trimmedPayload) return ""

  try {
    const parsedPayload = JSON.parse(trimmedPayload) as unknown

    if (
      parsedPayload &&
      typeof parsedPayload === "object" &&
      "token" in parsedPayload &&
      typeof parsedPayload.token === "string"
    ) {
      return parsedPayload.token.trim()
    }
  } catch {
    // Plain tokens are expected, so non-JSON payloads are fine.
  }

  try {
    const parsedUrl = new URL(trimmedPayload)
    const token =
      parsedUrl.searchParams.get("token") ??
      parsedUrl.searchParams.get("guestPassToken") ??
      parsedUrl.searchParams.get("visitorToken") ??
      parsedUrl.searchParams.get("passToken")

    if (token) return token.trim()
  } catch {
    // Non-URL payloads fall through to prefix/raw handling.
  }

  const prefixedToken = trimmedPayload.match(
    /^(?:nesteeq:)?visitor-pass[:/](.+)$/i
  )

  return prefixedToken?.[1]?.trim() ?? trimmedPayload
}
