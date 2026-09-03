import mongoose, {
  ClientSession,
  HydratedDocument,
  Types,
} from "mongoose";

import {
  BillStatus,
  IAdditionalCharge,
  IBilling,
} from "./billing.interface.js";
import {
  applyBillValues,
  calculateBillValues,
  roundMoney,
} from "./billing.calculation.js";
import { Billing } from "./billing.model.js";
import { AuditAction } from "../audit/audit.interface.js";
import { createAuditLogService } from "../audit/audit.service.js";
import { Flat } from "../flat/flat.model.js";
import { ResidentModel } from "../resident/resident.model.js";
import { Wallet } from "../wallet/wallet.model.js";
import { WalletTransactionType } from "../wallet/wallet.interface.js";
import { PaymentSource } from "../payment/payment.interface.js";
import { createPaymentRecordService } from "../payment/payment.service.js";

import { AppError } from "../../utils/AppError.js";

interface AuditActor {
  userId: string;
}

interface CreateBillInput {
  apartmentId: string;
  residentId: string;
  unitId: string;
  baseAmount: number;
  additionalCharges?: IAdditionalCharge[];
  lateFeePerDay?: number;
  dueDate: Date;
  createdBy?: string;
}

interface UpdateBillInput {
  baseAmount?: number;
  additionalCharges?: IAdditionalCharge[];
  lateFeePerDay?: number;
  dueDate?: Date;
}

interface BillFilters {
  apartmentId?: string;
  residentId?: string;
  unitId?: string;
  status?: BillStatus;
}

type BillingDocument = HydratedDocument<IBilling>;

