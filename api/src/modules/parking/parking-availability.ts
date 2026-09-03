import { AppError } from "../../utils/AppError.js"
import {
  VisitorParkingSlotStatus,
  type VisitorParkingSlotStatus as VisitorParkingSlotStatusType,
} from "./parking.interface.js"

export const isVisitorParkingSlotAvailable = (
  status: VisitorParkingSlotStatusType
) => status === VisitorParkingSlotStatus.AVAILABLE

export const ensureVisitorParkingSlotAvailable = (
  status: VisitorParkingSlotStatusType
) => {
  if (!isVisitorParkingSlotAvailable(status)) {
    throw new AppError("Parking slot is not available.", 400)
  }
}
