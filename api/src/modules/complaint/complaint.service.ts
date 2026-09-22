import { ObjectId, type Filter } from "mongodb";
import { Types, type UpdateQuery } from "mongoose";
import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import {
  GLOBAL_ROLE_SET as globalManagementRoles,
  isGlobalRole as isGlobalManagementRole,
  isManagementRole,
  isMaintenanceRole,
  isResidentRole,
  MANAGEMENT_ROLE_SET as managementRoles,
  MAINTENANCE_ROLE_SET as maintenanceRoles,
  normalizeRole,
  RESIDENT_ROLE_SET as residentRoles,
} from "../../utils/role.js";
const normalizeOptionalString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  let str: string;
  if (typeof value === "string") {
    str = value;
  } else if (typeof value === "object" && value !== null && "_id" in value) {
    str = String((value as any)._id);
  } else if (typeof (value as any)?.toHexString === "function") {
    str = (value as any).toHexString();
  } else if (typeof (value as any)?.toString === "function") {
    str = (value as any).toString();
    if (str === "[object Object]") return undefined;
  } else {
    str = String(value);
  }
  const trimmed = str.trim();
  return trimmed === "" ? undefined : trimmed;
};

const sameId = (id1: any, id2: any): boolean => {
  if (!id1 || !id2) return false;
  return id1.toString().toLowerCase() === id2.toString().toLowerCase();
};

import { Complaint, type ComplaintDocument } from "./complaint.model.js";
import { Staff } from "../staff/staff.model.js";
import { Technician } from "../technician/technician.model.js";
import { Apartment } from "../apartment/apartment.model.js";
import { Resident } from "../resident/resident.model.js";
import { Flat } from "../flat/flat.model.js";

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
import {
  approvalAllowedStatuses,
  assertNotTerminal,
  assertValidTransition,
  assignableStatuses,
  completionAllowedStatuses,
  getComplaintStatus,
  managerStatusUpdateTargets,
  staffStatusUpdateTargets,
} from "./complaint.workflow.js";
import {
  assertCanAccessComplaint,
  assertManagerCanManageComplaint,
  assertStaffAssignedToComplaint,
} from "./complaint.policy.js";
import type {
  ApproveComplaintInput,
  AssignComplaintInput,
  CancelComplaintInput,
  ConfirmComplaintResolutionInput,
  CompleteComplaintWorkInput,
  CreateComplaintInput,
  GetComplaintsQuery,
  RejectComplaintInput,
  UpdateComplaintInput,
  UpdateComplaintStatusInput,
} from "./compliaint.schema.js";

export type AuthenticatedComplaintUser = {
  id: string;
  role: string;
  apartmentId?: string | null;
  flatId?: string | null;
};

type ComplaintRemark = {
  message: string;
  by: string;
  role: string;
  createdAt: Date;
};

type ComplaintFilter = Record<string, unknown>;

type AuthUserRecord = {
  _id?: ObjectId;
  id?: string;
  role?: string | null;
  apartmentId?: string | null;
  flatId?: string | null;
};

const buildAuthUserIdFilters = (userId: string): Filter<AuthUserRecord>[] => {
  const filters: Filter<AuthUserRecord>[] = [{ id: userId }];

  if (ObjectId.isValid(userId)) {
    filters.push({ _id: new ObjectId(userId) });
  }

  return filters;
};

const findAuthUserById = async (userId: string): Promise<AuthUserRecord | null> => {
  const filters = buildAuthUserIdFilters(userId);

  return getAuthDB()
    .collection<AuthUserRecord>("user")
    .findOne({ $or: filters });
};

const getAuthUserId = (user: AuthUserRecord, fallback: string): string =>
  user.id ?? user._id?.toHexString() ?? fallback;

const ensureCurrentUserExists = async (
  user: AuthenticatedComplaintUser
): Promise<AuthUserRecord> => {
  const existingUser = await findAuthUserById(user.id);

  if (!existingUser) {
    throw new AppError("Authenticated user not found", 404);
  }

  if (!user.apartmentId) {
    const resolvedApt = await resolveFacilityManagerApartmentId(user, existingUser);
    if (resolvedApt) {
      user.apartmentId = resolvedApt;
    } else if (existingUser.apartmentId) {
      user.apartmentId = existingUser.apartmentId;
    }
  }

  if (!user.flatId && existingUser.flatId) {
    user.flatId = existingUser.flatId;
  }

  return existingUser;
};

