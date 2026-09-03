import type {
  NextFunction,
  Request,
  Response,
} from "express"

import { AppError } from "../../utils/AppError.js"

type VerifyPassAttempt = {
  count: number
  resetAt: number
}

export const verifyPassRateLimitConfig = {
  windowMs: 5 * 60 * 1000,
  maxFailedAttempts: 12,
}

const failedAttempts = new Map<string, VerifyPassAttempt>()

const getForwardedIp = (req: Request) => {
  const forwardedFor = req.headers["x-forwarded-for"]

  if (Array.isArray(forwardedFor)) {
    return forwardedFor[0]?.split(",")[0]?.trim()
  }

  return forwardedFor?.split(",")[0]?.trim()
}

export const getVerifyPassRateLimitKey = (req: Request) => {
  const userId = req.user?.id ?? "anonymous"
  const ip =
    getForwardedIp(req) ??
    req.ip ??
    req.socket.remoteAddress ??
    "unknown"

  return `${userId}:${ip}`
}

export const isVerifyPassRateLimited = (
  attempt: VerifyPassAttempt | undefined,
  now = Date.now()
) =>
  Boolean(
    attempt &&
      attempt.resetAt > now &&
      attempt.count >=
        verifyPassRateLimitConfig.maxFailedAttempts
  )

export const recordVerifyPassFailure = (
  key: string,
  now = Date.now()
) => {
  const existing = failedAttempts.get(key)

  if (!existing || existing.resetAt <= now) {
    const attempt = {
      count: 1,
      resetAt: now + verifyPassRateLimitConfig.windowMs,
    }

    failedAttempts.set(key, attempt)
    return attempt
  }

  const attempt = {
    ...existing,
    count: existing.count + 1,
  }

  failedAttempts.set(key, attempt)
  return attempt
}

export const clearVerifyPassFailures = (key: string) => {
  failedAttempts.delete(key)
}

export const verifyPassRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const key = getVerifyPassRateLimitKey(req)
  const existing = failedAttempts.get(key)

  if (existing?.resetAt && existing.resetAt <= Date.now()) {
    failedAttempts.delete(key)
  } else if (isVerifyPassRateLimited(existing)) {
    next(
      new AppError(
        "Too many failed guest pass verification attempts. Please wait before trying again.",
        429
      )
    )
    return
  }

  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      clearVerifyPassFailures(key)
      return
    }

    if (
      res.statusCode >= 400 &&
      res.statusCode < 500 &&
      res.statusCode !== 429
    ) {
      recordVerifyPassFailure(key)
    }
  })

  next()
}
