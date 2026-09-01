import { AppError } from "../../utils/AppError.js";
import {
  complaintStatuses,
  type ComplaintStatus,
} from "../complaint/complaint.model.js";
import {
  maintenanceStatuses,
  type MaintenanceStatus,
} from "../maintenance/maintenance.model.js";
import {
  technicianStatuses,
  type TechnicianStatus,
} from "./technician.model.js";

export const activeComplaintStatuses: ComplaintStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "REJECTED",
];

export const activeMaintenanceStatuses: MaintenanceStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "WORK_COMPLETED",
  "AWAITING_APPROVAL",
  "REJECTED",
];

const isTechnicianStatus = (value: string): value is TechnicianStatus =>
  (technicianStatuses as readonly string[]).includes(value);

export const isComplaintStatus = (value: string): value is ComplaintStatus =>
  (complaintStatuses as readonly string[]).includes(value);

export const isMaintenanceStatus = (value: string): value is MaintenanceStatus =>
  (maintenanceStatuses as readonly string[]).includes(value);

export const assertTechnicianIsAssignable = (technician: { status: string }): void => {
  if (!isTechnicianStatus(technician.status)) {
    throw new AppError("Technician has an invalid status", 500);
  }

  if (technician.status === "INACTIVE") {
    throw new AppError("Inactive technicians cannot be assigned work", 400);
  }

  if (technician.status === "ON_LEAVE") {
    throw new AppError("Technicians on leave cannot be assigned work", 400);
  }
};

export const getNextTechnicianStatus = (
  complaintsCount: number,
  maintenanceCount: number
): TechnicianStatus => complaintsCount + maintenanceCount > 0 ? "BUSY" : "ACTIVE";
