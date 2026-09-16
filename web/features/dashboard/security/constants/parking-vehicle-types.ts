export type ParkingVehicleType = "CAR" | "BIKE" | "EV" | "OTHER"

export const parkingVehicleTypeOptions: Array<{
  value: ParkingVehicleType
  label: string
}> = [
  { value: "CAR", label: "Car" },
  { value: "BIKE", label: "Bike / 2W" },
  { value: "EV", label: "EV" },
  { value: "OTHER", label: "Other" },
]

export const toParkingVehicleType = (value?: string | null) => {
  const normalizedValue = value?.trim().toUpperCase()
  return parkingVehicleTypeOptions.some(
    (option) => option.value === normalizedValue
  )
    ? (normalizedValue as ParkingVehicleType)
    : undefined
}

export const getParkingVehicleTypeLabel = (
  value?: string | null
) => {
  const vehicleType = toParkingVehicleType(value)
  return (
    parkingVehicleTypeOptions.find((option) => option.value === vehicleType)
      ?.label ?? value ?? "-"
  )
}

export const matchesParkingVehicleType = (
  slotVehicleType?: string | null,
  selectedVehicleType?: string | null
) => {
  const selectedType = toParkingVehicleType(selectedVehicleType)
  const slotType = toParkingVehicleType(slotVehicleType)

  if (!selectedType) return false
  if (selectedType === "OTHER") {
    return !slotType || slotType === "OTHER"
  }

  return slotType === selectedType
}
