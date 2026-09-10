import assert from "node:assert/strict"
import test from "node:test"

import {
  hashGuestPassToken,
  parseGuestPassQrPayload,
} from "../src/modules/visitors/pass/pass-token.js"
import {
  clearVerifyPassFailures,
  isVerifyPassRateLimited,
  recordVerifyPassFailure,
  verifyPassRateLimitConfig,
} from "../src/modules/security/verify-pass-rate-limit.js"

test("guest pass QR parser accepts supported payload formats", () => {
  assert.equal(parseGuestPassQrPayload(" plain-token "), "plain-token")
  assert.equal(
    parseGuestPassQrPayload('{ "token": " json-token " }'),
    "json-token"
  )
  assert.equal(
    parseGuestPassQrPayload("https://nesteeq.test/visit?token=url-token"),
    "url-token"
  )
  assert.equal(
    parseGuestPassQrPayload("nesteeq:visitor-pass:prefixed-token"),
    "prefixed-token"
  )
})

test("guest pass token hashing is stable and one-way", () => {
  const token = "visitor-token"
  const hash = hashGuestPassToken(token)

  assert.equal(hash, hashGuestPassToken(token))
  assert.notEqual(hash, token)
  assert.match(hash, /^[0-9a-f]{64}$/)
})

test("verify pass rate limit locks after failed attempts", () => {
  const key = `security-test:${Date.now()}`
  const now = Date.now()

  try {
    let attempt

    for (
      let count = 0;
      count < verifyPassRateLimitConfig.maxFailedAttempts;
      count += 1
    ) {
      attempt = recordVerifyPassFailure(key, now)
    }

    assert.equal(isVerifyPassRateLimited(attempt, now), true)
  } finally {
    clearVerifyPassFailures(key)
  }
})
