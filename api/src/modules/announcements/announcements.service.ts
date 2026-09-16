import { Types } from "mongoose";

import { getAuthDB } from "../../config/auth-db.js";
import { AppError } from "../../utils/AppError.js";
import { escapeRegExp } from "../../utils/regex.js";
import { Block } from "../block/block.model.js";
import { Flat } from "../flat/flat.model.js";
import { ResidentModel } from "../resident/resident.model.js";
import {
  Announcement,
  AnnouncementPriority,
  AnnouncementStatus,
  AnnouncementTargetType,
  AnnouncementType,
  type IAnnouncement,
} from "./announcements.model.js";
import type {
  AnnouncementResponse,
  CreatorSummary,
  EmergencyBroadcastResponse,
  GetAnnouncementsResponse,
  TargetBlockSummary,
} from "./announcements.types.js";
import type {
  CreateAnnouncementInput,
  EmergencyBroadcastBody,
  ListAnnouncementsQuery,
  UpdateAnnouncementBody,
} from "./announcements.validation.js";

const validateObjectId = (id: string, label: string) => {
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new AppError(`${label} must be a valid id`, 400);
  }
};

const assertApartmentAndAnnouncementIds = (
  apartmentId: string,
  announcementId?: string
) => {
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }
  validateObjectId(apartmentId, "Apartment ID");

  if (announcementId !== undefined) {
    validateObjectId(announcementId, "Announcement ID");
  }
};

const validateTargetBlocks = async (
  apartmentId: string,
  targetIds: string[]
): Promise<string[]> => {
  const uniqueIds = Array.from(new Set((targetIds || []).filter(Boolean)));
  if (uniqueIds.length === 0) {
    throw new AppError(
      "targetIds must not be empty when targetType is BLOCK",
      400
    );
  }

  for (const id of uniqueIds) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError(`Invalid block ID: ${id}`, 400);
    }
  }

  const validObjectIds = uniqueIds.map((id) => new Types.ObjectId(id));
  const blocks = await Block.find({
    _id: { $in: validObjectIds },
    apartmentId: new Types.ObjectId(apartmentId),
  }).select("_id");

  if (blocks.length !== uniqueIds.length) {
    throw new AppError(
      "One or more target blocks do not exist in this apartment",
      400
    );
  }

  return uniqueIds;
};

