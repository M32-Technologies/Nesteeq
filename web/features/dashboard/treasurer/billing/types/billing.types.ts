export type {
  AdditionalCharge,
  Bill,
  BillRecipient,
  BillStatus,
  CreateBillPayload,
  GetBillsParams,
  UpdateBillPayload,
} from "../../services/treasurer.service";

export interface RecordBillPaymentPayload {
  amount: number;
}

export interface WaiveLateFeePayload {
  amount: number;
}
