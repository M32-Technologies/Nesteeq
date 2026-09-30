import { ClientSession, Types } from "mongoose";

import { Audit } from "./audit.model.js";
import { AuditAction } from "./audit.interface.js";
import { Flat } from "../flat/flat.model.js";
import { ResidentModel } from "../resident/resident.model.js";
import { Billing } from "../billing/billing.model.js";
import { Wallet } from "../wallet/wallet.model.js";
import { Payment } from "../payment/payment.model.js";
import { getAuthDB } from "../../config/auth-db.js";

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
  _id?: string;
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

const formatValuesWithNames = (
  values: Record<string, unknown> | undefined,
  userMap: Map<string, string>,
  residentNameMap: Map<string, string>,
  flatMap: Map<string, string>,
  billingMap?: Map<string, { residentId?: string; unitId?: string }>
): Record<string, unknown> | undefined => {
  if (!values || typeof values !== "object") return values;

  const formatted: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(values)) {
    if (key === "residentId" && typeof val === "string") {
      formatted["resident"] = residentNameMap.get(val) || val;
    } else if ((key === "unitId" || key === "flatId") && typeof val === "string") {
      const flatNum = flatMap.get(val);
      formatted["flat"] = flatNum ? `Flat ${flatNum}` : val;
    } else if (
      (key === "createdBy" ||
        key === "performedBy" ||
        key === "recordedBy" ||
        key === "approvedBy" ||
        key === "rejectedBy") &&
      typeof val === "string"
    ) {
      formatted[key] = userMap.get(val) || val;
    } else if (key === "billId" && typeof val === "string") {
      const billInfo = billingMap?.get(val);
      const flatNum = billInfo?.unitId ? flatMap.get(billInfo.unitId) : "";
      const resName = billInfo?.residentId ? residentNameMap.get(billInfo.residentId) : "";
      if (flatNum) {
        formatted["bill"] = `Bill (Flat ${flatNum})`;
      } else if (resName) {
        formatted["bill"] = `Bill (${resName})`;
      } else {
        formatted["bill"] = `Bill #${val.slice(-6).toUpperCase()}`;
      }
    } else if (key === "_id" || key === "apartmentId") {
      // Omit internal database IDs from clean display
      continue;
    } else {
      formatted[key] = val;
    }
  }

  return formatted;
};

const formatDescription = (
  desc: string | undefined,
  flatNumber?: string,
  residentName?: string
): string => {
  if (!desc) return "";
  let cleanDesc = desc;
  const objectIdRegex = /\b[0-9a-fA-F]{24}\b/g;
  if (objectIdRegex.test(cleanDesc)) {
    const replacement = flatNumber
      ? `Flat ${flatNumber}`
      : residentName
      ? residentName
      : "";
    cleanDesc = cleanDesc.replace(objectIdRegex, replacement).replace(/\s{2,}/g, " ").trim();
  }
  return cleanDesc;
};

export const createAuditLogService = async (
  input: CreateAuditInput,
  session?: ClientSession
) => {
  validateObjectId(input.apartmentId);
  validateObjectId(input.entityId);

  const [audit] = await Audit.create([input], {
    session,
  });

  return audit;
};