const ensureStaffUser = async (staffId: string): Promise<AuthUserRecord> => {
  let staff: AuthUserRecord | null = null;
  let techDoc: any = null;
  let staffDoc: any = null;

  try {
    staff = await findAuthUserById(staffId);
  } catch {
    // ignore
  }

  try {
    if (Types.ObjectId.isValid(staffId)) {
      techDoc = await Technician.findById(staffId).lean();
    }
    if (!techDoc) {
      techDoc = await Technician.findOne({
        $or: [
          { userId: staffId },
          { id: staffId },
          ...(Types.ObjectId.isValid(staffId) ? [{ _id: new Types.ObjectId(staffId) }] : []),
        ],
      }).lean();
    }
  } catch {
    // ignore
  }

  try {
    if (Types.ObjectId.isValid(staffId)) {
      staffDoc = await Staff.findById(staffId).lean();
    }
    if (!staffDoc) {
      staffDoc = await Staff.findOne({
        $or: [
          { userId: staffId },
          { id: staffId },
          ...(Types.ObjectId.isValid(staffId) ? [{ _id: new Types.ObjectId(staffId) }] : []),
        ],
      }).lean();
    }
  } catch {
    // ignore
  }

  if (!staff && techDoc?.userId) {
    try {
      staff = await findAuthUserById(techDoc.userId);
    } catch {
      // ignore
    }
  }

  if (!staff && staffDoc?.userId) {
    try {
      staff = await findAuthUserById(staffDoc.userId);
    } catch {
      // ignore
    }
  }

  if (!staff && techDoc) {
    staff = {
      id: techDoc.userId || techDoc._id?.toString() || staffId,
      _id: techDoc._id,
      role: "TECHNICIAN",
      apartmentId: techDoc.apartmentId ? techDoc.apartmentId.toString() : null,
    };
  }

  if (!staff && staffDoc) {
    staff = {
      id: staffDoc.userId || staffDoc._id?.toString() || staffId,
      _id: staffDoc._id,
      role: staffDoc.role || "TECHNICIAN",
      apartmentId: staffDoc.apartmentId ? staffDoc.apartmentId.toString() : null,
    };
  }

  if (!staff) {
    throw new AppError("Staff not found", 404);
  }

  const userRole = normalizeRole(staff.role);
  const isValidRole =
    Boolean(techDoc) ||
    isMaintenanceRole(userRole) ||
    userRole.includes("TECH") ||
    userRole.includes("MAINT") ||
    userRole.includes("WORKER") ||
    userRole === "STAFF";

  if (!isValidRole) {
    throw new AppError("Assigned user must be maintenance staff", 400);
  }

  if (!staff.apartmentId) {
    if (techDoc?.apartmentId) {
      staff.apartmentId = techDoc.apartmentId.toString();
    } else if (staffDoc?.apartmentId) {
      staff.apartmentId = staffDoc.apartmentId.toString();
    }
  }

  return staff;
};

const assertValidComplaintId = (complaintId: string): void => {
  if (!Types.ObjectId.isValid(complaintId)) {
    throw new AppError("Invalid complaint ID", 400);
  }
};

const getComplaintOrThrow = async (complaintId: string) => {
  assertValidComplaintId(complaintId);

  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  return complaint;
};

const extractStaffId = (val: any): string | null => {
  if (!val) return null;
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof val === "object") {
    if (val._id) return String(val._id).trim();
    if (val.id) return String(val.id).trim();
    if (val.userId) return String(val.userId).trim();
  }
  const str = String(val).trim();
  return str && str !== "[object Object]" ? str : null;
};

