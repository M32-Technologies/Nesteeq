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
import { Payment } from "../payment/payment.model.js";
import { createPaymentRecordService } from "../payment/payment.service.js";
import { getAuthDB } from "../../config/auth-db.js";

import { AppError } from "../../utils/AppError.js";

interface AuditActor {
  userId: string;
}

interface CreateBillInput {
  apartmentId: string;
  residentId?: string;
  unitId: string;
  baseAmount: number;
  additionalCharges?: IAdditionalCharge[];
  lateFeePerDay?: number;
  dueDate: Date;
  createdBy?: string;
}

const getAuthUsersFilter = (userIds: string[]) => {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  const objectIds = uniqueIds
    .filter((userId) => Types.ObjectId.isValid(userId))
    .map((userId) => new Types.ObjectId(userId));

  return {
    $or: [
      { id: { $in: uniqueIds } },
      ...(objectIds.length ? [{ _id: { $in: objectIds } }] : []),
    ],
  };
};

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
  const resident = await ResidentModel.findOne({
    _id: residentId,
    apartmentId,
  })
    .select("_id flatId")
    .session(session ?? null)
    .lean();

  const flat = await Flat.findOne({
    _id: unitId,
    apartmentId,
  })
    .select("_id residentId")
    .session(session ?? null)
    .lean();

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

  if (
    resident.flatId?.toString() !== unitId.toString() &&
    flat.residentId?.toString() !== resident._id.toString()
  ) {
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
  const unitId = toObjectId(input.unitId, "unitId");

  let residentId: Types.ObjectId;
  if (input.residentId) {
    residentId = toObjectId(input.residentId, "residentId");
  } else {
    const resident = await ResidentModel.findOne({
      apartmentId,
      flatId: unitId,
      status: { $ne: "inactive" },
    });
    if (!resident) {
      const flat = await Flat.findOne({ _id: unitId, apartmentId });
      if (flat?.residentId) {
        residentId = flat.residentId;
      } else {
        throw new AppError("No active resident assigned to this unit", 400);
      }
    } else {
      residentId = resident._id;
    }
  }

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
            createdBy:
              input.createdBy && Types.ObjectId.isValid(input.createdBy)
                ? new Types.ObjectId(input.createdBy)
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

  const finalBill = createdBill as BillingDocument | null;
  if (!finalBill) {
    throw new AppError("Unable to create bill", 500);
  }

  return getBillByIdService(finalBill._id.toString());
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

  if (bills.length === 0) {
    return [];
  }

  const unitIds = bills.map((b) => b.unitId);
  const residentIds = bills.map((b) => b.residentId);

  const [flats, residents] = await Promise.all([
    Flat.find({ _id: { $in: unitIds } }, "flatNumber").lean(),
    ResidentModel.find({ _id: { $in: residentIds } }, "_id userId").lean(),
  ]);

  const flatMap = new Map(flats.map((f) => [f._id.toString(), f.flatNumber]));
  const userIds = residents
    .map((r) => r.userId)
    .filter((id): id is string => Boolean(id));

  let userMap = new Map<string, string>();
  if (userIds.length > 0) {
    const authUsers = await getAuthDB()
      .collection("user")
      .find(getAuthUsersFilter(userIds))
      .toArray();
    userMap = new Map(
      authUsers.map((u) => [u.id || u._id.toString(), u.name || "Resident"])
    );
  }

  const residentNameMap = new Map(
    residents.map((r) => [
      r._id.toString(),
      r.userId ? userMap.get(r.userId) || "Resident" : "Resident",
    ])
  );

  return bills.map((bill) => {
    const values = calculateBillValues(bill);
    const flatNum = flatMap.get(bill.unitId.toString());
    const unitName = flatNum
      ? `Flat ${flatNum}`
      : `Unit ${bill.unitId.toString().slice(-4).toUpperCase()}`;
    const residentName =
      residentNameMap.get(bill.residentId.toString()) ||
      `Resident #${bill.residentId.toString().slice(-4).toUpperCase()}`;

    return {
      ...bill,
      ...values,
      unitName,
      flatNumber: flatNum || "",
      residentName,
    };
  });
};

export const getBillRecipientsService = async (apartmentId: string) => {
  const aptId = toObjectId(apartmentId, "apartmentId");

  const [flats, residents] = await Promise.all([
    Flat.find({ apartmentId: aptId, status: { $ne: "inactive" } })
      .sort({ flatNumber: 1 })
      .lean(),
    ResidentModel.find({
      apartmentId: aptId,
      status: { $ne: "inactive" },
    }).lean(),
  ]);

  const userIds = residents
    .map((r) => r.userId)
    .filter((id): id is string => Boolean(id));
  let userMap = new Map<string, string>();
  if (userIds.length > 0) {
    const authUsers = await getAuthDB()
      .collection("user")
      .find(getAuthUsersFilter(userIds))
      .toArray();
    userMap = new Map(
      authUsers.map((u) => [u.id || u._id.toString(), u.name || "Resident"])
    );
  }

  const residentById = new Map(
    residents.map((r) => [r._id.toString(), r])
  );
  const residentByFlat = new Map(
    residents.map((r) => [r.flatId?.toString(), r])
  );

  return flats.map((flat) => {
    const res =
      (flat.residentId
        ? residentById.get(flat.residentId.toString())
        : null) || residentByFlat.get(flat._id.toString());
    const resName = res?.userId ? userMap.get(res.userId) : null;
    return {
      unitId: flat._id.toString(),
      flatNumber: flat.flatNumber,
      unitName: `Flat ${flat.flatNumber}`,
      residentId: res?._id ? res._id.toString() : null,
      residentName: resName || (res ? "Resident" : "Vacant / No Resident"),
      hasResident: Boolean(res?._id),
      residentType: res?.residentType || null,
    };
  });
};

