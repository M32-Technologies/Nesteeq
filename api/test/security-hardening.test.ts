import assert from "node:assert/strict"
import test from "node:test"

import {
  hashGuestPassToken,
  parseGuestPassQrPayload,
} from "../src/modules/visitors/visit-token.js"
import { EmergencyAlertStatus } from "../src/modules/alert/alert.model.js"
import {
  canTransitionEmergencyAlertStatus,
  validateEmergencyAlertStatusTransition,
} from "../src/modules/security/security-status-transitions.js"
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

test("emergency alert status requires the security response sequence", () => {
  assert.equal(
    canTransitionEmergencyAlertStatus(
      EmergencyAlertStatus.ACTIVE,
      EmergencyAlertStatus.ACKNOWLEDGED
    ),
    true
  )
  assert.equal(
    canTransitionEmergencyAlertStatus(
      EmergencyAlertStatus.ACKNOWLEDGED,
      EmergencyAlertStatus.RESPONDING
    ),
    true
  )
  assert.equal(
    canTransitionEmergencyAlertStatus(
      EmergencyAlertStatus.RESPONDING,
      EmergencyAlertStatus.RESOLVED
    ),
    true
  )
  assert.throws(
    () =>
      validateEmergencyAlertStatusTransition(
        EmergencyAlertStatus.ACTIVE,
        EmergencyAlertStatus.RESOLVED
      ),
    /Invalid alert status transition/
  )
  assert.throws(
    () =>
      validateEmergencyAlertStatusTransition(
        EmergencyAlertStatus.RESOLVED,
        EmergencyAlertStatus.RESPONDING
      ),
    /Invalid alert status transition/
  )
})
