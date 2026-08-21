import { Types } from "mongoose";

import { Audit } from "./audit.model.js";
import { AuditAction } from "./audit.interface.js";

import { AppError } from "../../utils/AppError.js";

interface CreateAuditInput {
  apartmentId: string;
  performedBy?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  description?: string;
}

interface AuditFilters {
  apartmentId?: string;
  performedBy?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
}

const validateObjectId = (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid ObjectId", 400);
  }
};

export const createAuditLogService = async (
  input: CreateAuditInput
) => {
  validateObjectId(input.apartmentId);
  validateObjectId(input.entityId);

  if (input.performedBy) {
    validateObjectId(input.performedBy);
  }

  return Audit.create(input);
};

export const getAuditLogsService = async (
  filters: AuditFilters
) => {
  const query: Record<string, unknown> = {};

  if (filters.apartmentId) {
    validateObjectId(filters.apartmentId);
    query.apartmentId = filters.apartmentId;
  }

  if (filters.performedBy) {
    validateObjectId(filters.performedBy);
    query.performedBy = filters.performedBy;
  }

  if (filters.action) {
    query.action = filters.action;
  }

  if (filters.entityType) {
    query.entityType = filters.entityType;
  }

  if (filters.entityId) {
    validateObjectId(filters.entityId);
    query.entityId = filters.entityId;
  }

  return Audit.find(query).sort({
    createdAt: -1,
  });
};

export const getAuditByIdService = async (
  auditId: string
) => {
  validateObjectId(auditId);

  const audit = await Audit.findById(auditId);

  if (!audit) {
    throw new AppError("Audit log not found", 404);
  }

  return audit;
};