const toObjectId = (value: string, field: string) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${field}`, 400);
  }

  return new Types.ObjectId(value);
};

const getBillAuditValue = (bill: BillingDocument) => ({
  residentId: bill.residentId.toString(),
  unitId: bill.unitId.toString(),
  baseAmount: bill.baseAmount,
  additionalCharges: bill.additionalCharges,
  lateFeePerDay: bill.lateFeePerDay,
  lateFeeAmount: bill.lateFeeAmount,
  lateFeeWaivedAmount: bill.lateFeeWaivedAmount,
  totalAmount: bill.totalAmount,
  paidAmount: bill.paidAmount,
  balanceAmount: bill.balanceAmount,
  dueDate: bill.dueDate,
  settledAt: bill.settledAt,
  status: bill.status,
});

const validateResidentAndUnitOwnership = async (
  apartmentId: Types.ObjectId,
  residentId: Types.ObjectId,
  unitId: Types.ObjectId,
  session?: ClientSession
) => {
  const [resident, flat] = await Promise.all([
    ResidentModel.findOne({
      _id: residentId,
      apartmentId,
    })
      .select("_id flatId")
      .session(session ?? null)
      .lean(),
    Flat.findOne({
      _id: unitId,
      apartmentId,
    })
      .select("_id")
      .session(session ?? null)
      .lean(),
  ]);

  if (!resident) {
    throw new AppError(
      "Resident does not belong to this apartment",
      403
    );
  }

  if (!flat) {
    throw new AppError(
      "Unit does not belong to this apartment",
      403
    );
  }

  if (resident.flatId?.toString() !== unitId.toString()) {
    throw new AppError(
      "Resident is not assigned to this unit",
      403
    );
  }
};

const applyPaymentToBill = async (
  bill: BillingDocument,
  amount: number,
  source: PaymentSource,
  actor: AuditActor,
  description: string,
  session: ClientSession
) => {
  const paymentAmount = roundMoney(amount);
  const currentValues = calculateBillValues(bill);

  if (paymentAmount <= 0) {
    throw new AppError(
      "Payment amount must be greater than 0",
      400
    );
  }

  if (paymentAmount > currentValues.balanceAmount) {
    throw new AppError(
      "Payment exceeds outstanding amount",
      400
    );
  }

  const oldValue = {
    paidAmount: bill.paidAmount,
    balanceAmount: currentValues.balanceAmount,
    status: currentValues.status,
  };

  bill.paidAmount = roundMoney(bill.paidAmount + paymentAmount);
  applyBillValues(bill);
  await bill.save({ session });

  const payment = await createPaymentRecordService(
    {
      apartmentId: bill.apartmentId,
      billId: bill._id,
      residentId: bill.residentId,
      unitId: bill.unitId,
      amount: paymentAmount,
      source,
      description,
      recordedBy: actor.userId,
    },
    session
  );

  await createAuditLogService(
    {
      apartmentId: bill.apartmentId.toString(),
      performedBy: actor.userId,
      action: AuditAction.PAYMENT_RECORDED,
      entityType: "Payment",
      entityId: payment._id.toString(),
      oldValue,
      newValue: {
        billId: bill._id.toString(),
        paymentAmount,
        source,
        paidAmount: bill.paidAmount,
        balanceAmount: bill.balanceAmount,
        status: bill.status,
      },
      description,
    },
    session
  );

  return payment;
};

const applyWalletCreditToBill = async (
  bill: BillingDocument,
  actor: AuditActor,
  session: ClientSession
) => {
  const currentValues = calculateBillValues(bill);

  if (currentValues.balanceAmount <= 0) {
    return;
  }

  const wallet = await Wallet.findOne({
    apartmentId: bill.apartmentId,
    residentId: bill.residentId,
    balance: { $gt: 0 },
  }).session(session);

  if (!wallet) {
    return;
  }

  const deductionAmount = roundMoney(
    Math.min(wallet.balance, currentValues.balanceAmount)
  );

  if (deductionAmount <= 0) {
    return;
  }

  const oldWalletValue = {
    residentId: wallet.residentId.toString(),
    billId: bill._id.toString(),
    balance: wallet.balance,
    totalAdded: wallet.totalAdded,
    totalUsed: wallet.totalUsed,
  };

  wallet.balance = roundMoney(wallet.balance - deductionAmount);
  wallet.totalUsed = roundMoney(
    wallet.totalUsed + deductionAmount
  );

  wallet.transactions.push({
    type: WalletTransactionType.DEBIT,
    amount: deductionAmount,
    description: "Automatic deduction for newly created bill",
    billId: bill._id,
    createdAt: new Date(),
  });

  await wallet.save({ session });

  await applyPaymentToBill(
    bill,
    deductionAmount,
    PaymentSource.WALLET,
    actor,
    `Automatic wallet payment of ${deductionAmount} applied to bill ${bill._id.toString()}`,
    session
  );

  await createAuditLogService(
    {
      apartmentId: wallet.apartmentId.toString(),
      performedBy: actor.userId,
      action: AuditAction.WALLET_DEBITED,
      entityType: "Wallet",
      entityId: wallet._id.toString(),
      oldValue: oldWalletValue,
      newValue: {
        residentId: wallet.residentId.toString(),
        billId: bill._id.toString(),
        amount: deductionAmount,
        balance: wallet.balance,
        totalAdded: wallet.totalAdded,
        totalUsed: wallet.totalUsed,
      },
      description: `Wallet ${wallet._id.toString()} debited by ${deductionAmount}`,
    },
    session
  );
};

export const createBillService = async (
  input: CreateBillInput,
  actor: AuditActor
) => {
  const session = await mongoose.startSession();
  const additionalCharges = input.additionalCharges ?? [];
  const lateFeePerDay = input.lateFeePerDay ?? 0;
  const apartmentId = toObjectId(input.apartmentId, "apartmentId");
  const residentId = toObjectId(input.residentId, "residentId");
  const unitId = toObjectId(input.unitId, "unitId");

  let createdBill: BillingDocument | null = null;

  try {
    await session.withTransaction(async () => {
      await validateResidentAndUnitOwnership(
        apartmentId,
        residentId,
        unitId,
        session
      );

      const values = calculateBillValues({
        baseAmount: input.baseAmount,
        additionalCharges,
        lateFeePerDay,
        lateFeeWaivedAmount: 0,
        paidAmount: 0,
        dueDate: input.dueDate,
      });

      const [bill] = await Billing.create(
        [
          {
            apartmentId,
            residentId,
            unitId,
            baseAmount: roundMoney(input.baseAmount),
            additionalCharges,
            lateFeePerDay: roundMoney(lateFeePerDay),
            lateFeeAmount: values.lateFeeAmount,
            lateFeeWaivedAmount: 0,
            totalAmount: values.totalAmount,
            paidAmount: 0,
            balanceAmount: values.balanceAmount,
            dueDate: input.dueDate,
            status: values.status,
            createdBy: input.createdBy
              ? toObjectId(input.createdBy, "createdBy")
              : undefined,
          },
        ],
        { session }
      );

      await createAuditLogService(
        {
          apartmentId: bill.apartmentId.toString(),
          performedBy: actor.userId,
          action: AuditAction.BILL_CREATED,
          entityType: "Billing",
          entityId: bill._id.toString(),
          newValue: getBillAuditValue(bill),
          description: `Bill ${bill._id.toString()} created`,
        },
        session
      );

      await applyWalletCreditToBill(bill, actor, session);
      createdBill = bill;
    });
  } finally {
    await session.endSession();
  }

  if (!createdBill) {
    throw new AppError("Unable to create bill", 500);
  }

  return createdBill;
};

export const getBillsService = async (
  filters: BillFilters
) => {
  const query: Record<string, unknown> = {};

  if (filters.apartmentId) {
    query.apartmentId = toObjectId(
      filters.apartmentId,
      "apartmentId"
    );
  }

  if (filters.residentId) {
    query.residentId = toObjectId(
      filters.residentId,
      "residentId"
    );
  }

  if (filters.unitId) {
    query.unitId = toObjectId(filters.unitId, "unitId");
  }

  if (filters.status) {
    query.status = filters.status;
  }

  const bills = await Billing.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return bills.map((bill) => ({
    ...bill,
    ...calculateBillValues(bill),
  }));
};

export const getBillByIdService = async (
  billId: string
) => {
  const id = toObjectId(billId, "billId");
  const bill = await Billing.findById(id).lean();

  if (!bill) {
    throw new AppError("Bill not found", 404);
  }

  return {
    ...bill,
    ...calculateBillValues(bill),
  };
};

export const updateBillService = async (
  billId: string,
  input: UpdateBillInput,
  actor: AuditActor
) => {
  const session = await mongoose.startSession();
  const id = toObjectId(billId, "billId");
  let updatedBill: BillingDocument | null = null;

  try {
    await session.withTransaction(async () => {
      const bill = await Billing.findById(id).session(session);

      if (!bill) {
        throw new AppError("Bill not found", 404);
      }

      const currentValues = calculateBillValues(bill);

      if (currentValues.status === BillStatus.PAID) {
        throw new AppError("Paid bill cannot be edited", 400);
      }

      const oldValue = {
        ...getBillAuditValue(bill),
        lateFeeAmount: currentValues.lateFeeAmount,
        totalAmount: currentValues.totalAmount,
        balanceAmount: currentValues.balanceAmount,
        status: currentValues.status,
      };

      if (input.baseAmount !== undefined) {
        bill.baseAmount = roundMoney(input.baseAmount);
      }

      if (input.additionalCharges !== undefined) {
        bill.additionalCharges = input.additionalCharges;
      }

      if (input.lateFeePerDay !== undefined) {
        bill.lateFeePerDay = roundMoney(input.lateFeePerDay);
      }

      if (input.dueDate !== undefined) {
        bill.dueDate = input.dueDate;
      }

      applyBillValues(bill);
      await bill.save({ session });

      await createAuditLogService(
        {
          apartmentId: bill.apartmentId.toString(),
          performedBy: actor.userId,
          action: AuditAction.BILL_UPDATED,
          entityType: "Billing",
          entityId: bill._id.toString(),
          oldValue,
          newValue: getBillAuditValue(bill),
          description: `Bill ${bill._id.toString()} updated`,
        },
        session
      );

      updatedBill = bill;
    });
  } finally {
    await session.endSession();
  }

  if (!updatedBill) {
    throw new AppError("Bill not found", 404);
  }

  return updatedBill;
};

export const recordBillPaymentService = async (
  billId: string,
  amount: number,
  actor: AuditActor
) => {
  const session = await mongoose.startSession();
  const id = toObjectId(billId, "billId");
  let updatedBill: BillingDocument | null = null;

  try {
    await session.withTransaction(async () => {
      const bill = await Billing.findById(id).session(session);

      if (!bill) {
        throw new AppError("Bill not found", 404);
      }

      await applyPaymentToBill(
        bill,
        amount,
        PaymentSource.MANUAL,
        actor,
        `Payment of ${amount} recorded for bill ${bill._id.toString()}`,
        session
      );

      updatedBill = bill;
    });
  } finally {
    await session.endSession();
  }

  if (!updatedBill) {
    throw new AppError("Bill not found", 404);
  }

  return updatedBill;
};

export const waiveLateFeeService = async (
  billId: string,
  amount: number,
  actor: AuditActor
) => {
  const session = await mongoose.startSession();
  const id = toObjectId(billId, "billId");
  let updatedBill: BillingDocument | null = null;

  try {
    await session.withTransaction(async () => {
      const bill = await Billing.findById(id).session(session);

      if (!bill) {
        throw new AppError("Bill not found", 404);
      }

      const currentValues = calculateBillValues(bill);
      const waiverAmount = roundMoney(amount);
      const availableLateFee = roundMoney(
        Math.max(
          0,
          currentValues.lateFeeAmount -
            bill.lateFeeWaivedAmount
        )
      );

      if (waiverAmount <= 0) {
        throw new AppError(
          "Waiver amount must be greater than 0",
          400
        );
      }

      if (waiverAmount > availableLateFee) {
        throw new AppError(
          "Waiver amount exceeds available late fee",
          400
        );
      }

      const oldValue = {
        lateFeeAmount: currentValues.lateFeeAmount,
        lateFeeWaivedAmount: bill.lateFeeWaivedAmount,
        availableLateFee,
        balanceAmount: currentValues.balanceAmount,
        status: currentValues.status,
      };

      bill.lateFeeWaivedAmount = roundMoney(
        bill.lateFeeWaivedAmount + waiverAmount
      );

      applyBillValues(bill);
      await bill.save({ session });

      await createAuditLogService(
        {
          apartmentId: bill.apartmentId.toString(),
          performedBy: actor.userId,
          action: AuditAction.LATE_FEE_WAIVED,
          entityType: "Billing",
          entityId: bill._id.toString(),
          oldValue,
          newValue: {
            waivedAmount: waiverAmount,
            lateFeeAmount: bill.lateFeeAmount,
            lateFeeWaivedAmount: bill.lateFeeWaivedAmount,
            effectiveLateFee: roundMoney(
              Math.max(
                0,
                bill.lateFeeAmount - bill.lateFeeWaivedAmount
              )
            ),
            balanceAmount: bill.balanceAmount,
            status: bill.status,
          },
          description: `Late fee waiver of ${waiverAmount} applied to bill ${bill._id.toString()}`,
        },
        session
      );

      updatedBill = bill;
    });
  } finally {
    await session.endSession();
  }

  if (!updatedBill) {
    throw new AppError("Bill not found", 404);
  }

  return updatedBill;
};

export const getBillingSummaryService = async (
  apartmentId: string
) => {
  const apartmentObjectId = toObjectId(
    apartmentId,
    "apartmentId"
  );

  const bills = await Billing.find({
    apartmentId: apartmentObjectId,
  }).lean();

  return bills.reduce(
    (summary, bill) => {
      const values = calculateBillValues(bill);

      summary.totalBilled += values.totalAmount;
      summary.totalCollected += bill.paidAmount;
      summary.totalOutstanding += values.balanceAmount;
      summary.totalLateFees += values.lateFeeAmount;
      summary.totalBills += 1;

      return summary;
    },
    {
      totalBilled: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      totalLateFees: 0,
      totalBills: 0,
    }
  );
};
