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
  getAdditionalTotal,
  roundMoney,
} from "./billing.calculation.js";
import { Billing } from "./billing.model.js";
import {
  CommonBill,
  CommonBillStatus,
  CommonBillTargetType,
  BillType,
} from "./common-bill.model.js";
import { AuditAction } from "../audit/audit.interface.js";
import { createAuditLogService } from "../audit/audit.service.js";
import { Flat } from "../flat/flat.model.js";
import { Block } from "../block/block.model.js";
import { Apartment } from "../apartment/apartment.model.js";
import { ResidentModel } from "../resident/resident.model.js";
import { Wallet } from "../wallet/wallet.model.js";
import { WalletTransactionType } from "../wallet/wallet.interface.js";
import { deductWalletFundsService } from "../wallet/wallet.service.js";
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
  title?: string;
  billType?: BillType;
  billingPeriod?: string | null;
  description?: string | null;
  baseAmount: number;
  additionalCharges?: IAdditionalCharge[];
  lateFeePerDay?: number;
  dueDate: Date;
  createdBy?: string;
}

export interface CreateCommonBillInput {
  apartmentId: string;
  title: string;
  billType: BillType;
  billingPeriod?: string | null;
  description?: string | null;
  baseAmount: number;
  additionalCharges?: IAdditionalCharge[];
  lateFeePerDay?: number;
  dueDate: Date;
  targetType: "ALL_FLATS" | "BY_BLOCK" | "CUSTOM_FLATS";
  targetBlockIds?: string[];
  targetFlatIds?: string[];
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
  commonBillId?: string;
  billType?: string;
  status?: BillStatus;
  search?: string;
  page?: number;
  limit?: number;
  userRole?: string;
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
  residentId: Types.ObjectId | null | undefined,
  unitId: Types.ObjectId,
  session?: ClientSession
) => {
  const flat = await Flat.findOne({
    _id: unitId,
    apartmentId,
  })
    .select("_id residentId")
    .session(session ?? null)
    .lean();

  if (!flat) {
    throw new AppError(
      "Unit does not belong to this apartment",
      403
    );
  }

  if (residentId) {
    const resident = await ResidentModel.findOne({
      _id: residentId,
      apartmentId,
    })
      .select("_id flatId")
      .session(session ?? null)
      .lean();

    if (!resident) {
      throw new AppError(
        "Resident does not belong to this apartment",
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
  }
};

const resolveOrCreateResidentForUnit = async (
  apartmentId: Types.ObjectId,
  unitId: Types.ObjectId,
  session?: ClientSession
): Promise<Types.ObjectId> => {
  const resident = await ResidentModel.findOne({
    apartmentId,
    flatId: unitId,
    status: { $ne: "inactive" },
  }).session(session ?? null);

  if (resident) {
    return resident._id;
  }

  const flat = await Flat.findOne({ _id: unitId, apartmentId }).session(session ?? null);
  if (flat?.residentId && Types.ObjectId.isValid(flat.residentId)) {
    return new Types.ObjectId(flat.residentId);
  }

  const newResident = new ResidentModel({
    apartmentId,
    flatId: unitId,
    residentType: "owner",
    status: "pending",
  });
  await newResident.save({ session });

  if (flat && !flat.residentId) {
    flat.residentId = newResident._id;
    await flat.save({ session });
  }

  return newResident._id;
};

const applyPaymentToBill = async (
  bill: BillingDocument,
  amount: number,
  source: PaymentSource,
  actor: AuditActor,
  description: string,
  session: ClientSession,
  paymentDetails?: {
    paymentMethod?: string;
    referenceNo?: string;
  }
) => {
  const paymentAmount = roundMoney(amount);
  const currentValues = calculateBillValues(bill);

  if (
    bill.status === BillStatus.CANCELLED ||
    currentValues.status === BillStatus.CANCELLED
  ) {
    throw new AppError(
      "Cannot record payment on a cancelled bill",
      400
    );
  }

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
      paymentMethod: paymentDetails?.paymentMethod,
      referenceNo: paymentDetails?.referenceNo,
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

  if (!bill.residentId || currentValues.balanceAmount <= 0) {
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

  let residentId: Types.ObjectId | null = null;
  if (input.residentId) {
    residentId = toObjectId(input.residentId, "residentId");
  }

  let createdBill: BillingDocument | null = null;

  try {
    await session.withTransaction(async () => {
      if (!residentId) {
        residentId = await resolveOrCreateResidentForUnit(
          apartmentId,
          unitId,
          session
        );
      }

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

      const bill = new Billing({
        apartmentId,
        residentId,
        unitId,
        title: input.title?.trim() || undefined,
        billType: input.billType || BillType.MONTHLY_MAINTENANCE,
        billingPeriod: input.billingPeriod || undefined,
        description: input.description?.trim() || undefined,
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
      });

      await bill.save({ session });
      createdBill = bill;

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

const escapeRegex = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const populateBillEntities = async (bills: any[]) => {
  if (bills.length === 0) {
    return [];
  }

  const unitIds = bills.map((b) => b.unitId);
  const residentIds = bills.map((b) => b.residentId).filter(Boolean);

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
    const residentName = bill.residentId
      ? residentNameMap.get(bill.residentId.toString()) ||
      `Resident #${bill.residentId.toString().slice(-4).toUpperCase()}`
      : "Vacant (No Resident)";

    return {
      ...bill,
      ...values,
      unitName,
      flatNumber: flatNum || "",
      residentName,
    };
  });
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

  if (filters.commonBillId) {
    query.commonBillId = toObjectId(filters.commonBillId, "commonBillId");
  }

  if (filters.billType) {
    query.billType = filters.billType;
  }

  if (filters.status) {
    query.status = filters.status;
  } else if (filters.userRole === "property_manager") {
    query.status = { $ne: BillStatus.CANCELLED };
  }

  if (filters.search) {
    const rawSearch = filters.search.trim();
    const safeSearch = escapeRegex(rawSearch);
    const searchRegex = new RegExp(safeSearch, "i");

    const flatQuery: Record<string, unknown> = { flatNumber: searchRegex };
    if (query.apartmentId) {
      flatQuery.apartmentId = query.apartmentId;
    }
    const matchingFlats = await Flat.find(flatQuery, "_id").lean();
    const matchingFlatIds = matchingFlats.map((f) => f._id);

    let matchingResidentIds: Types.ObjectId[] = [];
    try {
      const authUsers = await getAuthDB()
        .collection("user")
        .find({ name: searchRegex })
        .project({ _id: 1, id: 1 })
        .toArray();
      const matchedUserIds = authUsers
        .map((u) => u.id || u._id.toString())
        .filter(Boolean);

      if (matchedUserIds.length > 0) {
        const residentQuery: Record<string, unknown> = {
          userId: { $in: matchedUserIds },
        };
        if (query.apartmentId) {
          residentQuery.apartmentId = query.apartmentId;
        }
        const matchingResidents = await ResidentModel.find(residentQuery, "_id").lean();
        matchingResidentIds = matchingResidents.map((r) => r._id);
      }
    } catch {
      // Ignore if auth db lookup fails
    }

    const searchConditions: Array<Record<string, unknown>> = [
      { title: searchRegex },
      { billingPeriod: searchRegex },
      { description: searchRegex },
    ];

    if (matchingFlatIds.length > 0) {
      searchConditions.push({ unitId: { $in: matchingFlatIds } });
    }
    if (matchingResidentIds.length > 0) {
      searchConditions.push({ residentId: { $in: matchingResidentIds } });
    }

    query.$or = searchConditions;
  }

  const isPm = filters.userRole === "property_manager";
  if (filters.page || isPm) {
    const total = await Billing.countDocuments(query);
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || (isPm ? 10 : 8));
    const totalPages = Math.ceil(total / limit) || 1;

    const bills = await Billing.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const populatedBills = await populateBillEntities(bills);

    return {
      bills: populatedBills,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  const bills = await Billing.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return populateBillEntities(bills);
};

export const getBillRecipientsService = async (apartmentId: string) => {
  const aptId = toObjectId(apartmentId, "apartmentId");

  const [flats, residents, blocks] = await Promise.all([
    Flat.find({ apartmentId: aptId, status: { $ne: "inactive" } })
      .sort({ flatNumber: 1 })
      .lean(),
    ResidentModel.find({
      apartmentId: aptId,
      status: { $ne: "inactive" },
    }).lean(),
    Block.find({ apartmentId: aptId, status: { $ne: "inactive" } }).lean(),
  ]);

  const blockMap = new Map(blocks.map((b) => [b._id.toString(), b.blockname]));

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
      blockId: flat.blockId ? flat.blockId.toString() : null,
      blockName: flat.blockId ? blockMap.get(flat.blockId.toString()) || null : null,
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

      if (
        bill.status === BillStatus.CANCELLED ||
        currentValues.status === BillStatus.CANCELLED
      ) {
        throw new AppError("Cancelled bill cannot be edited", 400);
      }

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
        const newBase = roundMoney(input.baseAmount);
        const additionalTotal = getAdditionalTotal(
          input.additionalCharges ?? bill.additionalCharges
        );
        if (newBase + additionalTotal < bill.paidAmount) {
          throw new AppError(
            `Total bill amount cannot be less than the amount already paid (₹${bill.paidAmount})`,
            400
          );
        }
        bill.baseAmount = newBase;
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
        session,
        {
          paymentMethod: options?.paymentMethod,
          referenceNo: options?.referenceNo,
        }
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
  actor: AuditActor,
  reason?: string
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

      if (
        bill.status === BillStatus.CANCELLED ||
        currentValues.status === BillStatus.CANCELLED
      ) {
        throw new AppError(
          "Cannot waive late fee on a cancelled bill",
          400
        );
      }

      if (currentValues.status === BillStatus.PAID || currentValues.balanceAmount <= 0) {
        throw new AppError(
          "Cannot waive late fee on an already paid or settled bill",
          400
        );
      }

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
            reason: reason || undefined,
          },
          description: reason
            ? `Late fee waiver of ${waiverAmount} applied to bill ${bill._id.toString()} (Reason: ${reason})`
            : `Late fee waiver of ${waiverAmount} applied to bill ${bill._id.toString()}`,
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
  const now = new Date();

  const [agg] = await Billing.aggregate([
    {
      $match: {
        apartmentId: apartmentObjectId,
        status: { $ne: BillStatus.CANCELLED },
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
              {
                $and: [
                  { $gt: ["$balanceAmount", 0] },
                  {
                    $or: [
                      { $eq: ["$status", "OVERDUE"] },
                      { $lt: ["$dueDate", now] },
                    ],
                  },
                ],
              },
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

export interface ResidentBillsQuery {
  scope?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  receiptsPage?: number;
  receiptsLimit?: number;
}

export const getMyResidentBillsService = async (
  user: {
    id: string;
    role: string;
    apartmentId?: string | null;
    flatId?: string | null;
  },
  query?: ResidentBillsQuery
) => {
  let apartmentId = user.apartmentId;
  let flatId = user.flatId;
  let residentRecord: any = null;

  // 1. Resolve apartment and resident profile from DB if not present in session
  if (!apartmentId && Types.ObjectId.isValid(user.id)) {
    residentRecord = await ResidentModel.findOne({
      $or: [
        { userId: user.id },
        { _id: new Types.ObjectId(user.id) },
      ],
      status: { $ne: "inactive" },
    }).lean();

    if (residentRecord) {
      apartmentId = residentRecord.apartmentId?.toString();
      flatId = residentRecord.flatId?.toString();
    }
  } else if (apartmentId && Types.ObjectId.isValid(apartmentId)) {
    residentRecord = await ResidentModel.findOne({
      apartmentId: new Types.ObjectId(apartmentId),
      $or: [
        { userId: user.id },
        ...(Types.ObjectId.isValid(user.id) ? [{ _id: new Types.ObjectId(user.id) }] : []),
      ],
      status: { $ne: "inactive" },
    }).lean();

    if (residentRecord && !flatId) {
      flatId = residentRecord.flatId?.toString();
    }
  }

  if (!flatId && user.flatId) {
    flatId = user.flatId;
  }

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

  const aptObjectId = new Types.ObjectId(apartmentId);

  // 2. Resolve flat document if flatId is missing or needs lookup
  let flatDoc: any = null;
  if (flatId && Types.ObjectId.isValid(flatId)) {
    flatDoc = await Flat.findById(flatId).lean();
  } else if (residentRecord?._id) {
    flatDoc = await Flat.findOne({
      apartmentId: aptObjectId,
      residentId: residentRecord._id,
    }).lean();
    if (flatDoc) {
      flatId = flatDoc._id.toString();
    }
  }

  // 3. Ensure any Common Bills created by the Treasurer targeting this flat are instantiated
  if (flatDoc) {
    try {
      const activeCommonBills = await CommonBill.find({
        apartmentId: aptObjectId,
        status: CommonBillStatus.ACTIVE,
      }).lean();

      for (const cb of activeCommonBills) {
        let isTargeted = false;
        if (cb.targetType === CommonBillTargetType.ALL_FLATS) {
          isTargeted = true;
        } else if (cb.targetType === CommonBillTargetType.BY_BLOCK && flatDoc.blockId) {
          isTargeted = (cb.targetBlockIds || []).some(
            (bId: any) => bId.toString() === flatDoc.blockId.toString()
          );
        } else if (cb.targetType === CommonBillTargetType.CUSTOM_FLATS) {
          isTargeted = (cb.targetFlatIds || []).some(
            (fId: any) => fId.toString() === flatDoc._id.toString()
          );
        }

        if (isTargeted) {
          const existingBill = await Billing.findOne({
            apartmentId: aptObjectId,
            commonBillId: cb._id,
            unitId: flatDoc._id,
          });

          if (!existingBill) {
            const values = calculateBillValues({
              baseAmount: cb.baseAmount,
              additionalCharges: cb.additionalCharges || [],
              lateFeePerDay: cb.lateFeePerDay || 0,
              lateFeeWaivedAmount: 0,
              paidAmount: 0,
              dueDate: cb.dueDate,
            });

            await Billing.create({
              apartmentId: aptObjectId,
              residentId: residentRecord?._id || new Types.ObjectId(user.id),
              unitId: flatDoc._id,
              commonBillId: cb._id,
              title: cb.title,
              billType: cb.billType,
              billingPeriod: cb.billingPeriod || undefined,
              description: cb.description || undefined,
              baseAmount: roundMoney(cb.baseAmount),
              additionalCharges: cb.additionalCharges || [],
              lateFeePerDay: roundMoney(cb.lateFeePerDay || 0),
              lateFeeAmount: values.lateFeeAmount,
              lateFeeWaivedAmount: 0,
              totalAmount: values.totalAmount,
              paidAmount: 0,
              balanceAmount: values.balanceAmount,
              dueDate: cb.dueDate,
              status: values.status,
              createdBy: cb.createdBy || undefined,
            });
          }
        }
      }
    } catch (syncErr) {
      // Non-blocking sync error logging
      console.error("Common bill sync error in getMyResidentBillsService:", syncErr);
    }
  }

  // 4. Build query conditions for this resident's bills (both separate & common)
  const queryConditions: any[] = [];
  if (flatId && Types.ObjectId.isValid(flatId)) {
    queryConditions.push({ unitId: new Types.ObjectId(flatId) });
  }
  if (residentRecord?._id) {
    queryConditions.push({ residentId: residentRecord._id });
  }
  if (Types.ObjectId.isValid(user.id)) {
    queryConditions.push({ residentId: new Types.ObjectId(user.id) });
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

  const bills = await Billing.find({
    apartmentId: aptObjectId,
    $or: queryConditions,
    status: { $ne: BillStatus.CANCELLED },
  })
    .sort({ dueDate: -1, createdAt: -1 })
    .lean();

  // 5. Fetch associated CommonBills for parent details
  const commonBillIds = Array.from(
    new Set(
      bills
        .map((b) => b.commonBillId?.toString())
        .filter((id): id is string => Boolean(id))
    )
  );

  let commonBillMap = new Map<string, any>();
  if (commonBillIds.length > 0) {
    const commonBills = await CommonBill.find({
      _id: { $in: commonBillIds.map((id) => new Types.ObjectId(id)) },
    }).lean();
    commonBillMap = new Map(commonBills.map((cb) => [cb._id.toString(), cb]));
  }

  const formattedBills = bills.map((bill) => {
    const values = calculateBillValues(bill);
    const common = bill.commonBillId
      ? commonBillMap.get(bill.commonBillId.toString())
      : null;

    const isCommonBill = Boolean(bill.commonBillId);
    const billScope = isCommonBill ? "COMMON" : "SEPARATE";
    const title =
      bill.title ||
      common?.title ||
      (isCommonBill ? "Society Common Bill" : "Individual Maintenance Bill");
    const billType = bill.billType || common?.billType || "MONTHLY_MAINTENANCE";
    const billingPeriod =
      bill.billingPeriod || common?.billingPeriod || undefined;
    const description = bill.description || common?.description || undefined;

    return {
      _id: bill._id.toString(),
      apartmentId: bill.apartmentId.toString(),
      unitId: bill.unitId.toString(),
      residentId: bill.residentId.toString(),
      commonBillId: bill.commonBillId ? bill.commonBillId.toString() : null,
      isCommonBill,
      billScope,
      title,
      billType,
      billingPeriod,
      description,
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

  formattedBills.sort((a, b) => {
    const isUnpaidA =
      a.status !== "PAID" &&
      (a.balanceAmount > 0 ||
        a.status === "PENDING" ||
        a.status === "OVERDUE" ||
        a.status === "PARTIALLY_PAID");
    const isUnpaidB =
      b.status !== "PAID" &&
      (b.balanceAmount > 0 ||
        b.status === "PENDING" ||
        b.status === "OVERDUE" ||
        b.status === "PARTIALLY_PAID");

    // 1. Unpaid / payable bills come first
    if (isUnpaidA && !isUnpaidB) return -1;
    if (!isUnpaidA && isUnpaidB) return 1;

    // 2. Within the same group, newest created bills come first
    const timeA = new Date(a.createdAt || a.dueDate || 0).getTime();
    const timeB = new Date(b.createdAt || b.dueDate || 0).getTime();
    return timeB - timeA;
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

  const billObjectIds = bills.map((b) => b._id);
  const paymentQueryConditions: any[] = [...queryConditions];
  if (billObjectIds.length > 0) {
    paymentQueryConditions.push({ billId: { $in: billObjectIds } });
  }

  const paymentsRaw = await Payment.find({
    apartmentId: aptObjectId,
    reversed: { $ne: true },
    $or: paymentQueryConditions,
  })
    .sort({ paidAt: -1 })
    .limit(100)
    .lean();

  const handledBillIds = new Set<string>();
  const recentPayments: any[] = paymentsRaw.map((p) => {
    const matchedBill = formattedBills.find((b) => b._id === p.billId?.toString());
    if (p.billId) handledBillIds.add(p.billId.toString());
    return {
      _id: p._id.toString(),
      billId: p.billId?.toString(),
      receiptNumber: p.receiptNumber || `REC-${p._id.toString().slice(-6).toUpperCase()}`,
      amount: p.amount,
      source: p.source,
      paymentMethod: p.paymentMethod || "ONLINE",
      referenceNo: p.referenceNo,
      description: p.description,
      paidAt: p.paidAt,
      billTitle: matchedBill?.title,
      billingPeriod: matchedBill?.billingPeriod,
      billScope: matchedBill?.billScope,
    };
  });

  // Also include completed / paid bills that don't have a distinct Payment record
  for (const b of formattedBills) {
    const isCompleted =
      b.status === "PAID" ||
      (b.balanceAmount === 0 && b.totalAmount > 0) ||
      (b.paidAmount > 0 && b.balanceAmount === 0);

    if (isCompleted && !handledBillIds.has(b._id)) {
      recentPayments.push({
        _id: b._id,
        billId: b._id,
        receiptNumber: `REC-${b._id.slice(-6).toUpperCase()}`,
        amount: b.paidAmount > 0 ? b.paidAmount : b.totalAmount,
        source: b.isCommonBill ? "SOCIETY COMMON" : "DIRECT / TREASURER",
        paymentMethod: "TREASURER SETTLED",
        referenceNo: `BILL-${b._id.slice(-6).toUpperCase()}`,
        description: b.description || `${b.title} - Settled in full`,
        paidAt: b.dueDate || b.createdAt,
        billTitle: b.title,
        billingPeriod: b.billingPeriod,
        billScope: b.billScope,
      });
      handledBillIds.add(b._id);
    }
  }

  // Sort receipts by paidAt desc
  recentPayments.sort((a, b) => {
    const timeA = a.paidAt ? new Date(a.paidAt).getTime() : 0;
    const timeB = b.paidAt ? new Date(b.paidAt).getTime() : 0;
    return timeB - timeA;
  });

  const commonBillsCount = formattedBills.filter(
    (b) => b.isCommonBill || b.billScope === "COMMON"
  ).length;
  const separateBillsCount = formattedBills.filter(
    (b) => !b.isCommonBill && b.billScope !== "COMMON"
  ).length;

  let filteredBills = formattedBills;

  if (query?.scope === "COMMON") {
    filteredBills = filteredBills.filter(
      (b) => b.isCommonBill || b.billScope === "COMMON"
    );
  } else if (query?.scope === "SEPARATE") {
    filteredBills = filteredBills.filter(
      (b) => !b.isCommonBill && b.billScope !== "COMMON"
    );
  }

  if (query?.category && query.category !== "ALL") {
    filteredBills = filteredBills.filter(
      (b) => (b.billType || "MONTHLY_MAINTENANCE") === query.category
    );
  }

  if (query?.search?.trim()) {
    const q = query.search.toLowerCase().trim();
    filteredBills = filteredBills.filter((b) => {
      const title = (b.title || "").toLowerCase();
      const period = (b.billingPeriod || "").toLowerCase();
      const desc = (b.description || "").toLowerCase();
      const type = (b.billType || "").toLowerCase();
      const id = (b._id || "").toLowerCase();
      const shortId = id.slice(-6);

      return (
        title.includes(q) ||
        period.includes(q) ||
        desc.includes(q) ||
        type.includes(q) ||
        id.includes(q) ||
        shortId.includes(q)
      );
    });
  }

  const invoicesPage = Math.max(1, Number(query?.page) || 1);
  const invoicesLimit = Math.max(1, Number(query?.limit) || 8);
  const totalBills = filteredBills.length;
  const paginatedBills = query?.page
    ? filteredBills.slice((invoicesPage - 1) * invoicesLimit, invoicesPage * invoicesLimit)
    : filteredBills;

  const receiptsPage = Math.max(1, Number(query?.receiptsPage) || 1);
  const receiptsLimit = Math.max(1, Number(query?.receiptsLimit) || 8);
  const totalReceipts = recentPayments.length;
  const paginatedReceipts = query?.receiptsPage
    ? recentPayments.slice((receiptsPage - 1) * receiptsLimit, receiptsPage * receiptsLimit)
    : recentPayments;

  if (!query?.page && !query?.receiptsPage && !query?.scope && !query?.category && !query?.search) {
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
  }

  return {
    summary: {
      totalOutstanding: roundMoney(totalOutstanding),
      totalPaid: roundMoney(totalPaid),
      pendingCount,
      overdueCount,
      lateFees: roundMoney(totalLateFees),
    },
    bills: paginatedBills,
    allBills: formattedBills,
    recentPayments: paginatedReceipts,
    allRecentPayments: recentPayments,
    counts: {
      allBillsCount: formattedBills.length,
      commonBillsCount,
      separateBillsCount,
    },
    pagination: {
      total: totalBills,
      page: invoicesPage,
      limit: invoicesLimit,
      totalPages: Math.ceil(totalBills / invoicesLimit) || 1,
    },
    receiptsPagination: {
      total: totalReceipts,
      page: receiptsPage,
      limit: receiptsLimit,
      totalPages: Math.ceil(totalReceipts / receiptsLimit) || 1,
    },
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

  if (bill.status === BillStatus.CANCELLED) {
    throw new AppError("Cannot pay a cancelled bill", 400);
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

  const isWalletPayment = payload.paymentMethod === "WALLET";

  if (isWalletPayment) {
    const resolvedResidentId =
      residentRecord?._id?.toString() || bill.residentId?.toString();

    if (!resolvedResidentId) {
      throw new AppError("No resident profile found to access wallet", 400);
    }

    let wallet = await Wallet.findOne({
      apartmentId: bill.apartmentId,
      residentId: new Types.ObjectId(resolvedResidentId),
    });

    if (!wallet && bill.residentId) {
      wallet = await Wallet.findOne({
        apartmentId: bill.apartmentId,
        residentId: bill.residentId,
      });
    }

    if (!wallet) {
      throw new AppError(
        "No advance wallet found for this resident. Please deposit advance funds first.",
        404
      );
    }

    if (wallet.balance < payAmount) {
      throw new AppError(
        `Insufficient wallet balance (Available: ₹${wallet.balance}, Required: ₹${payAmount})`,
        400
      );
    }

    const effectiveResidentId = wallet.residentId.toString();

    if (bill.residentId.toString() !== effectiveResidentId) {
      bill.residentId = wallet.residentId;
      await bill.save();
    }

    const debitedWallet = await deductWalletFundsService(
      bill.apartmentId.toString(),
      effectiveResidentId,
      bill._id.toString(),
      payAmount,
      payload.description || "Bill settled via resident wallet",
      actor
    );

    const updatedBill = await Billing.findById(bill._id);

    const remainingBalance =
      (debitedWallet as any)?.balance !== undefined
        ? (debitedWallet as any).balance
        : Math.max(0, wallet.balance - payAmount);

    return {
      success: true,
      message: `Payment of ₹${payAmount} settled from Advance Wallet! Remaining balance: ₹${remainingBalance}`,
      bill: updatedBill,
    };
  }

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

export const payAllResidentBillsService = async (
  user: {
    id: string;
    role: string;
    name?: string;
    apartmentId?: string | null;
    flatId?: string | null;
  },
  payload: {
    paymentMethod?: string;
    referenceNo?: string;
    description?: string;
    billIds?: string[];
  }
) => {
  let apartmentId = user.apartmentId;
  let flatId = user.flatId;
  let residentRecord: any = null;

  // Resolve apartment and resident profile from DB if not present in session
  if (!apartmentId && Types.ObjectId.isValid(user.id)) {
    residentRecord = await ResidentModel.findOne({
      $or: [
        { userId: user.id },
        { _id: new Types.ObjectId(user.id) },
      ],
      status: { $ne: "inactive" },
    }).lean();

    if (residentRecord) {
      apartmentId = residentRecord.apartmentId?.toString();
      flatId = residentRecord.flatId?.toString();
    }
  } else if (apartmentId && Types.ObjectId.isValid(apartmentId)) {
    residentRecord = await ResidentModel.findOne({
      apartmentId: new Types.ObjectId(apartmentId),
      $or: [
        { userId: user.id },
        ...(Types.ObjectId.isValid(user.id) ? [{ _id: new Types.ObjectId(user.id) }] : []),
      ],
      status: { $ne: "inactive" },
    }).lean();

    if (residentRecord && !flatId) {
      flatId = residentRecord.flatId?.toString();
    }
  }

  if (!flatId && user.flatId) {
    flatId = user.flatId;
  }

  if (!apartmentId) {
    throw new AppError("Apartment association required to settle bills", 400);
  }

  const aptObjectId = new Types.ObjectId(apartmentId);

  // Build query conditions for this resident's bills
  const queryConditions: any[] = [];
  if (flatId && Types.ObjectId.isValid(flatId)) {
    queryConditions.push({ unitId: new Types.ObjectId(flatId) });
  }
  if (residentRecord?._id) {
    queryConditions.push({ residentId: residentRecord._id });
  }
  if (Types.ObjectId.isValid(user.id)) {
    queryConditions.push({ residentId: new Types.ObjectId(user.id) });
  }

  if (queryConditions.length === 0) {
    throw new AppError("No resident profile or unit found", 400);
  }

  // Find candidate unpaid bills
  const billFilter: any = {
    apartmentId: aptObjectId,
    $or: queryConditions,
    status: { $in: ["PENDING", "OVERDUE", "PARTIALLY_PAID"] },
  };

  if (payload.billIds && payload.billIds.length > 0) {
    billFilter._id = { $in: payload.billIds.map((id) => toObjectId(id, "billId")) };
  }

  const unpaidBills = await Billing.find(billFilter).sort({ dueDate: 1, createdAt: 1 });

  if (!unpaidBills || unpaidBills.length === 0) {
    throw new AppError("No outstanding bills found to pay", 400);
  }

  // Filter bills that actually have remaining balance > 0
  const actionableBills = unpaidBills.filter((b) => {
    const vals = calculateBillValues(b);
    return vals.balanceAmount > 0;
  });

  if (actionableBills.length === 0) {
    throw new AppError("All selected bills are already fully settled", 400);
  }

  const totalOutstanding = roundMoney(
    actionableBills.reduce((acc, b) => acc + calculateBillValues(b).balanceAmount, 0)
  );

  const actor: AuditActor = {
    userId: user.id,
  };

  const isWalletPayment = payload.paymentMethod === "WALLET";
  let resolvedResidentId = residentRecord?._id?.toString() || user.id;

  if (isWalletPayment) {
    let wallet = await Wallet.findOne({
      apartmentId: aptObjectId,
      residentId: new Types.ObjectId(resolvedResidentId),
    });

    if (!wallet && residentRecord?._id) {
      wallet = await Wallet.findOne({
        apartmentId: aptObjectId,
        residentId: residentRecord._id,
      });
    }

    if (!wallet) {
      throw new AppError(
        "No advance wallet found for this resident. Please deposit advance funds first.",
        404
      );
    }

    if (wallet.balance < totalOutstanding) {
      throw new AppError(
        `Insufficient wallet balance (Available: ₹${wallet.balance}, Required: ₹${totalOutstanding})`,
        400
      );
    }

    resolvedResidentId = wallet.residentId.toString();
  }

  const batchRef =
    payload.referenceNo?.trim() || `BULK-${Date.now().toString().slice(-6)}`;
  const paidBillIds: string[] = [];

  for (const bill of actionableBills) {
    const vals = calculateBillValues(bill);
    const payAmount = vals.balanceAmount;
    if (payAmount <= 0) continue;

    if (isWalletPayment) {
      if (bill.residentId.toString() !== resolvedResidentId) {
        bill.residentId = new Types.ObjectId(resolvedResidentId);
        await bill.save();
      }

      await deductWalletFundsService(
        bill.apartmentId.toString(),
        resolvedResidentId,
        bill._id.toString(),
        payAmount,
        payload.description || `Bulk settlement: ${bill.title || "Bill"}`,
        actor
      );
    } else {
      await recordBillPaymentService(bill._id.toString(), payAmount, actor, {
        paymentMethod: payload.paymentMethod || "UPI",
        referenceNo: batchRef,
        description: payload.description || `Total bill payment (${bill.title || "Bill"})`,
      });
    }

    paidBillIds.push(bill._id.toString());
  }

  return {
    success: true,
    message: `Payment of ₹${totalOutstanding} settled successfully for ${paidBillIds.length} bills!`,
    totalAmount: totalOutstanding,
    paidCount: paidBillIds.length,
    paidBillIds,
  };
};

export const createCommonBillService = async (
  input: CreateCommonBillInput,
  actor: AuditActor
) => {
  const aptId = toObjectId(input.apartmentId, "apartmentId");

  // 1. Deduplication check: if billingPeriod is specified, prevent duplicate active common bill for same type & period
  if (input.billingPeriod && input.targetType === "ALL_FLATS") {
    const existing = await CommonBill.findOne({
      apartmentId: aptId,
      billType: input.billType,
      billingPeriod: input.billingPeriod,
      targetType: CommonBillTargetType.ALL_FLATS,
      status: CommonBillStatus.ACTIVE,
    });
    if (existing) {
      throw new AppError(
        `A broadcast common bill for "${existing.title}" (${input.billingPeriod}) has already been generated for all flats.`,
        409
      );
    }
  }

  // 2. Resolve target flats
  const flatQuery: Record<string, unknown> = {
    apartmentId: aptId,
    status: { $ne: "inactive" },
  };

  if (input.targetType === "BY_BLOCK" && input.targetBlockIds?.length) {
    flatQuery.blockId = {
      $in: input.targetBlockIds.map((id) => toObjectId(id, "targetBlockId")),
    };
  } else if (input.targetType === "CUSTOM_FLATS" && input.targetFlatIds?.length) {
    flatQuery._id = {
      $in: input.targetFlatIds.map((id) => toObjectId(id, "targetFlatId")),
    };
  }

  const flats = await Flat.find(flatQuery).lean();
  if (flats.length === 0) {
    throw new AppError("No matching flats found for the selected target criteria", 400);
  }

  // 3. Map flats to active residents
  const flatIds = flats.map((f) => f._id);
  const residents = await ResidentModel.find({
    apartmentId: aptId,
    flatId: { $in: flatIds },
    status: { $ne: "inactive" },
  }).lean();

  const residentByFlat = new Map(residents.map((r) => [r.flatId.toString(), r]));

  // Also check if any flat has a direct residentId assigned
  let validUnits: { flat: typeof flats[0]; residentId?: Types.ObjectId }[] = [];
  for (const flat of flats) {
    const res = residentByFlat.get(flat._id.toString());
    const resId = res?._id || (flat.residentId && Types.ObjectId.isValid(flat.residentId) ? flat.residentId : null);
    validUnits.push({
      flat,
      residentId: resId ? new Types.ObjectId(resId) : undefined,
    });
  }

  if (validUnits.length === 0) {
    throw new AppError("No matching flats found for the selected target criteria.", 400);
  }

  // Deduplicate against already billed units for the same billType and billingPeriod
  if (input.billingPeriod && validUnits.length > 0) {
    const alreadyBilled = await Billing.find({
      apartmentId: aptId,
      unitId: { $in: validUnits.map((u) => u.flat._id) },
      billType: input.billType,
      billingPeriod: input.billingPeriod,
    })
      .select("unitId")
      .lean();

    if (alreadyBilled.length > 0) {
      if (alreadyBilled.length === validUnits.length) {
        throw new AppError(
          `All targeted flats have already been billed for ${input.billType} in ${input.billingPeriod}.`,
          409
        );
      }
      const alreadyBilledSet = new Set(
        alreadyBilled.map((b) => b.unitId.toString())
      );
      validUnits = validUnits.filter(
        (u) => !alreadyBilledSet.has(u.flat._id.toString())
      );
    }
  }

  // 4. Calculate unit financial values
  const additionalCharges = input.additionalCharges ?? [];
  const lateFeePerDay = input.lateFeePerDay ?? 0;
  const values = calculateBillValues({
    baseAmount: input.baseAmount,
    additionalCharges,
    lateFeePerDay,
    lateFeeWaivedAmount: 0,
    paidAmount: 0,
    dueDate: input.dueDate,
  });

  const totalAmount = roundMoney(values.totalAmount * validUnits.length);

  const session = await mongoose.startSession();
  let createdCommonBill: any = null;

  try {
    await session.withTransaction(async () => {
      // Resolve residentIds for any vacant flats in target
      const resolvedUnits: { flat: typeof flats[0]; residentId: Types.ObjectId }[] = [];
      for (const unit of validUnits) {
        let resId = unit.residentId;
        if (!resId) {
          resId = await resolveOrCreateResidentForUnit(aptId, unit.flat._id, session);
        }
        resolvedUnits.push({
          flat: unit.flat,
          residentId: resId,
        });
      }

      // 5. Create Parent CommonBill document
      const common = new CommonBill({
        apartmentId: aptId,
        title: input.title.trim(),
        billType: input.billType,
        billingPeriod: input.billingPeriod || null,
        description: input.description?.trim() || null,
        baseAmount: roundMoney(input.baseAmount),
        additionalCharges,
        lateFeePerDay: roundMoney(lateFeePerDay),
        dueDate: input.dueDate,
        targetType: input.targetType,
        targetBlockIds: (input.targetBlockIds || []).map((id) => toObjectId(id, "targetBlockId")),
        targetFlatIds: (input.targetFlatIds || []).map((id) => toObjectId(id, "targetFlatId")),
        totalFlatsCount: resolvedUnits.length,
        totalAmount,
        status: CommonBillStatus.ACTIVE,
        createdBy:
          input.createdBy && Types.ObjectId.isValid(input.createdBy)
            ? new Types.ObjectId(input.createdBy)
            : null,
      });

      await common.save({ session });
      createdCommonBill = common;

      // 6. Create child Billing documents
      const billsToCreate = resolvedUnits.map(({ flat, residentId }) => ({
        apartmentId: aptId,
        residentId,
        unitId: flat._id,
        commonBillId: common._id,
        title: input.title.trim(),
        billType: input.billType,
        billingPeriod: input.billingPeriod || undefined,
        description: input.description?.trim() || undefined,
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
        createdBy: common.createdBy,
      }));

      const childBills = await Billing.insertMany(billsToCreate, { session });

      // 7. Auto-apply advance wallet credit where residents have positive balances
      for (const billDoc of childBills) {
        if (billDoc.residentId) {
          await applyWalletCreditToBill(billDoc, actor, session);
        }
      }

      // 8. Audit logging
      await createAuditLogService(
        {
          apartmentId: aptId.toString(),
          performedBy: actor.userId,
          action: AuditAction.BILL_CREATED,
          entityType: "CommonBill",
          entityId: common._id.toString(),
          newValue: {
            commonBillId: common._id.toString(),
            title: common.title,
            billType: common.billType,
            billingPeriod: common.billingPeriod,
            flatsCount: validUnits.length,
            totalAmount,
          },
          description: `Common bill "${common.title}" (${common.billType}) broadcasted to ${validUnits.length} flats`,
        },
        session
      );
    });
  } finally {
    await session.endSession();
  }

  return {
    commonBill: createdCommonBill,
    generatedCount: validUnits.length,
    totalAmount,
    message: `Common bill "${input.title}" generated successfully for ${validUnits.length} flats!`,
  };
};

export const getCommonBillsService = async (
  apartmentId: string,
  filter?: { billType?: string; status?: string }
) => {
  const aptId = toObjectId(apartmentId, "apartmentId");
  const query: Record<string, unknown> = { apartmentId: aptId };
  if (filter?.billType) query.billType = filter.billType;
  if (filter?.status) query.status = filter.status;

  const commonBills = await CommonBill.find(query).sort({ createdAt: -1 }).lean();
  if (commonBills.length === 0) {
    return [];
  }

  const commonBillIds = commonBills.map((cb) => cb._id);
  const childBills = await Billing.find(
    {
      commonBillId: { $in: commonBillIds },
      status: { $ne: BillStatus.CANCELLED },
    },
    "commonBillId status totalAmount paidAmount balanceAmount"
  ).lean();

  const statsMap = new Map<
    string,
    {
      paidCount: number;
      pendingCount: number;
      overdueCount: number;
      collectedAmount: number;
      outstandingAmount: number;
    }
  >();

  for (const b of childBills) {
    if (!b.commonBillId) continue;
    const cid = b.commonBillId.toString();
    const current = statsMap.get(cid) || {
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
      collectedAmount: 0,
      outstandingAmount: 0,
    };
    if (b.status === BillStatus.PAID) current.paidCount++;
    else if (b.status === BillStatus.OVERDUE) current.overdueCount++;
    else current.pendingCount++;

    current.collectedAmount = roundMoney(current.collectedAmount + (b.paidAmount || 0));
    current.outstandingAmount = roundMoney(current.outstandingAmount + (b.balanceAmount || 0));
    statsMap.set(cid, current);
  }

  return commonBills.map((cb) => {
    const stats = statsMap.get(cb._id.toString()) || {
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
      collectedAmount: 0,
      outstandingAmount: 0,
    };
    return {
      ...cb,
      stats,
    };
  });
};

export const deleteBillService = async (
  billId: string,
  actor: AuditActor,
  reason?: string
) => {
  const session = await mongoose.startSession();
  const id = toObjectId(billId, "billId");

  try {
    await session.withTransaction(async () => {
      const bill = await Billing.findById(id).session(session);

      if (!bill) {
        throw new AppError("Bill not found", 404);
      }

      if (bill.status === BillStatus.CANCELLED) {
        throw new AppError("Bill is already cancelled", 400);
      }

      if (bill.paidAmount > 0) {
        throw new AppError(
          `Cannot cancel or delete a bill with recorded payments (Paid: ₹${bill.paidAmount}). Please adjust payments before deleting.`,
          400
        );
      }

      const auditValue = getBillAuditValue(bill);

      bill.status = BillStatus.CANCELLED;
      bill.balanceAmount = 0;
      await bill.save({ session });

      if (bill.commonBillId) {
        await CommonBill.findByIdAndUpdate(
          bill.commonBillId,
          {
            $inc: {
              totalFlatsCount: -1,
              totalAmount: -bill.totalAmount,
            },
          },
          { session }
        );
      }

      await createAuditLogService(
        {
          apartmentId: bill.apartmentId.toString(),
          performedBy: actor.userId,
          action: AuditAction.BILL_UPDATED,
          entityType: "Billing",
          entityId: bill._id.toString(),
          oldValue: auditValue,
          newValue: {
            status: BillStatus.CANCELLED,
            reason: reason || "Bill cancelled by treasurer",
          },
          description: reason
            ? `Bill ${bill._id.toString()} cancelled (Reason: ${reason})`
            : `Bill ${bill._id.toString()} cancelled by treasurer`,
        },
        session
      );
    });
  } finally {
    await session.endSession();
  }

  return { success: true, message: "Bill cancelled successfully" };
};

export const generateReceiptFileService = async (
  receiptId: string,
  format: "txt" | "html" = "html"
) => {
  if (!Types.ObjectId.isValid(receiptId)) {
    throw new AppError("Invalid receipt identifier", 400);
  }

  const objectId = new Types.ObjectId(receiptId);
  const payment = await Payment.findById(objectId).lean();
  let bill = null;

  if (payment) {
    if (payment.billId) {
      bill = await Billing.findById(payment.billId).lean();
    }
  } else {
    bill = await Billing.findById(objectId).lean();
  }

  if (!payment && !bill) {
    throw new AppError("Receipt or bill record not found", 404);
  }

  const apartmentId = payment?.apartmentId || bill?.apartmentId;
  const unitId = payment?.unitId || bill?.unitId;
  const residentId = payment?.residentId || bill?.residentId;

  const [apartment, flat, resident] = await Promise.all([
    apartmentId ? Apartment.findById(apartmentId).lean() : null,
    unitId ? Flat.findById(unitId).lean() : null,
    residentId ? ResidentModel.findById(residentId).lean() : null,
  ]);

  let blockName = "";
  if (flat?.blockId) {
    const block = await Block.findById(flat.blockId).lean();
    if (block?.blockname) blockName = block.blockname;
  }

  let residentName = "Resident";
  if (resident?.userId) {
    const authUser = await getAuthDB()
      .collection("user")
      .findOne({
        $or: [
          { id: resident.userId },
          ...(Types.ObjectId.isValid(resident.userId)
            ? [{ _id: new Types.ObjectId(resident.userId) }]
            : []),
        ],
      });
    if (authUser?.name) {
      residentName = authUser.name;
    }
  }

  const rawId = payment?._id || bill?._id || receiptId;
  const receiptNo =
    payment?.receiptNumber ||
    `REC-${rawId.toString().slice(-6).toUpperCase()}`;

  const paidDate =
    payment?.paidAt ||
    bill?.settledAt ||
    bill?.dueDate ||
    bill?.createdAt ||
    new Date();

  const dateStr = new Date(paidDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const amountVal = payment?.amount ?? (bill?.paidAmount || bill?.totalAmount || 0);
  const formattedAmt = `₹${Number(amountVal).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const society = apartment?.name || "Nesteeq Residential Society";
  const unit = flat
    ? blockName
      ? `${blockName} • Flat ${flat.flatNumber}`
      : `Flat ${flat.flatNumber}`
    : "Unit";

  const source =
    payment?.source ||
    (payment?.paymentMethod ? payment.paymentMethod.toUpperCase() : "ONLINE / UPI");

  const desc =
    payment?.description ||
    bill?.title ||
    "Monthly Society Maintenance Settlement";

  const refNo =
    payment?.referenceNo ||
    (bill ? `BILL-${bill._id.toString().slice(-6).toUpperCase()}` : (payment ? payment._id.toString() : ""));

  const safeUnit = unit.replace(/[^a-zA-Z0-9_-]/g, "_");

  if (format === "txt") {
    const content = `=====================================================
            NESTEEQ SOCIETY PAYMENT RECEIPT
=====================================================
Receipt Number : ${receiptNo}
Date & Time    : ${dateStr}
Status         : PAID & RECONCILED (Official)
-----------------------------------------------------
Society Name   : ${society}
Resident       : ${residentName}
Flat / Unit    : ${unit}
-----------------------------------------------------
Payment Channel: ${source}
Amount Settled : ${formattedAmt}
Description    : ${desc}
-----------------------------------------------------
Generated digitally via Nesteeq Resident Portal.
Reconciled with Society Treasurer Ledger.
=====================================================`;

    return {
      content,
      filename: `Receipt_${receiptNo}_${safeUnit}.txt`,
      mimeType: "text/plain; charset=utf-8",
    };
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - ${receiptNo}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 14mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #f8fafc; color: #1e293b; padding: 24px 16px; display: flex; justify-content: center; }
    .receipt-container { background: #ffffff; max-width: 580px; width: 100%; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06); overflow: hidden; page-break-inside: avoid; break-inside: avoid; }
    .header { background: linear-gradient(135deg, #07584F 0%, #0c7368 100%); color: #ffffff; padding: 22px 24px; text-align: center; }
    .logo-badge { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; background: rgba(255,255,255,0.2); border-radius: 10px; font-size: 20px; font-weight: 800; margin-bottom: 8px; }
    .society-title { font-size: 19px; font-weight: 700; letter-spacing: -0.02em; }
    .voucher-sub { font-size: 11px; opacity: 0.85; margin-top: 3px; }
    .badge-pill { display: inline-flex; align-items: center; gap: 6px; background: #ecfdf5; color: #065f46; font-size: 10px; font-weight: 700; padding: 3px 12px; border-radius: 999px; margin-top: 8px; border: 1px solid #a7f3d0; }
    .body { padding: 20px 24px; }
    .amount-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; text-align: center; margin-bottom: 14px; }
    .amount-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    .amount-val { font-size: 28px; font-weight: 800; color: #07584F; margin-top: 2px; }
    .amount-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
    .details-table tr:not(:last-child) { border-bottom: 1px solid #f1f5f9; }
    .details-table td { padding: 9px 14px; font-size: 11px; }
    .label-col { color: #64748b; width: 38%; font-weight: 500; }
    .val-col { color: #0f172a; font-weight: 600; text-align: right; }
    .tag { background: #f1f5f9; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 600; color: #334155; }
    .stamp-box { border: 1px dashed #cbd5e1; background: #fafafa; border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; font-size: 10px; margin-bottom: 16px; }
    .stamp-text { color: #475569; }
    .stamp-strong { font-weight: 700; color: #1e293b; }
    .verified-mark { background: #dcfce7; color: #15803d; border: 1px solid #86efac; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; }
    .actions { display: flex; gap: 10px; justify-content: center; margin-bottom: 6px; }
    .btn-print { background: #07584F; color: #ffffff; border: none; border-radius: 8px; padding: 9px 18px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
    .btn-print:hover { background: #064c44; }
    .footer-note { text-align: center; font-size: 9px; color: #94a3b8; margin-top: 12px; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .receipt-container { box-shadow: none; border: 1px solid #cbd5e1; border-radius: 8px; page-break-inside: avoid; break-inside: avoid; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <div class="logo-badge">N</div>
      <h1 class="society-title">${society}</h1>
      <p class="voucher-sub">Official Society Maintenance & Billing Payment Receipt</p>
      <div>
        <span class="badge-pill">✓ PAYMENT RECONCILED</span>
      </div>
    </div>
    <div class="body">
      <div class="amount-box">
        <div class="amount-label">Total Amount Settled</div>
        <div class="amount-val">${formattedAmt}</div>
        <div class="amount-sub">Received with thanks on ${dateStr}</div>
      </div>
      <table class="details-table">
        <tr>
          <td class="label-col">Receipt Number</td>
          <td class="val-col" style="font-family: monospace; font-size: 12px;">${receiptNo}</td>
        </tr>
        <tr>
          <td class="label-col">Resident Name</td>
          <td class="val-col">${residentName}</td>
        </tr>
        <tr>
          <td class="label-col">Flat / Unit</td>
          <td class="val-col">${unit}</td>
        </tr>
        <tr>
          <td class="label-col">Society Community</td>
          <td class="val-col">${society}</td>
        </tr>
        <tr>
          <td class="label-col">Payment Channel</td>
          <td class="val-col"><span class="tag">${source}</span></td>
        </tr>
        <tr>
          <td class="label-col">Description</td>
          <td class="val-col">${desc}</td>
        </tr>
        <tr>
          <td class="label-col">Reference / Bill ID</td>
          <td class="val-col" style="font-family: monospace;">${refNo}</td>
        </tr>
      </table>
      <div class="stamp-box">
        <div class="stamp-text">
          <div class="stamp-strong">Authorized Society Ledger Record</div>
          <div>Digitally validated by Society Treasurer Office. No physical signature required.</div>
        </div>
        <div class="verified-mark">✓</div>
      </div>
      <div class="actions no-print">
        <button class="btn-print" onclick="window.print()">
          Print / Save as PDF
        </button>
      </div>
      <p class="footer-note">
        Generated digitally via Nesteeq Resident Portal • Official Ledger Acknowledgment
      </p>
    </div>
  </div>
</body>
</html>`;

  return {
    content: htmlContent,
    filename: `Receipt_${receiptNo}_${safeUnit}.html`,
    mimeType: "text/html; charset=utf-8",
  };
};




