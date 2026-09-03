import { Types } from "mongoose";

export enum AuditAction {
  BILL_CREATED = "BILL_CREATED",
  BILL_UPDATED = "BILL_UPDATED",
  LATE_FEE_WAIVED = "LATE_FEE_WAIVED",
  PAYMENT_RECORDED = "PAYMENT_RECORDED",
  EXPENSE_CREATED = "EXPENSE_CREATED",
  EXPENSE_UPDATED = "EXPENSE_UPDATED",
  WALLET_CREDITED = "WALLET_CREDITED",
  WALLET_DEBITED = "WALLET_DEBITED",
}

export interface IAudit {
  apartmentId: Types.ObjectId;
  performedBy?: string;

  action: AuditAction;

  entityType: string;
  entityId: Types.ObjectId;

  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;

  description?: string;

  createdAt?: Date;
}