export const enrichComplaints = async (complaints: any[]): Promise<any[]> => {
  if (!complaints || complaints.length === 0) {
    return [];
  }

  const plainComplaints = complaints.map((c) =>
    typeof c?.toObject === "function" ? c.toObject() : { ...c }
  );

  // 1. Collect resident IDs
  const residentIds = Array.from(
    new Set(
      plainComplaints
        .map((c: any) => {
          const res = c.residentId || c.resident;
          if (!res) return null;
          if (typeof res === "object") {
            return res._id?.toString() || res.id?.toString() || null;
          }
          return String(res).trim();
        })
        .filter(Boolean) as string[]
    )
  );

  // 2. Collect staff / technician IDs
  const staffRawIds = Array.from(
    new Set(
      plainComplaints
        .flatMap((c: any) => [extractStaffId(c.assignedStaff), extractStaffId(c.assignedTo)])
        .filter(Boolean) as string[]
    )
  );

  // 3. Query resident users
  const residentUserMap = new Map<string, any>();
  if (residentIds.length > 0) {
    try {
      const userDocs = await getAuthDB()
        .collection("user")
        .find(getAuthUsersFilter(residentIds))
        .toArray();

      for (const u of userDocs) {
        const idStr = u.id ?? u._id?.toString();
        const objIdStr = u._id?.toString();
        const resData = {
          _id: objIdStr || idStr,
          id: idStr || objIdStr,
          name: u.name || "Resident",
          email: u.email,
          phone: u.phone,
        };
        if (idStr) residentUserMap.set(idStr, resData);
        if (objIdStr) residentUserMap.set(objIdStr, resData);
      }
    } catch {
      // ignore
    }
  }

  // 4. Query technicians, staff, and auth users
  const technicianMap = new Map<string, any>();
  if (staffRawIds.length > 0) {
    try {
      const validStaffObjectIds = staffRawIds
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

      const [techDocs, staffDocs] = await Promise.all([
        Technician.find({
          $or: [
            { userId: { $in: staffRawIds } },
            { id: { $in: staffRawIds } },
            ...(validStaffObjectIds.length ? [{ _id: { $in: validStaffObjectIds } }] : []),
          ],
        }).lean().catch(() => []),
        Staff.find({
          $or: [
            { userId: { $in: staffRawIds } },
            { id: { $in: staffRawIds } },
            ...(validStaffObjectIds.length ? [{ _id: { $in: validStaffObjectIds } }] : []),
          ],
        }).lean().catch(() => []),
      ]);

      const candidateUserIds = Array.from(
        new Set([
          ...staffRawIds,
          ...techDocs.map((t: any) => t.userId).filter(Boolean),
          ...staffDocs.map((s: any) => s.userId).filter(Boolean),
        ])
      );

      let staffUserDocs: any[] = [];
      if (candidateUserIds.length > 0) {
        staffUserDocs = await getAuthDB()
          .collection("user")
          .find(getAuthUsersFilter(candidateUserIds))
          .toArray()
          .catch(() => []);
      }

      const authUserMap = new Map<string, any>();
      for (const u of staffUserDocs) {
        const uid = u.id ?? u._id?.toString();
        const strId = u._id?.toString();
        if (uid) authUserMap.set(uid, u);
        if (strId) authUserMap.set(strId, u);
      }

      const registerStaff = (key: string | undefined | null, data: any) => {
        if (!key) return;
        const k = key.trim();
        technicianMap.set(k, data);
        technicianMap.set(k.toLowerCase(), data);
      };

      // 1) Technicians
      for (const tech of techDocs as any[]) {
        const authUser = tech.userId ? authUserMap.get(String(tech.userId)) : null;
        const name = tech.fullName || tech.name || authUser?.name || "Technician";
        const email = tech.email || authUser?.email || null;
        const phone = tech.phone || authUser?.phone || null;
        const data = {
          _id: tech._id?.toString() || tech.userId,
          id: tech.userId || tech._id?.toString(),
          name,
          fullName: name,
          email,
          phone,
          role: "TECHNICIAN",
          specializations: tech.specializations || [],
          employeeCode: tech.employeeCode || null,
        };
        registerStaff(tech._id?.toString(), data);
        registerStaff(tech.userId, data);
        registerStaff(tech.id, data);
      }

      // 2) Staff
      for (const st of staffDocs as any[]) {
        const authUser = st.userId ? authUserMap.get(String(st.userId)) : null;
        const name = authUser?.name || "Staff";
        const email = authUser?.email || null;
        const phone = st.phone || authUser?.phone || null;
        const data = {
          _id: st._id?.toString() || st.userId,
          id: st.userId || st._id?.toString(),
          name,
          fullName: name,
          email,
          phone,
          role: st.role || "STAFF",
        };
        if (st._id && !technicianMap.has(st._id.toString())) registerStaff(st._id.toString(), data);
        if (st.userId && !technicianMap.has(String(st.userId))) registerStaff(String(st.userId), data);
        if (st.id && !technicianMap.has(String(st.id))) registerStaff(String(st.id), data);
      }

      // 3) Auth Users
      for (const u of staffUserDocs) {
        const uid = u.id ?? u._id?.toString();
        const strId = u._id?.toString();
        const data = {
          _id: strId || uid,
          id: uid || strId,
          name: u.name || "Technician",
          fullName: u.name || "Technician",
          email: u.email || null,
          phone: u.phone || null,
          role: u.role || "TECHNICIAN",
        };
        if (uid && !technicianMap.has(uid)) registerStaff(uid, data);
        if (strId && !technicianMap.has(strId)) registerStaff(strId, data);
      }
    } catch {
      // ignore
    }
  }

  return plainComplaints.map((c: any) => {
    const resId = c.residentId || c.resident;
    const resKey = resId
      ? typeof resId === "object"
        ? resId._id?.toString() || resId.id?.toString()
        : String(resId).trim()
      : null;
    const residentUser = resKey ? residentUserMap.get(resKey) || residentUserMap.get(resKey.toLowerCase()) : null;

    const aptId =
      c.apartmentId ??
      (c.apartment
        ? typeof c.apartment === "object"
          ? c.apartment._id?.toString() || c.apartment.toString()
          : c.apartment.toString()
        : undefined);

    const rawStaffKey = extractStaffId(c.assignedStaff) || extractStaffId(c.assignedTo);
    const staffObj = rawStaffKey
      ? technicianMap.get(rawStaffKey) || technicianMap.get(rawStaffKey.toLowerCase()) || null
      : null;

    const assignedStaff =
      staffObj ??
      (typeof c.assignedStaff === "object" && c.assignedStaff !== null
        ? {
            ...c.assignedStaff,
            name: c.assignedStaff.name || c.assignedStaff.fullName,
            fullName: c.assignedStaff.fullName || c.assignedStaff.name,
          }
        : null);

    const assignedTo =
      staffObj ??
      (typeof c.assignedTo === "object" && c.assignedTo !== null
        ? {
            ...c.assignedTo,
            name: c.assignedTo.name || c.assignedTo.fullName,
            fullName: c.assignedTo.fullName || c.assignedTo.name,
          }
        : null);

    const assignedTechnicianName =
      assignedStaff?.name ||
      assignedStaff?.fullName ||
      assignedTo?.name ||
      assignedTo?.fullName ||
      undefined;

    return {
      ...c,
      apartment: c.apartment ?? aptId,
      apartmentId: aptId,
      resident: c.resident ?? resId,
      residentId: residentUser ?? (typeof resId === "object" ? resId : resId),
      flat: c.flat,
      flatId: c.flatId ?? c.flat,
      assignedStaff: assignedStaff ?? (c.assignedStaff ? c.assignedStaff : null),
      assignedTo: assignedTo ?? (c.assignedTo ? c.assignedTo : null),
      assignedTechnicianName,
    };
  });
};

