import assert from "node:assert/strict"
import test from "node:test"

import {
  EmergencyAlertStatus,
} from "../src/modules/alert/alert.model.js"
import { DeliveryStatus } from "../src/modules/delivery/delivery.interface.js"
import { assignParkingSlotSchema } from "../src/modules/parking/parking.schema.js"
import {
  ensureVisitorParkingSlotAvailable,
  isVisitorParkingSlotAvailable,
} from "../src/modules/parking/parking-availability.js"
import { VisitorParkingSlotStatus } from "../src/modules/parking/parking.interface.js"
import {
  canTransitionDeliveryStatus,
  canTransitionEmergencyAlertStatus,
  deliveryUpdateStatuses,
  emergencyAlertUpdateStatuses,
  validateDeliveryStatusTransition,
  validateEmergencyAlertStatusTransition,
} from "../src/modules/security/security-status-transitions.js"
import {
  isVerifyPassRateLimited,
  recordVerifyPassFailure,
  verifyPassRateLimitConfig,
} from "../src/modules/security/verify-pass-rate-limit.js"
import { escapeRegExp } from "../src/utils/regex.js"
import { GuestPassStatus } from "../src/modules/visitors/pass/pass.model.js"
import {
  buildManualVisitorDuplicateFilter,
  manualVisitorDuplicateWindowMs,
} from "../src/modules/visitors/visit/manual-visitor-duplicate.js"

test("escapeRegExp keeps regex-sensitive searches safe", () => {
  const values = [
    "[",
    "]",
    "(",
    ")",
    "*",
    "+",
    "?",
    ".",
    "\\",
    "^",
    "$",
  ]

  for (const value of values) {
    const regex = new RegExp(escapeRegExp(value), "i")

    assert.match(value, regex)
  }
})

test("escapeRegExp keeps normal text search behavior", () => {
  const regex = new RegExp(escapeRegExp("Rahul"), "i")

  assert.match("rahul sharma", regex)
})

test("delivery updates accept only actionable target statuses", () => {
  assert.deepEqual(deliveryUpdateStatuses, [
    DeliveryStatus.NOTIFIED,
    DeliveryStatus.COLLECTED,
    DeliveryStatus.RETURNED,
  ])
})

test("guest pass status supports explicit used state", () => {
  assert.equal(GuestPassStatus.USED, "USED")
})

test("manual visitor duplicate filter targets recent matching submissions", () => {
  const now = new Date("2026-09-01T10:00:00.000Z")
  const filter = buildManualVisitorDuplicateFilter({
    apartmentId: "apartment-1",
    flatId: "flat-1",
    visitorName: "Rahul",
    visitorPhone: " 99999 ",
    now,
  }) as {
    apartmentId: string
    flatId: string
    $and: Array<Record<string, unknown>>
  }

  assert.equal(filter.apartmentId, "apartment-1")
  assert.equal(filter.flatId, "flat-1")
  assert.deepEqual(filter.$and[1], {
    $or: [{ visitorPhone: "99999" }],
  })
})

test("manual visitor duplicate window is short-lived", () => {
  assert.equal(manualVisitorDuplicateWindowMs, 5 * 60 * 1000)
})

test("parking assignment accepts only available slots", () => {
  assert.equal(
    isVisitorParkingSlotAvailable(
      VisitorParkingSlotStatus.AVAILABLE
    ),
    true
  )
  assert.doesNotThrow(() =>
    ensureVisitorParkingSlotAvailable(
      VisitorParkingSlotStatus.AVAILABLE
    )
  )
})

test("parking assignment rejects occupied, reserved, and unavailable slots", () => {
  for (const status of [
    VisitorParkingSlotStatus.OCCUPIED,
    VisitorParkingSlotStatus.RESERVED,
    VisitorParkingSlotStatus.OUT_OF_SERVICE,
  ]) {
    assert.equal(isVisitorParkingSlotAvailable(status), false)
    assert.throws(
      () => ensureVisitorParkingSlotAvailable(status),
      /Parking slot is not available/
    )
  }
})

