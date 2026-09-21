const vehicleNumberRegex =
  /^(?:[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}|\d{2}BH\d{4}[A-Z]{1,2})$/

export const normalizeVehicleNumber = (value: string) =>
  value.replace(/[\s-]/g, "").toUpperCase()

export const isValidVehicleNumber = (value: string) =>
  vehicleNumberRegex.test(normalizeVehicleNumber(value))