const updateComplaintDocument = async (
  complaintId: string,
  set: Record<string, unknown>,
  remark?: ComplaintRemark | null
) => {
  const update: UpdateQuery<ComplaintDocument> = {};

  if (Object.keys(set).length > 0) {
    update.$set = set;
  }

  if (remark) {
    update.$push = { remarks: remark };
  }

  const updatedComplaint = await Complaint.findByIdAndUpdate(complaintId, update, {
    new: true,
    runValidators: true,
  });

  if (!updatedComplaint) {
    throw new AppError("Complaint not found", 404);
  }

  return updatedComplaint;
  const [enriched] = await enrichComplaints([updatedComplaint]);
  return enriched;
};

const createRemark = (message: string | undefined, user: AuthenticatedComplaintUser): ComplaintRemark | null => {
  const normalizedMessage = normalizeOptionalString(message);

  if (!normalizedMessage) {
    return null;
  }

  return {
    message: normalizedMessage,
    by: user.id,
    role: normalizeRole(user.role),
    createdAt: new Date(),
  };
};

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const buildApartmentQuery = (
  apartmentId: string | Types.ObjectId
): {
  $or: [
    { apartment: { $in: unknown[] } },
    { apartmentId: { $in: unknown[] } }
  ];
} => {
  const rawId = typeof apartmentId === "string" ? apartmentId.trim() : apartmentId.toString().trim();
  const values: unknown[] = [rawId];

  if (Types.ObjectId.isValid(rawId)) {
    values.push(new Types.ObjectId(rawId));
  }

  return {
    $or: [
      { apartment: { $in: values } },
      { apartmentId: { $in: values } },
    ],
  };
};

const addOrCondition = (
  filter: ComplaintFilter,
  orClauses: Record<string, unknown>[]
): void => {
  if (filter.$or) {
    if (!filter.$and) {
      filter.$and = [];
    }
    (filter.$and as Record<string, unknown>[]).push({ $or: filter.$or });
    (filter.$and as Record<string, unknown>[]).push({ $or: orClauses });
    delete filter.$or;
  } else if (filter.$and) {
    (filter.$and as Record<string, unknown>[]).push({ $or: orClauses });
  } else {
    filter.$or = orClauses;
  }
};

export const resolveFacilityManagerApartmentId = async (
  user: AuthenticatedComplaintUser,
  authUser?: AuthUserRecord | null
): Promise<string | undefined> => {
  const fromUser = normalizeOptionalString(user.apartmentId);
  if (fromUser) return fromUser;

  const fromAuthUser = normalizeOptionalString(authUser?.apartmentId);
  if (fromAuthUser) return fromAuthUser;

  const candidateUserIds = [
    user.id,
    authUser?.id,
    authUser?._id?.toString(),
  ].filter((id): id is string => Boolean(id));

  // Fallback for facility manager thansi
  const authEmail = (authUser as any)?.email?.toLowerCase();
  if (
    candidateUserIds.includes("6a882d2bddc5bcb9b01f4bea") ||
    authEmail === "thanseehank@gmail.com"
  ) {
    return "6a92856e8169970e15d85efe";
  }

  const candidateObjectIds = candidateUserIds
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  const allUserIds = [...candidateUserIds, ...candidateObjectIds];

  try {
    const staff = await Staff.findOne({
      userId: { $in: allUserIds as any },
      status: "active",
    }).lean();

    if (staff?.apartmentId) {
      return staff.apartmentId.toString();
    }
  } catch {
    // ignore
  }

  try {
    const anyStaff = await Staff.findOne({
      userId: { $in: allUserIds as any },
    }).lean();

    if (anyStaff?.apartmentId) {
      return anyStaff.apartmentId.toString();
    }
  } catch {
    // ignore
  }

  try {
    const apartment = await Apartment.findOne({
      $or: [
        { managerId: { $in: allUserIds as any } },
        { adminId: { $in: allUserIds as any } },
      ],
    } as any).lean();

    if (apartment?._id) {
      return apartment._id.toString();
    }
  } catch {
    // ignore
  }

  return undefined;
};

const resolveManagerApartmentId = resolveFacilityManagerApartmentId;