export const getAuditLogsService = async (
  filters: AuditFilters
) => {
  const query: Record<string, unknown> = {};

  if (filters._id) {
    validateObjectId(filters._id);
    query._id = filters._id;
  }

  if (filters.apartmentId) {
    validateObjectId(filters.apartmentId);
    query.apartmentId = filters.apartmentId;
  }

  if (filters.performedBy) {
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

  const logs = await Audit.find(query).sort({ createdAt: -1 }).lean();

  if (logs.length === 0) {
    return [];
  }

  const userIdsSet = new Set<string>();
  const residentIdsSet = new Set<string>();
  const unitIdsSet = new Set<string>();
  const billIdsSet = new Set<string>();
  const walletIdsSet = new Set<string>();
  const paymentIdsSet = new Set<string>();

  for (const log of logs) {
    if (log.performedBy) {
      userIdsSet.add(log.performedBy);
    }

    const entityIdStr = log.entityId ? log.entityId.toString() : "";

    if (log.entityType === "Billing" && Types.ObjectId.isValid(entityIdStr)) {
      billIdsSet.add(entityIdStr);
    } else if (log.entityType === "Wallet" && Types.ObjectId.isValid(entityIdStr)) {
      walletIdsSet.add(entityIdStr);
    } else if (log.entityType === "Payment" && Types.ObjectId.isValid(entityIdStr)) {
      paymentIdsSet.add(entityIdStr);
    }

    const checkValue = (val?: Record<string, unknown>) => {
      if (!val || typeof val !== "object") return;
      if (typeof val.residentId === "string" && Types.ObjectId.isValid(val.residentId)) {
        residentIdsSet.add(val.residentId);
      }
      if (typeof val.unitId === "string" && Types.ObjectId.isValid(val.unitId)) {
        unitIdsSet.add(val.unitId);
      }
      if (typeof val.flatId === "string" && Types.ObjectId.isValid(val.flatId)) {
        unitIdsSet.add(val.flatId);
      }
      if (typeof val.billId === "string" && Types.ObjectId.isValid(val.billId)) {
        billIdsSet.add(val.billId);
      }
      if (typeof val.walletId === "string" && Types.ObjectId.isValid(val.walletId)) {
        walletIdsSet.add(val.walletId);
      }
      if (typeof val.createdBy === "string" && Types.ObjectId.isValid(val.createdBy)) {
        userIdsSet.add(val.createdBy);
      }
      if (typeof val.performedBy === "string" && Types.ObjectId.isValid(val.performedBy)) {
        userIdsSet.add(val.performedBy);
      }
      if (typeof val.recordedBy === "string" && Types.ObjectId.isValid(val.recordedBy)) {
        userIdsSet.add(val.recordedBy);
      }
    };
    checkValue(log.oldValue);
    checkValue(log.newValue);
  }

  const billingMap = new Map<string, { residentId?: string; unitId?: string }>();
  if (billIdsSet.size > 0) {
    const billObjectIds = Array.from(billIdsSet).map((id) => new Types.ObjectId(id));
    const bills = await Billing.find(
      { _id: { $in: billObjectIds } },
      "_id residentId unitId"
    ).lean();
    for (const b of bills) {
      const resId = b.residentId?.toString();
      const uId = b.unitId?.toString();
      billingMap.set(b._id.toString(), { residentId: resId, unitId: uId });
      if (resId) residentIdsSet.add(resId);
      if (uId) unitIdsSet.add(uId);
    }
  }

  const walletMap = new Map<string, { residentId?: string }>();
  if (walletIdsSet.size > 0) {
    const walletObjectIds = Array.from(walletIdsSet).map((id) => new Types.ObjectId(id));
    const wallets = await Wallet.find(
      { _id: { $in: walletObjectIds } },
      "_id residentId"
    ).lean();
    for (const w of wallets) {
      const resId = w.residentId?.toString();
      walletMap.set(w._id.toString(), { residentId: resId });
      if (resId) residentIdsSet.add(resId);
    }
  }

  const paymentMap = new Map<string, { residentId?: string; unitId?: string }>();
  if (paymentIdsSet.size > 0) {
    const paymentObjectIds = Array.from(paymentIdsSet).map((id) => new Types.ObjectId(id));
    const payments = await Payment.find(
      { _id: { $in: paymentObjectIds } },
      "_id residentId unitId"
    ).lean();
    for (const p of payments) {
      const resId = p.residentId?.toString();
      const uId = p.unitId?.toString();
      paymentMap.set(p._id.toString(), { residentId: resId, unitId: uId });
      if (resId) residentIdsSet.add(resId);
      if (uId) unitIdsSet.add(uId);
    }
  }

  const residentIds = Array.from(residentIdsSet).map((id) => new Types.ObjectId(id));
  const residents = residentIds.length > 0
    ? await ResidentModel.find({ _id: { $in: residentIds } }, "_id userId flatId").lean()
    : [];

  for (const r of residents) {
    if (r.userId) {
      userIdsSet.add(r.userId);
    }
    if (r.flatId) {
      unitIdsSet.add(r.flatId.toString());
    }
  }

  const unitIds = Array.from(unitIdsSet)
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  const flats = unitIds.length > 0
    ? await Flat.find({ _id: { $in: unitIds } }, "_id flatNumber").lean()
    : [];

  const flatMap = new Map(flats.map((f) => [f._id.toString(), f.flatNumber]));

  const allUserIds = Array.from(userIdsSet);
  let userMap = new Map<string, string>();
  if (allUserIds.length > 0) {
    const authUsers = await getAuthDB()
      .collection("user")
      .find(getAuthUsersFilter(allUserIds))
      .toArray();
    userMap = new Map(
      authUsers.map((u) => [u.id || u._id.toString(), u.name || "User"])
    );
  }

  const residentMap = new Map(
    residents.map((r) => {
      const name = r.userId ? userMap.get(r.userId) || "Resident" : "Resident";
      const flatNum = r.flatId ? flatMap.get(r.flatId.toString()) : "";
      return [
        r._id.toString(),
        {
          name,
          flatNumber: flatNum || "",
          unitName: flatNum ? `Flat ${flatNum}` : "",
        },
      ];
    })
  );

  const residentNameOnlyMap = new Map(
    Array.from(residentMap.entries()).map(([k, v]) => [k, v.name])
  );

  return logs.map((log) => {
    const performedByName = log.performedBy
      ? userMap.get(log.performedBy) || `User #${log.performedBy.slice(-4).toUpperCase()}`
      : "System";

    let resId =
      (log.newValue?.residentId as string) ||
      (log.oldValue?.residentId as string) ||
      "";

    const currentEntityId = log.entityId ? log.entityId.toString() : "";

    if (!resId && log.entityType === "Billing") {
      resId = billingMap.get(currentEntityId)?.residentId || "";
    } else if (!resId && log.entityType === "Wallet") {
      resId = walletMap.get(currentEntityId)?.residentId || "";
    } else if (!resId && log.entityType === "Payment") {
      resId = paymentMap.get(currentEntityId)?.residentId || "";
    }

    if (!resId) {
      const billIdVal = (log.newValue?.billId as string) || (log.oldValue?.billId as string);
      if (billIdVal) {
        resId = billingMap.get(billIdVal)?.residentId || "";
      }
    }

    const resInfo = resId ? residentMap.get(resId) : undefined;

    let uId =
      (log.newValue?.unitId as string) ||
      (log.oldValue?.unitId as string) ||
      (log.newValue?.flatId as string) ||
      (log.oldValue?.flatId as string) ||
      "";

    if (!uId && log.entityType === "Billing") {
      uId = billingMap.get(currentEntityId)?.unitId || "";
    } else if (!uId && log.entityType === "Payment") {
      uId = paymentMap.get(currentEntityId)?.unitId || "";
    }

    if (!uId) {
      const billIdVal = (log.newValue?.billId as string) || (log.oldValue?.billId as string);
      if (billIdVal) {
        uId = billingMap.get(billIdVal)?.unitId || "";
      }
    }

    const flatNum = uId ? flatMap.get(uId) : resInfo?.flatNumber;
    const unitName = flatNum ? `Flat ${flatNum}` : resInfo?.unitName || "";

    const oldValueFormatted = formatValuesWithNames(
      log.oldValue,
      userMap,
      residentNameOnlyMap,
      flatMap,
      billingMap
    );
    const newValueFormatted = formatValuesWithNames(
      log.newValue,
      userMap,
      residentNameOnlyMap,
      flatMap,
      billingMap
    );

    const formattedDescription = formatDescription(
      log.description,
      flatNum,
      resInfo?.name
    );

    return {
      ...log,
      performedByName,
      residentName: resInfo?.name || "",
      flatNumber: flatNum || "",
      unitName,
      oldValueFormatted,
      newValueFormatted,
      description: formattedDescription,
    };
  });
};

export const getAuditByIdService = async (
  auditId: string
) => {
  validateObjectId(auditId);

  const [enriched] = await getAuditLogsService({
    _id: auditId,
  });

  if (!enriched) {
    throw new AppError("Audit log not found", 404);
  }

  return enriched;
};
