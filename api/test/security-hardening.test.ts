import assert from "node:assert/strict"
import test from "node:test"

import { assignParkingSlotSchema } from "../src/modules/parking/parking.schema.js"
import { manualVisitorEntrySchema } from "../src/modules/visitors/visit.validation.js"

const validId = "507f1f77bcf86cd799439011"

test("parking assignment requires a vehicle type", () => {
  const result = assignParkingSlotSchema.safeParse({
    body: {
      slotId: validId,
      flatId: validId,
      visitorName: "Test Visitor",
      vehicleNumber: "KL07AB6483",
    },
  })

  assert.equal(result.success, false)
})

test("parking assignment normalizes vehicle type", () => {
  const result = assignParkingSlotSchema.safeParse({
    body: {
      slotId: validId,
      flatId: validId,
      visitorName: "Test Visitor",
      vehicleNumber: "KL07AB6483",
      vehicleType: "car",
    },
  })

  assert.equal(result.success, true)
  if (result.success) assert.equal(result.data.body.vehicleType, "CAR")
})

test("manual visitor vehicle number requires vehicle type", () => {
  const result = manualVisitorEntrySchema.safeParse({
    body: {
      flatId: validId,
      visitorName: "Test Visitor",
      vehicleNumber: "KL07AB6483",
    },
  })

  assert.equal(result.success, false)
})

test("manual visitor vehicle type requires vehicle number", () => {
  const result = manualVisitorEntrySchema.safeParse({
    body: {
      flatId: validId,
      visitorName: "Test Visitor",
      vehicleType: "BIKE",
    },
  })

  assert.equal(result.success, false)
})