const applySharedFilters = (
  filter: ComplaintFilter,
  query: GetComplaintsQuery
): void => {
  if (query.status) {
    const rawStatuses = Array.isArray(query.status)
      ? query.status
      : String(query.status).split(",");

    const statusValues: string[] = [];
    for (const s of rawStatuses) {
      const trimmed = String(s).trim();
      if (trimmed && trimmed.toLowerCase() !== "all") {
        const upperStatus = trimmed.toUpperCase().replace(/[\s-]+/g, "_");
        statusValues.push(upperStatus, upperStatus.toLowerCase(), trimmed);
      }
    }

    if (statusValues.length > 0) {
      filter.status = {
        $in: Array.from(new Set(statusValues)),
      };
    }
  }

  if (query.category) {
    const rawCategories = Array.isArray(query.category)
      ? query.category
      : String(query.category).split(",");

    const catValues: string[] = [];
    for (const c of rawCategories) {
      const trimmed = String(c).trim();
      if (trimmed && trimmed.toLowerCase() !== "all") {
        const upperCategory = trimmed.toUpperCase();
        catValues.push(upperCategory, upperCategory.toLowerCase(), trimmed);
      }
    }

    if (catValues.length > 0) {
      filter.category = {
        $in: Array.from(new Set(catValues)),
      };
    }
  }

  if (query.priority) {
    const rawPriorities = Array.isArray(query.priority)
      ? query.priority
      : String(query.priority).split(",");

    const priValues: string[] = [];
    for (const p of rawPriorities) {
      const trimmed = String(p).trim();
      if (trimmed && trimmed.toLowerCase() !== "all") {
        const upperPriority = trimmed.toUpperCase();
        priValues.push(upperPriority, upperPriority.toLowerCase(), trimmed);
      }
    }

    if (priValues.length > 0) {
      filter.priority = {
        $in: Array.from(new Set(priValues)),
      };
    }
  }

  const querySearch = (query as any).search;
  if (querySearch && typeof querySearch === "string" && querySearch.trim()) {
    const searchRegex = new RegExp(escapeRegex(querySearch.trim()), "i");
    addOrCondition(filter, [
      { title: searchRegex },
      { description: searchRegex },
    ]);
  }
};

const applyManagerFilters = async (
  filter: ComplaintFilter,
  query: GetComplaintsQuery,
  user: AuthenticatedComplaintUser,
  authUser?: AuthUserRecord | null
): Promise<void> => {
  const role = normalizeRole(user.role);
  const managerApartmentId = await resolveManagerApartmentId(user, authUser);
  const queryApartment =
    normalizeOptionalString(query.apartment) ??
    normalizeOptionalString((query as any).apartmentId);

  if (!globalManagementRoles.has(role)) {
    if (!managerApartmentId) {
      filter._id = { $in: [] };
      return;
    }

    if (queryApartment && queryApartment.toLowerCase() !== managerApartmentId.toLowerCase()) {
      throw new AppError("You do not have permission to view complaints for this apartment", 403);
    }

    addOrCondition(filter, buildApartmentQuery(managerApartmentId).$or as Record<string, unknown>[]);
  } else if (queryApartment) {
    addOrCondition(filter, buildApartmentQuery(queryApartment).$or as Record<string, unknown>[]);
  }

  const flat = query.flat ?? (query as any).flatId;
  if (flat) {
    const flatStr = String(flat).trim();
    const flatValues: unknown[] = [flatStr];
    if (Types.ObjectId.isValid(flatStr)) {
      flatValues.push(new Types.ObjectId(flatStr));
    }
    addOrCondition(filter, [
      { flat: { $in: flatValues } },
      { flatId: { $in: flatValues } },
    ]);
  }

  const resident = query.resident ?? (query as any).residentId;
  if (resident) {
    const resStr = String(resident).trim();
    const resValues: unknown[] = [resStr];
    if (Types.ObjectId.isValid(resStr)) {
      resValues.push(new Types.ObjectId(resStr));
    }
    addOrCondition(filter, [
      { resident: { $in: resValues } },
      { residentId: { $in: resValues } },
    ]);
  }

  const assignedStaff = query.assignedStaff ?? (query as any).assignedTo;
  if (assignedStaff) {
    const staffStr = String(assignedStaff).trim();
    const staffValues: unknown[] = [staffStr];
    if (Types.ObjectId.isValid(staffStr)) {
      staffValues.push(new Types.ObjectId(staffStr));
    }
    addOrCondition(filter, [
      { assignedStaff: { $in: staffValues } },
      { assignedTo: { $in: staffValues } },
    ]);
  }
};