export const getBillByIdService = async (
  billId: string
) => {
  const id = toObjectId(billId, "billId");
  const bill = await Billing.findById(id).lean();

  if (!bill) {
    throw new AppError("Bill not found", 404);
  }

  const [flat, resident] = await Promise.all([
    Flat.findById(bill.unitId, "flatNumber").lean(),
    ResidentModel.findById(bill.residentId, "userId").lean(),
  ]);

  let residentName = "Resident";
  if (resident?.userId) {
    const user = await getAuthDB()
      .collection("user")
      .findOne(getAuthUsersFilter([resident.userId]));
    if (user?.name) {
      residentName = user.name;
    }
  }

  const flatNum = flat?.flatNumber;
  const unitName = flatNum
    ? `Flat ${flatNum}`
    : `Unit ${bill.unitId.toString().slice(-4).toUpperCase()}`;

  return {
    ...bill,
    ...calculateBillValues(bill),
    unitName,
    flatNumber: flatNum || "",
    residentName,
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
  actor: AuditActor,
  options?: {
    paymentMethod?: string;
    referenceNo?: string;
    description?: string;
  }
) => {
  const session = await mongoose.startSession();
  const id = toObjectId(billId, "billId");
  let updatedBill: BillingDocument | null = null;
  let paymentId: string | undefined = undefined;

  try {
    await session.withTransaction(async () => {
      const bill = await Billing.findById(id).session(session);

      if (!bill) {
        throw new AppError("Bill not found", 404);
      }

      const methodText = options?.paymentMethod ? `Method: ${options.paymentMethod}` : "";
      const refText = options?.referenceNo ? `Ref: ${options.referenceNo}` : "";
      const customDesc = options?.description?.trim();
      const meta = [methodText, refText, customDesc].filter(Boolean).join(" | ");
      const paymentDescription = meta
        ? `Payment of ${amount} recorded (${meta})`
        : `Payment of ${amount} recorded for bill ${bill._id.toString()}`;

      const payment = await applyPaymentToBill(
        bill,
        amount,
        PaymentSource.MANUAL,
        actor,
        paymentDescription,
        session
      );

      paymentId = payment._id.toString();
      updatedBill = bill;
    });
  } finally {
    await session.endSession();
  }

  const finalBill = updatedBill as BillingDocument | null;
  if (!finalBill) {
    throw new AppError("Bill not found", 404);
  }

  const detailedBill = await getBillByIdService(finalBill._id.toString());
  return {
    ...detailedBill,
    latestPaymentId: paymentId,
  };
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

  const [agg] = await Billing.aggregate([
    {
      $match: {
        apartmentId: apartmentObjectId,
      },
    },
    {
      $group: {
        _id: null,
        totalBilled: { $sum: "$totalAmount" },
        totalCollected: { $sum: "$paidAmount" },
        totalOutstanding: { $sum: "$balanceAmount" },
        totalLateFees: { $sum: "$lateFeeAmount" },
        totalOverdue: {
          $sum: {
            $cond: [
              { $eq: ["$status", "OVERDUE"] },
              "$balanceAmount",
              0,
            ],
          },
        },
        totalBills: { $sum: 1 },
      },
    },
  ]);

  return {
    totalBilled: agg?.totalBilled || 0,
    totalCollected: agg?.totalCollected || 0,
    totalOutstanding: agg?.totalOutstanding || 0,
    totalLateFees: agg?.totalLateFees || 0,
    totalOverdue: agg?.totalOverdue || 0,
    totalBills: agg?.totalBills || 0,
  };
};

export const getMyResidentBillsService = async (user: {
  id: string;
  role: string;
  apartmentId?: string | null;
  flatId?: string | null;
}) => {
  const apartmentId = user.apartmentId;
  if (!apartmentId) {
    return {
      summary: {
        totalOutstanding: 0,
        totalPaid: 0,
        pendingCount: 0,
        overdueCount: 0,
        lateFees: 0,
      },
      bills: [],
      recentPayments: [],
    };
  }

  let flatId = user.flatId;
  let residentRecord = null;
  if (Types.ObjectId.isValid(apartmentId)) {
    residentRecord = await ResidentModel.findOne({
      apartmentId: new Types.ObjectId(apartmentId),
      userId: user.id,
    }).lean();

    if (residentRecord && !flatId) {
      flatId = residentRecord.flatId?.toString();
    }
  }

  const queryConditions: any[] = [];
  if (flatId && Types.ObjectId.isValid(flatId)) {
    queryConditions.push({ unitId: new Types.ObjectId(flatId) });
  }
  if (residentRecord?._id) {
    queryConditions.push({ residentId: residentRecord._id });
  }

  if (queryConditions.length === 0) {
    return {
      summary: {
        totalOutstanding: 0,
        totalPaid: 0,
        pendingCount: 0,
        overdueCount: 0,
        lateFees: 0,
      },
      bills: [],
      recentPayments: [],
    };
  }

  const aptObjectId = new Types.ObjectId(apartmentId);
  const bills = await Billing.find({
    apartmentId: aptObjectId,
    $or: queryConditions,
  })
    .sort({ dueDate: -1, createdAt: -1 })
    .lean();

  const formattedBills = bills.map((bill) => {
    const values = calculateBillValues(bill);
    return {
      _id: bill._id.toString(),
      apartmentId: bill.apartmentId.toString(),
      unitId: bill.unitId.toString(),
      residentId: bill.residentId.toString(),
      baseAmount: bill.baseAmount,
      additionalCharges: bill.additionalCharges || [],
      lateFeePerDay: bill.lateFeePerDay,
      lateFeeAmount: values.lateFeeAmount,
      lateFeeWaivedAmount: bill.lateFeeWaivedAmount || 0,
      totalAmount: values.totalAmount,
      paidAmount: bill.paidAmount,
      balanceAmount: values.balanceAmount,
      dueDate: bill.dueDate,
      status: values.status,
      createdAt: bill.createdAt,
    };
  });

  let totalOutstanding = 0;
  let totalPaid = 0;
  let pendingCount = 0;
  let overdueCount = 0;
  let totalLateFees = 0;

  for (const b of formattedBills) {
    totalOutstanding += b.balanceAmount;
    totalPaid += b.paidAmount;
    totalLateFees += b.lateFeeAmount;
    if (b.status === "OVERDUE") {
      overdueCount++;
    } else if (b.status === "PENDING" || b.status === "PARTIALLY_PAID") {
      pendingCount++;
    }
  }

  const paymentsRaw = await Payment.find({
    apartmentId: aptObjectId,
    $or: queryConditions,
  })
    .sort({ paidAt: -1 })
    .limit(20)
    .lean();

  const recentPayments = paymentsRaw.map((p) => ({
    _id: p._id.toString(),
    billId: p.billId?.toString(),
    amount: p.amount,
    source: p.source,
    description: p.description,
    paidAt: p.paidAt,
  }));

  return {
    summary: {
      totalOutstanding: roundMoney(totalOutstanding),
      totalPaid: roundMoney(totalPaid),
      pendingCount,
      overdueCount,
      lateFees: roundMoney(totalLateFees),
    },
    bills: formattedBills,
    recentPayments,
  };
};

export const payResidentBillService = async (
  billId: string,
  user: {
    id: string;
    role: string;
    name?: string;
    apartmentId?: string | null;
    flatId?: string | null;
  },
  payload: {
    amount?: number;
    paymentMethod?: string;
    referenceNo?: string;
    description?: string;
  }
) => {
  const id = toObjectId(billId, "billId");
  const bill = await Billing.findById(id);
  if (!bill) {
    throw new AppError("Bill not found", 404);
  }

  if (user.apartmentId && bill.apartmentId.toString() !== user.apartmentId) {
    throw new AppError("You do not have access to pay this bill", 403);
  }

  let flatId = user.flatId;
  let residentRecord = null;
  if (Types.ObjectId.isValid(user.apartmentId || "")) {
    residentRecord = await ResidentModel.findOne({
      apartmentId: new Types.ObjectId(user.apartmentId!),
      userId: user.id,
    }).lean();

    if (residentRecord && !flatId) {
      flatId = residentRecord.flatId?.toString();
    }
  }

  const isOwner =
    (flatId && bill.unitId.toString() === flatId) ||
    (residentRecord && bill.residentId.toString() === residentRecord._id.toString());

  if (!isOwner) {
    throw new AppError("You do not have access to pay this bill", 403);
  }

  const values = calculateBillValues(bill);
  if (values.balanceAmount <= 0) {
    throw new AppError("This bill is already fully settled", 400);
  }

  const payAmount =
    payload.amount && payload.amount > 0
      ? Math.min(payload.amount, values.balanceAmount)
      : values.balanceAmount;

  const actor: AuditActor = {
    userId: user.id,
  };

  const result = await recordBillPaymentService(billId, payAmount, actor, {
    paymentMethod: payload.paymentMethod || "UPI",
    referenceNo:
      payload.referenceNo || `PAY-${Date.now().toString().slice(-6)}`,
    description: payload.description || "Resident online settlement",
  });

  return {
    success: true,
    message: `Payment of ₹${payAmount} recorded successfully!`,
    bill: result,
  };
};