test("parking assignment accepts optional visitor visit link", () => {
  const objectId = "64f1a0f0a0f0a0f0a0f0a0f0"

  const result = assignParkingSlotSchema.safeParse({
    body: {
      slotId: objectId,
      flatId: objectId,
      visitorVisitId: objectId,
      visitorName: "Rahul",
      vehicleNumber: "KL10AB1234",
    },
  })

  assert.equal(result.success, true)
})

test("delivery status transitions allow current UI actions", () => {
  assert.equal(
    canTransitionDeliveryStatus(
      DeliveryStatus.WAITING,
      DeliveryStatus.NOTIFIED
    ),
    true
  )
  assert.equal(
    canTransitionDeliveryStatus(
      DeliveryStatus.WAITING,
      DeliveryStatus.COLLECTED
    ),
    true
  )
  assert.equal(
    canTransitionDeliveryStatus(
      DeliveryStatus.WAITING,
      DeliveryStatus.RETURNED
    ),
    true
  )
  assert.equal(
    canTransitionDeliveryStatus(
      DeliveryStatus.NOTIFIED,
      DeliveryStatus.COLLECTED
    ),
    true
  )
  assert.equal(
    canTransitionDeliveryStatus(
      DeliveryStatus.NOTIFIED,
      DeliveryStatus.RETURNED
    ),
    true
  )
})

test("delivery status transitions reject no-op and backward updates", () => {
  assert.throws(
    () =>
      validateDeliveryStatusTransition(
        DeliveryStatus.WAITING,
        DeliveryStatus.WAITING
      ),
    /already WAITING/
  )
  assert.throws(
    () =>
      validateDeliveryStatusTransition(
        DeliveryStatus.COLLECTED,
        DeliveryStatus.NOTIFIED
      ),
    /Invalid delivery status transition/
  )
  assert.throws(
    () =>
      validateDeliveryStatusTransition(
        DeliveryStatus.RETURNED,
        DeliveryStatus.WAITING
      ),
    /Invalid delivery status transition/
  )
})

test("alert updates accept only actionable target statuses", () => {
  assert.deepEqual(emergencyAlertUpdateStatuses, [
    EmergencyAlertStatus.ACKNOWLEDGED,
    EmergencyAlertStatus.RESPONDING,
    EmergencyAlertStatus.RESOLVED,
  ])
})

test("alert status transitions allow forward workflow", () => {
  assert.equal(
    canTransitionEmergencyAlertStatus(
      EmergencyAlertStatus.ACTIVE,
      EmergencyAlertStatus.ACKNOWLEDGED
    ),
    true
  )
  assert.equal(
    canTransitionEmergencyAlertStatus(
      EmergencyAlertStatus.ACTIVE,
      EmergencyAlertStatus.RESPONDING
    ),
    true
  )
  assert.equal(
    canTransitionEmergencyAlertStatus(
      EmergencyAlertStatus.ACTIVE,
      EmergencyAlertStatus.RESOLVED
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
})

test("alert status transitions reject no-op and backward updates", () => {
  assert.throws(
    () =>
      validateEmergencyAlertStatusTransition(
        EmergencyAlertStatus.ACTIVE,
        EmergencyAlertStatus.ACTIVE
      ),
    /already ACTIVE/
  )
  assert.throws(
    () =>
      validateEmergencyAlertStatusTransition(
        EmergencyAlertStatus.RESPONDING,
        EmergencyAlertStatus.ACKNOWLEDGED
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
  assert.throws(
    () =>
      validateEmergencyAlertStatusTransition(
        EmergencyAlertStatus.RESOLVED,
        EmergencyAlertStatus.ACTIVE
      ),
    /Invalid alert status transition/
  )
})

test("verify pass rate limit triggers after configured failures", () => {
  const key = `test-key-${Date.now()}`
  const now = Date.now()
  let attempt

  for (
    let index = 0;
    index < verifyPassRateLimitConfig.maxFailedAttempts;
    index += 1
  ) {
    attempt = recordVerifyPassFailure(key, now)
  }

  assert.equal(isVerifyPassRateLimited(attempt, now), true)
  assert.equal(
    isVerifyPassRateLimited(
      attempt,
      now + verifyPassRateLimitConfig.windowMs + 1
    ),
    false
  )
})