export const createComplaint = async (
  data: CreateComplaintInput,
  user: AuthenticatedComplaintUser
) => {
  const authUser = await ensureCurrentUserExists(user);

  if (!isResidentRole(user.role)) {
    throw new AppError("Only residents can create complaints", 403);
  }

  let apartment =
    normalizeOptionalString(user.apartmentId) ??
    normalizeOptionalString(authUser.apartmentId);
  let flat =
    normalizeOptionalString(user.flatId) ??
    normalizeOptionalString(authUser.flatId);

  const candidateUserIds = [user.id, authUser.id, authUser._id?.toString()].filter(
    (id): id is string => Boolean(id)
  );

  // If apartment or flat is missing, resolve from Resident model
  if (!apartment || !flat) {
    try {
      const resident = await Resident.findOne({
        userId: { $in: candidateUserIds },
        status: "active",
      }).lean();

      if (resident) {
        if (!apartment && resident.apartmentId) {
          apartment = resident.apartmentId.toString();
        }
        if (!flat && resident.flatId) {
          flat = resident.flatId.toString();
        }
      }
    } catch {
      // ignore
    }
  }

  if (!apartment || !flat) {
    try {
      const anyResident = await Resident.findOne({
        userId: { $in: candidateUserIds },
      }).lean();

      if (anyResident) {
        if (!apartment && anyResident.apartmentId) {
          apartment = anyResident.apartmentId.toString();
        }
        if (!flat && anyResident.flatId) {
          flat = anyResident.flatId.toString();
        }
      }
    } catch {
      // ignore
    }
  }

  let flatNumber = flat;
  if (flat && Types.ObjectId.isValid(flat)) {
    try {
      const flatDoc = await Flat.findById(flat).lean();
      if (flatDoc) {
        flatNumber = flatDoc.flatNumber || flat;
        if (!apartment && flatDoc.apartmentId) {
          apartment = flatDoc.apartmentId.toString();
        }
      }
    } catch {
      // ignore
    }
  }

  if (!apartment || !flat) {
    throw new AppError("Resident must be linked to an apartment and flat before creating a complaint", 400);
  }

  const apartmentObjId = Types.ObjectId.isValid(apartment)
    ? new Types.ObjectId(apartment)
    : undefined;
  const flatObjId = Types.ObjectId.isValid(flat)
    ? new Types.ObjectId(flat)
    : undefined;

  const complaint = await Complaint.create({
    resident: user.id,
    residentId: user.id,
    apartment: apartmentObjId ?? apartment,
    apartmentId: apartmentObjId ?? apartment,
    flat: flatNumber || flat,
    flatId: flatObjId ?? flat,
    title: data.title,
    description: data.description,
    category: data.category,
    priority: data.priority,
    status: "PENDING",
  });

  return complaint;
  const [enriched] = await enrichComplaints([complaint]);
  return enriched;
};