type AuthUserSummary = {
  _id?: Types.ObjectId | string;
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

const getUserSummariesByIds = async (
  userIds: string[]
): Promise<Map<string, AuthUserSummary>> => {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (!unique.length) return new Map();

  const objIds = unique
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  const users = (await getAuthDB()
    .collection("user")
    .find({
      $or: [
        { id: { $in: unique } },
        ...(objIds.length ? [{ _id: { $in: objIds } }] : []),
      ],
    })
    .project({ _id: 1, id: 1, name: 1, email: 1, phone: 1 })
    .toArray()) as AuthUserSummary[];

  const map = new Map<string, AuthUserSummary>();
  for (const u of users) {
    if (u.id) map.set(u.id, u);
    if (u._id) map.set(u._id.toString(), u);
  }
  return map;
};

const getBlockSummariesByIds = async (
  apartmentId: string,
  announcements: Array<IAnnouncement & { _id: Types.ObjectId }>
): Promise<Map<string, TargetBlockSummary>> => {
  const allTargetBlockIds = Array.from(
    new Set(
      announcements
        .filter((a) => a.targetType === AnnouncementTargetType.BLOCK)
        .flatMap((a) => a.targetIds || [])
        .filter((id) => Types.ObjectId.isValid(id))
    )
  );

  const blockObjectIds = allTargetBlockIds.map((id) => new Types.ObjectId(id));
  const blocks = blockObjectIds.length
    ? await Block.find({
      _id: { $in: blockObjectIds },
      apartmentId: new Types.ObjectId(apartmentId),
    })
      .select("_id blockname code")
      .lean()
    : [];

  const blockMap = new Map<string, TargetBlockSummary>();
  for (const block of blocks) {
    blockMap.set(block._id.toString(), {
      id: block._id.toString(),
      blockname: block.blockname,
      code: block.code,
    });
  }
  return blockMap;
};

const enrichAnnouncements = async (
  apartmentId: string,
  announcements: Array<IAnnouncement & { _id: Types.ObjectId }>
): Promise<AnnouncementResponse[]> => {
  if (announcements.length === 0) {
    return [];
  }

  const creatorIds = announcements.map((a) => a.createdBy);
  const [usersById, blockMap] = await Promise.all([
    getUserSummariesByIds(creatorIds),
    getBlockSummariesByIds(apartmentId, announcements),
  ]);

  return announcements.map((announcement) => {
    const creatorUser = usersById.get(announcement.createdBy);
    const creator: CreatorSummary | null = creatorUser
      ? {
        id: announcement.createdBy,
        name: creatorUser.name ?? null,
        email: creatorUser.email ?? null,
        phone: creatorUser.phone ?? null,
      }
      : null;

    const targetBlocks: TargetBlockSummary[] = (announcement.targetIds || [])
      .map((blockId) => blockMap.get(blockId))
      .filter((b): b is TargetBlockSummary => Boolean(b));

    return {
      id: announcement._id.toString(),
      apartmentId: announcement.apartmentId.toString(),
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      priority: announcement.priority,
      status: announcement.status,
      targetType: announcement.targetType,
      targetIds: announcement.targetIds || [],
      targetBlocks:
        announcement.targetType === AnnouncementTargetType.BLOCK
          ? targetBlocks
          : undefined,
      createdBy: announcement.createdBy,
      creator,
      expiresAt: announcement.expiresAt ?? null,
      createdAt: announcement.createdAt || new Date(),
      updatedAt: announcement.updatedAt || new Date(),
    };
  });
};

export const createAnnouncementService = async (
  apartmentId: string,
  createdBy: string,
  data: CreateAnnouncementInput
): Promise<AnnouncementResponse> => {
  assertApartmentAndAnnouncementIds(apartmentId);

  if (!createdBy) {
    throw new AppError("Creator user is required", 400);
  }

  let targetIds: string[] = [];
  if (data.targetType === AnnouncementTargetType.BLOCK) {
    targetIds = await validateTargetBlocks(apartmentId, data.targetIds || []);
  }

  let expiresAt: Date | null = null;
  if (data.expiresAt) {
    const parsedDate = new Date(data.expiresAt);
    if (isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
      throw new AppError("Expiration date must be a valid future date", 400);
    }
    expiresAt = parsedDate;
  }

  const announcement = await Announcement.create({
    apartmentId: new Types.ObjectId(apartmentId),
    createdBy,
    title: data.title,
    message: data.message,
    type: data.type,
    priority: data.priority,
    status: data.status,
    targetType: data.targetType,
    targetIds,
    expiresAt,
  });

  const [enriched] = await enrichAnnouncements(apartmentId, [
    announcement.toObject() as unknown as IAnnouncement & { _id: Types.ObjectId },
  ]);

  return enriched;
};

export const getAnnouncementsService = async (
  apartmentId: string,
  query: ListAnnouncementsQuery
): Promise<GetAnnouncementsResponse> => {
  assertApartmentAndAnnouncementIds(apartmentId);

  const filter: Record<string, unknown> = {
    apartmentId: new Types.ObjectId(apartmentId),
  };

  if (query.type) {
    filter.type = query.type;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.targetType) {
    filter.targetType = query.targetType;
  }

  if (query.search) {
    const searchRegex = new RegExp(escapeRegExp(query.search.trim()), "i");
    filter.$or = [{ title: searchRegex }, { message: searchRegex }];
  }

  const page = query.page && Number(query.page) > 0 ? Number(query.page) : 1;
  const limit =
    query.limit && Number(query.limit) > 0
      ? Math.min(Number(query.limit), 100)
      : 10;
  const skip = (page - 1) * limit;

  const [total, rawAnnouncements, statsCounts] = await Promise.all([
    Announcement.countDocuments(filter),
    Announcement.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Announcement.aggregate<{ _id: string; count: number }>([
      { $match: { apartmentId: new Types.ObjectId(apartmentId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const stats = {
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
  };

  for (const s of statsCounts) {
    if (s._id === AnnouncementStatus.PUBLISHED) stats.published = s.count;
    else if (s._id === AnnouncementStatus.DRAFT) stats.draft = s.count;
    else if (s._id === AnnouncementStatus.ARCHIVED) stats.archived = s.count;
    stats.total += s.count;
  }

  const announcements = await enrichAnnouncements(
    apartmentId,
    rawAnnouncements as unknown as Array<IAnnouncement & { _id: Types.ObjectId }>
  );

  return {
    announcements,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
    stats,
  };
};

export const getAnnouncementByIdService = async (
  apartmentId: string,
  announcementId: string
): Promise<AnnouncementResponse> => {
  assertApartmentAndAnnouncementIds(apartmentId, announcementId);

  const rawAnnouncement = await Announcement.findOne({
    _id: new Types.ObjectId(announcementId),
    apartmentId: new Types.ObjectId(apartmentId),
  }).lean();

  if (!rawAnnouncement) {
    throw new AppError("Announcement not found in this apartment", 404);
  }

  const [enriched] = await enrichAnnouncements(apartmentId, [
    rawAnnouncement as unknown as IAnnouncement & { _id: Types.ObjectId },
  ]);

  return enriched;
};

export const updateAnnouncementService = async (
  apartmentId: string,
  announcementId: string,
  data: UpdateAnnouncementBody
): Promise<AnnouncementResponse> => {
  assertApartmentAndAnnouncementIds(apartmentId, announcementId);

  const announcement = await Announcement.findOne({
    _id: new Types.ObjectId(announcementId),
    apartmentId: new Types.ObjectId(apartmentId),
  });

  if (!announcement) {
    throw new AppError("Announcement not found in this apartment", 404);
  }

  // Apply plain field updates first, unconditionally, so the EMERGENCY
  // branch below only has to decide targeting/priority/status overrides —
  // it can no longer silently interact with title/message ordering.
  if (data.title !== undefined) announcement.title = data.title;
  if (data.message !== undefined) announcement.message = data.message;

  if (data.expiresAt !== undefined) {
    if (data.expiresAt) {
      const expDate = new Date(data.expiresAt);
      if (isNaN(expDate.getTime()) || expDate <= new Date()) {
        throw new AppError("Expiration date must be a valid future date", 400);
      }
      announcement.expiresAt = expDate;
    } else {
      announcement.expiresAt = null;
    }
  }

  const effectiveType = data.type ?? announcement.type;

  if (effectiveType === AnnouncementType.EMERGENCY) {
    announcement.type = AnnouncementType.EMERGENCY;
    announcement.priority = AnnouncementPriority.URGENT;
    announcement.status = AnnouncementStatus.PUBLISHED;
    announcement.targetType = AnnouncementTargetType.ALL_RESIDENTS;
    announcement.targetIds = [];
  } else {
    if (data.type !== undefined) announcement.type = data.type;
    if (data.priority !== undefined) announcement.priority = data.priority;
    if (data.status !== undefined) announcement.status = data.status;

    const effectiveTargetType = data.targetType ?? announcement.targetType;
    let effectiveTargetIds = data.targetIds ?? announcement.targetIds ?? [];

    if (effectiveTargetType === AnnouncementTargetType.BLOCK) {
      effectiveTargetIds = await validateTargetBlocks(
        apartmentId,
        effectiveTargetIds
      );
      announcement.targetType = AnnouncementTargetType.BLOCK;
      announcement.targetIds = effectiveTargetIds;
    } else {
      announcement.targetType = AnnouncementTargetType.ALL_RESIDENTS;
      announcement.targetIds = [];
    }
  }

  await announcement.save();

  const [enriched] = await enrichAnnouncements(apartmentId, [
    announcement.toObject() as unknown as IAnnouncement & { _id: Types.ObjectId },
  ]);

  return enriched;
};

export const updateAnnouncementStatusService = async (
  apartmentId: string,
  announcementId: string,
  status: AnnouncementStatus
): Promise<AnnouncementResponse> => {
  assertApartmentAndAnnouncementIds(apartmentId, announcementId);

  const announcement = await Announcement.findOne({
    _id: new Types.ObjectId(announcementId),
    apartmentId: new Types.ObjectId(apartmentId),
  });

  if (!announcement) {
    throw new AppError("Announcement not found in this apartment", 404);
  }

  announcement.status = status;
  await announcement.save();

  const [enriched] = await enrichAnnouncements(apartmentId, [
    announcement.toObject() as unknown as IAnnouncement & { _id: Types.ObjectId },
  ]);

  return enriched;
};

export const deleteAnnouncementService = async (
  apartmentId: string,
  announcementId: string
): Promise<{ id: string; deleted: true }> => {
  assertApartmentAndAnnouncementIds(apartmentId, announcementId);

  const deleted = await Announcement.findOneAndDelete({
    _id: new Types.ObjectId(announcementId),
    apartmentId: new Types.ObjectId(apartmentId),
  });

  if (!deleted) {
    throw new AppError("Announcement not found in this apartment", 404);
  }

  return { id: announcementId, deleted: true };
};

export const getResidentAnnouncementsService = async (
  apartmentId: string,
  userId: string
): Promise<AnnouncementResponse[]> => {
  assertApartmentAndAnnouncementIds(apartmentId);

  const residentBlockIds: string[] = [];
  if (userId) {
    const residents = await ResidentModel.find({
      userId,
      apartmentId: new Types.ObjectId(apartmentId),
      status: "active",
    })
      .select("flatId")
      .lean();

    const flatIds = residents.map((r) => r.flatId).filter(Boolean);
    if (flatIds.length > 0) {
      const flats = await Flat.find({
        _id: { $in: flatIds },
        apartmentId: new Types.ObjectId(apartmentId),
      })
        .select("blockId")
        .lean();

      for (const flat of flats) {
        if (flat?.blockId) {
          residentBlockIds.push(flat.blockId.toString());
        }
      }
    }
  }

  const uniqueResidentBlockIds = Array.from(new Set(residentBlockIds));

  const now = new Date();
  const targetConditions: Array<Record<string, unknown>> = [
    { targetType: AnnouncementTargetType.ALL_RESIDENTS },
  ];

  if (uniqueResidentBlockIds.length > 0) {
    targetConditions.push({
      targetType: AnnouncementTargetType.BLOCK,
      targetIds: { $in: uniqueResidentBlockIds },
    });
  }

  const filter: Record<string, unknown> = {
    apartmentId: new Types.ObjectId(apartmentId),
    status: AnnouncementStatus.PUBLISHED,
    $and: [
      {
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      },
      {
        $or: targetConditions,
      },
    ],
  };

  const rawAnnouncements = await Announcement.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  return enrichAnnouncements(
    apartmentId,
    rawAnnouncements as unknown as Array<IAnnouncement & { _id: Types.ObjectId }>
  );
};

export const broadcastEmergencyService = async (
  apartmentId: string,
  createdBy: string,
  data: EmergencyBroadcastBody
): Promise<EmergencyBroadcastResponse> => {
  assertApartmentAndAnnouncementIds(apartmentId);

  if (!createdBy) {
    throw new AppError("Creator user is required", 400);
  }

  // Edge case 1: Anti-spam / duplicate broadcast protection within 60 seconds
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const recentDuplicate = await Announcement.findOne({
    apartmentId: new Types.ObjectId(apartmentId),
    type: AnnouncementType.EMERGENCY,
    title: data.title.trim(),
    createdAt: { $gte: oneMinuteAgo },
  }).lean();

  if (recentDuplicate) {
    throw new AppError(
      "A similar emergency broadcast was sent less than 60 seconds ago. Please wait before broadcasting again.",
      429
    );
  }

  // Target block validation
  let targetIds: string[] = [];
  let targetBlocks: TargetBlockSummary[] = [];

  if (data.targetType === AnnouncementTargetType.BLOCK) {
    targetIds = await validateTargetBlocks(apartmentId, data.targetIds || []);
    const blockDocs = await Block.find({
      _id: { $in: targetIds.map((id) => new Types.ObjectId(id)) },
      apartmentId: new Types.ObjectId(apartmentId),
    })
      .select("_id blockname code")
      .lean();

    targetBlocks = blockDocs.map((b) => ({
      id: b._id.toString(),
      blockname: b.blockname,
      code: b.code,
    }));
  }

  // Edge case 2: Calculate estimated audience (active residents and flats count)
  let residentsCount = 0;
  let flatsCount = 0;

  if (data.targetType === AnnouncementTargetType.ALL_RESIDENTS) {
    const [resCount, flCount] = await Promise.all([
      ResidentModel.countDocuments({
        apartmentId: new Types.ObjectId(apartmentId),
        status: "active",
      }),
      Flat.countDocuments({
        apartmentId: new Types.ObjectId(apartmentId),
      }),
    ]);
    residentsCount = resCount;
    flatsCount = flCount;
  } else {
    // Specific blocks targeted
    const targetBlockObjectIds = targetIds.map((id) => new Types.ObjectId(id));
    const flatsInBlocks = await Flat.find({
      apartmentId: new Types.ObjectId(apartmentId),
      blockId: { $in: targetBlockObjectIds },
    })
      .select("_id")
      .lean();

    const flatObjectIds = flatsInBlocks.map((f) => f._id);
    flatsCount = flatObjectIds.length;

    if (flatObjectIds.length > 0) {
      residentsCount = await ResidentModel.countDocuments({
        apartmentId: new Types.ObjectId(apartmentId),
        flatId: { $in: flatObjectIds },
        status: "active",
      });
    }
  }

  // Format emergency message with immediate action instructions & emergency contact if provided
  let fullMessage = data.message.trim();
  if (data.actionInstructions?.trim()) {
    fullMessage += `\n\nImmediate Actions Required:\n${data.actionInstructions.trim()}`;
  }
  if (data.contactPhone?.trim()) {
    fullMessage += `\n\nEmergency Control Contact: ${data.contactPhone.trim()}`;
  }

  // Invariants: EMERGENCY type, URGENT priority, PUBLISHED status, no silent auto-expiry
  const announcement = await Announcement.create({
    apartmentId: new Types.ObjectId(apartmentId),
    createdBy,
    title: data.title.trim(),
    message: fullMessage,
    type: AnnouncementType.EMERGENCY,
    priority: AnnouncementPriority.URGENT,
    status: AnnouncementStatus.PUBLISHED,
    targetType: data.targetType,
    targetIds,
    expiresAt: null,
  });

  return {
    id: announcement._id.toString(),
    apartmentId,
    category: data.category,
    title: announcement.title,
    message: announcement.message,
    priority: announcement.priority,
    status: announcement.status,
    targetType: announcement.targetType,
    targetBlocks: targetBlocks.length ? targetBlocks : undefined,
    actionInstructions: data.actionInstructions,
    contactPhone: data.contactPhone,
    createdBy,
    publishedAt: announcement.createdAt || new Date(),
    estimatedAudience: {
      residentsCount,
      flatsCount,
    },
  };
};