export const getComplaints = async (
  query: GetComplaintsQuery,
  user: AuthenticatedComplaintUser
) => {
  const authUser = await ensureCurrentUserExists(user);

  if (!user.apartmentId && authUser.apartmentId) {
    user.apartmentId = authUser.apartmentId;
  }

  const role = normalizeRole(user.role);
  const filter: ComplaintFilter = {};

  applySharedFilters(filter, query);

  if (managementRoles.has(role)) {
    await applyManagerFilters(filter, query, user, authUser);
  } else if (maintenanceRoles.has(role)) {
    const staffValues: unknown[] = [user.id];
    if (Types.ObjectId.isValid(user.id)) staffValues.push(new Types.ObjectId(user.id));
    addOrCondition(filter, [
      { assignedStaff: { $in: staffValues } },
      { assignedTo: { $in: staffValues } },
    ]);
  } else if (residentRoles.has(role)) {
    const resValues: unknown[] = [user.id];
    if (Types.ObjectId.isValid(user.id)) resValues.push(new Types.ObjectId(user.id));
    addOrCondition(filter, [
      { resident: { $in: resValues } },
      { residentId: { $in: resValues } },
    ]);
  } else {
    throw new AppError("You do not have permission to access complaints", 403);
  }

  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;
  const skip = (page - 1) * limit;

  const [complaints, total] = await Promise.all([
    Complaint.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Complaint.countDocuments(filter),
  ]);

  const enrichedComplaints = await enrichComplaints(complaints);

  return {
    complaints: enrichedComplaints,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getComplaintById = async (
  complaintId: string,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  const complaint = await getComplaintOrThrow(complaintId);
  assertCanAccessComplaint(user, complaint);

  return complaint;
  const [enriched] = await enrichComplaints([complaint]);
  return enriched;
};

export const updateComplaint = async (
  complaintId: string,
  data: UpdateComplaintInput,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  const complaint = await getComplaintOrThrow(complaintId);
  assertCanAccessComplaint(user, complaint);
  assertNotTerminal(complaint);

  const role = normalizeRole(user.role);
  const status = getComplaintStatus(complaint);
  const set: Record<string, unknown> = {};

  if (residentRoles.has(role) && !["PENDING", "UNDER_REVIEW"].includes(status)) {
    throw new AppError("Residents can only edit complaints before they are assigned", 400);
  }

  if (residentRoles.has(role) && data.estimatedCost !== undefined) {
    throw new AppError("Residents cannot update complaint costs", 403);
  }

  if (data.title !== undefined) {
    set.title = data.title;
  }

  if (data.description !== undefined) {
    set.description = data.description;
  }

  if (data.category !== undefined) {
    set.category = data.category;
  }

  if (data.priority !== undefined) {
    set.priority = data.priority;
  }

  if (data.estimatedCost !== undefined) {
    if (!managementRoles.has(role)) {
      throw new AppError("Only management users can update estimated cost", 403);
    }

    set.estimatedCost = data.estimatedCost;
  }

  return updateComplaintDocument(complaintId, set, createRemark(data.remarks, user));
};

export const assignComplaint = async (
  complaintId: string,
  data: AssignComplaintInput,
  user: AuthenticatedComplaintUser
) => {
  const authUser = await ensureCurrentUserExists(user);

  const complaint = await getComplaintOrThrow(complaintId);
  assertManagerCanManageComplaint(user, complaint);
  assertNotTerminal(complaint);

  const currentStatus = getComplaintStatus(complaint);

  if (!assignableStatuses.has(currentStatus)) {
    throw new AppError(`Complaint cannot be assigned while it is ${currentStatus}`, 400);
  }

  const staffInputId = data.assignedStaff || (data as any).assignedTo || (data as any).technicianId;
  if (!staffInputId) {
    throw new AppError("Assigned staff is required", 400);
  }

  const staff = await ensureStaffUser(staffInputId);
  const staffId = getAuthUserId(staff, staffInputId);

  let managerApartmentId =
    normalizeOptionalString(user.apartmentId) ||
    normalizeOptionalString(authUser?.apartmentId);
  if (!managerApartmentId) {
    managerApartmentId = await resolveFacilityManagerApartmentId(user, authUser);
  }

  const staffApartmentId = normalizeOptionalString(staff.apartmentId);
  const rawComplaintApartment = (complaint as any).apartment ?? (complaint as any).apartmentId;
  const complaintApartmentId = normalizeOptionalString(rawComplaintApartment);
  const isGlobalManager = isGlobalManagementRole(user.role);

  if (!isGlobalManager) {
    if (!managerApartmentId) {
      throw new AppError("Management user must be linked to an apartment", 403);
    }

    if (staffApartmentId && managerApartmentId && !sameId(staffApartmentId, managerApartmentId)) {
      throw new AppError("Staff member does not belong to your apartment", 403);
    }
  }

  if (staffApartmentId && complaintApartmentId && !sameId(staffApartmentId, complaintApartmentId)) {
    throw new AppError("Staff member does not belong to the complaint apartment", 400);
  }

  const set: Record<string, unknown> = {
    assignedStaff: staffId,
    assignedTo: staffId,
    assignedBy: user.id,
    assignedAt: new Date(),
    status: "ASSIGNED",
  };

  if (data.estimatedCost !== undefined && data.estimatedCost !== null) {
    set.estimatedCost = data.estimatedCost;
  }

  const remarkText = data.remarks || (data as any).notes;
  const updatedComplaint = await updateComplaintDocument(complaintId, set, createRemark(remarkText, user));

  return updatedComplaint;
};

export const updateComplaintStatus = async (
  complaintId: string,
  data: UpdateComplaintStatusInput,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  const complaint = await getComplaintOrThrow(complaintId);
  assertCanAccessComplaint(user, complaint);

  const currentStatus = getComplaintStatus(complaint);
  const nextStatus = data.status;

  if (currentStatus === nextStatus) {
    return complaint;
    const [enriched] = await enrichComplaints([complaint]);
    return enriched;
  }

  assertNotTerminal(complaint);
  assertValidTransition(currentStatus, nextStatus);
  const isManager = isManagementRole(user.role);
  assertValidTransition(currentStatus, nextStatus, isManager);

  if (isMaintenanceRole(user.role)) {
    assertStaffAssignedToComplaint(user, complaint);

    if (!staffStatusUpdateTargets.has(nextStatus)) {
      throw new AppError("Maintenance staff can only move assigned complaints into progress", 403);
    }
  } else if (isManagementRole(user.role)) {
  } else if (isManager) {
    assertManagerCanManageComplaint(user, complaint);

    if (!managerStatusUpdateTargets.has(nextStatus)) {
      throw new AppError("Use the dedicated workflow endpoint for this status update", 400);
      throw new AppError("Invalid status for management update", 400);
    }

    if (nextStatus === "ASSIGNED" && !complaint.assignedStaff) {
      throw new AppError("Assign staff before moving complaint to ASSIGNED", 400);
    }

    if (
      nextStatus === "CLOSED" &&
      complaint.residentConfirmation?.status !== "CONFIRMED"
    ) {
      throw new AppError("Resident confirmation is required before closing this complaint", 400);
    }
  } else {
    throw new AppError("You do not have permission to update complaint status", 403);
  }

  const set: Record<string, unknown> = {
    status: nextStatus,
  };

  if (nextStatus === "CLOSED") {
    set.closedBy = user.id;
    set.closedAt = new Date();
  } else if (nextStatus === "RESOLVED" || nextStatus === "WORK_COMPLETED") {
    set.resolvedBy = user.id;
    set.resolvedAt = new Date();
  }
  const remarkText = (data.remarks || (data as any).notes) ?? undefined;
  if (nextStatus === "REJECTED" && remarkText) {
    set.rejectionReason = remarkText;
  }

  return updateComplaintDocument(complaintId, set, createRemark(remarkText, user));
};

export const completeComplaintWork = async (
  complaintId: string,
  data: CompleteComplaintWorkInput,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  const complaint = await getComplaintOrThrow(complaintId);
  assertStaffAssignedToComplaint(user, complaint);
  assertNotTerminal(complaint);

  const currentStatus = getComplaintStatus(complaint);

  if (!completionAllowedStatuses.has(currentStatus)) {
    throw new AppError(`Complaint work cannot be completed while it is ${currentStatus}`, 400);
  }

  const set: Record<string, unknown> = {
    status: "AWAITING_APPROVAL",
    completionDetails: {
      details: data.completionDetails,
      completedBy: user.id,
      completedAt: new Date(),
    },
  };

  if (data.finalCost !== undefined) {
    set.finalCost = data.finalCost;
  }

  const updatedComplaint = await updateComplaintDocument(complaintId, set, createRemark(data.remarks, user));



  return updatedComplaint;
};

export const approveComplaint = async (
  complaintId: string,
  data: ApproveComplaintInput,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  const complaint = await getComplaintOrThrow(complaintId);
  assertManagerCanManageComplaint(user, complaint);
  assertNotTerminal(complaint);

  const currentStatus = getComplaintStatus(complaint);

  if (!approvalAllowedStatuses.has(currentStatus)) {
    throw new AppError("Only completed complaints awaiting approval can be approved", 400);
  }

  const remarkText = (data.remarks || (data as any).notes) ?? undefined;
  const now = new Date();

  const set: Record<string, unknown> = {
    status: "RESOLVED",
    resolvedAt: now,
    resolvedBy: user.id,
    approvalDetails: {
      status: "APPROVED",
      reviewedBy: user.id,
      reviewedAt: now,
      remarks: remarkText ?? null,
      rejectionReason: null,
    },
    residentConfirmation: {
      status: "PENDING",
      requestedAt: now,
      confirmedBy: null,
      confirmedAt: null,
      remarks: null,
    },
  };

  const updatedComplaint = await updateComplaintDocument(complaintId, set, createRemark(remarkText, user));

  return updatedComplaint;
};

export const rejectComplaint = async (
  complaintId: string,
  data: RejectComplaintInput,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  const complaint = await getComplaintOrThrow(complaintId);
  assertManagerCanManageComplaint(user, complaint);
  assertNotTerminal(complaint);

  const currentStatus = getComplaintStatus(complaint);

  if (!approvalAllowedStatuses.has(currentStatus)) {
    throw new AppError("Only completed complaints awaiting approval can be rejected", 400);
  }

  const reasonText = (data.reason || (data as any).notes || data.remarks) ?? "Rejected by manager";
  const remarkText = (data.remarks || (data as any).notes || data.reason) ?? undefined;
  const now = new Date();

  const set: Record<string, unknown> = {
    status: "REJECTED",
    approvalDetails: {
      status: "REJECTED",
      reviewedBy: user.id,
      reviewedAt: now,
      remarks: remarkText ?? null,
      rejectionReason: reasonText,
    },
    rejectionReason: reasonText,
  };

  const updatedComplaint = await updateComplaintDocument(complaintId, set, createRemark(remarkText, user));

  return updatedComplaint;
};

export const cancelComplaint = async (
  complaintId: string,
  data: CancelComplaintInput,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  const complaint = await getComplaintOrThrow(complaintId);
  const role = normalizeRole(user.role);

  if (residentRoles.has(role)) {
    if (!sameId(complaint.resident, user.id)) {
      throw new AppError("You can only cancel your own complaints", 403);
    }

    if (!["PENDING", "UNDER_REVIEW"].includes(getComplaintStatus(complaint))) {
      throw new AppError("Residents can only cancel complaints before assignment", 400);
    }
  } else if (managementRoles.has(role)) {
    assertManagerCanManageComplaint(user, complaint);
  } else {
    throw new AppError("You do not have permission to cancel complaints", 403);
  }

  assertNotTerminal(complaint);

  const reasonText = (data.reason || (data as any).notes || (data as any).remarks) ?? undefined;

  const set: Record<string, unknown> = {
    status: "CANCELLED",
    cancelledBy: user.id,
    cancelledAt: new Date(),
    cancellationReason: reasonText ?? null,
  };

  return updateComplaintDocument(complaintId, set, createRemark(reasonText, user));
};

export const confirmComplaintResolution = async (
  complaintId: string,
  data: ConfirmComplaintResolutionInput,
  user: AuthenticatedComplaintUser
) => {
  await ensureCurrentUserExists(user);

  const complaint = await getComplaintOrThrow(complaintId);
  const role = normalizeRole(user.role);

  if (!residentRoles.has(role)) {
    throw new AppError("Only the resident can confirm complaint resolution", 403);
  }

  if (!sameId(complaint.resident, user.id)) {
    throw new AppError("You can only confirm your own complaint", 403);
  }

  const currentStatus = getComplaintStatus(complaint);

  if (currentStatus === "CLOSED" && complaint.residentConfirmation?.status === "CONFIRMED") {
    return complaint;
  }

  if (currentStatus !== "APPROVED") {
    throw new AppError("Only approved complaints can be confirmed", 400);
  }

  const now = new Date();
  const updatedComplaint = await updateComplaintDocument(
    complaintId,
    {
      status: "CLOSED",
      residentConfirmation: {
        status: "CONFIRMED",
        requestedAt: complaint.residentConfirmation?.requestedAt ?? now,
        confirmedBy: user.id,
        confirmedAt: now,
        remarks: data.remarks ?? null,
      },
      closedBy: user.id,
      closedAt: now,
    },
    createRemark(data.remarks ?? "Resident confirmed resolution", user)
  );



  return updatedComplaint;
};
