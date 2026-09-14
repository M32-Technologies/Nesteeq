import { Types } from "mongoose";

import { AppError } from "../../utils/AppError.js";
import { escapeRegExp } from "../../utils/regex.js";
import { getUserSummariesByIds } from "../../utils/security/directory.js";
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
  GetAnnouncementsResponse,
  TargetBlockSummary,
} from "./announcements.types.js";
import type {
  CreateAnnouncementInput,
  ListAnnouncementsQuery,
  UpdateAnnouncementBody,
} from "./announcements.validation.js";

const validateObjectId = (id: string, label: string) => {
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new AppError(`${label} must be a valid id`, 400);
  }
};

const validateTargetBlocks = async (
  apartmentId: string,
  targetIds: string[]
) => {
  if (!targetIds || targetIds.length === 0) {
    throw new AppError(
      "targetIds must not be empty when targetType is BLOCK",
      400
    );
  }

  for (const id of targetIds) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError(`Invalid block ID: ${id}`, 400);
    }
  }

  const validObjectIds = targetIds.map((id) => new Types.ObjectId(id));
  const blocks = await Block.find({
    _id: { $in: validObjectIds },
    apartmentId: new Types.ObjectId(apartmentId),
  }).select("_id");

  if (blocks.length !== targetIds.length) {
    throw new AppError(
      "One or more target blocks do not exist in this apartment",
      400
    );
  }
};

const enrichAnnouncements = async (
  apartmentId: string,
  announcements: Array<IAnnouncement & { _id: Types.ObjectId }>
): Promise<AnnouncementResponse[]> => {
  if (announcements.length === 0) {
    return [];
  }

  const creatorIds = announcements.map((a) => a.createdBy);
  const usersById = await getUserSummariesByIds(creatorIds);

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
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }
  validateObjectId(apartmentId, "Apartment ID");

  if (!createdBy) {
    throw new AppError("Creator user is required", 400);
  }

  if (data.targetType === AnnouncementTargetType.BLOCK) {
    await validateTargetBlocks(apartmentId, data.targetIds || []);
  }

  const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  if (expiresAt && isNaN(expiresAt.getTime())) {
    throw new AppError("Invalid expiresAt date format", 400);
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
    targetIds: data.targetIds || [],
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
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }
  validateObjectId(apartmentId, "Apartment ID");

  const filter: any = {
    apartmentId: new Types.ObjectId(apartmentId),
  };

  if (query.type) {
    filter.type = query.type;
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

  const [total, rawAnnouncements] = await Promise.all([
    Announcement.countDocuments(filter),
    Announcement.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

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
  };
};

export const getAnnouncementByIdService = async (
  apartmentId: string,
  announcementId: string
): Promise<AnnouncementResponse> => {
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }
  validateObjectId(apartmentId, "Apartment ID");
  validateObjectId(announcementId, "Announcement ID");

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
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }
  validateObjectId(apartmentId, "Apartment ID");
  validateObjectId(announcementId, "Announcement ID");

  const announcement = await Announcement.findOne({
    _id: new Types.ObjectId(announcementId),
    apartmentId: new Types.ObjectId(apartmentId),
  });

  if (!announcement) {
    throw new AppError("Announcement not found in this apartment", 404);
  }

  const effectiveTargetType = data.targetType ?? announcement.targetType;
  const effectiveTargetIds = data.targetIds ?? announcement.targetIds ?? [];

  if (effectiveTargetType === AnnouncementTargetType.BLOCK) {
    await validateTargetBlocks(apartmentId, effectiveTargetIds);
  }

  if (data.title !== undefined) announcement.title = data.title;
  if (data.message !== undefined) announcement.message = data.message;
  if (data.type !== undefined) announcement.type = data.type;
  if (data.priority !== undefined) announcement.priority = data.priority;
  if (data.status !== undefined) announcement.status = data.status;
  if (data.targetType !== undefined) announcement.targetType = data.targetType;
  if (data.targetIds !== undefined) announcement.targetIds = data.targetIds;

  if (data.expiresAt !== undefined) {
    announcement.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
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
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }
  validateObjectId(apartmentId, "Apartment ID");
  validateObjectId(announcementId, "Announcement ID");

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
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }
  validateObjectId(apartmentId, "Apartment ID");
  validateObjectId(announcementId, "Announcement ID");

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
  if (!apartmentId) {
    throw new AppError("Apartment context is required", 400);
  }
  validateObjectId(apartmentId, "Apartment ID");

  let residentBlockId: string | null = null;
  if (userId) {
    const resident = await ResidentModel.findOne({
      userId,
      apartmentId: new Types.ObjectId(apartmentId),
      status: "active",
    }).select("flatId");

    if (resident?.flatId) {
      const flat = await Flat.findById(resident.flatId).select("blockId").lean();
      if (flat?.blockId) {
        residentBlockId = flat.blockId.toString();
      }
    }
  }

  const now = new Date();
  const targetConditions: any[] = [
    { targetType: AnnouncementTargetType.ALL_RESIDENTS },
  ];

  if (residentBlockId) {
    targetConditions.push({
      targetType: AnnouncementTargetType.BLOCK,
      targetIds: residentBlockId,
    });
  }

  const filter: any = {
    apartmentId: new Types.ObjectId(apartmentId),
    status: AnnouncementStatus.PUBLISHED,
    $and: [
      {
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: now } },
        ],
      },
      {
        $or: targetConditions,
      },
    ],
  };

  const rawAnnouncements = await Announcement.find(filter)
    .sort({
      createdAt: -1,
    })
    .lean();

  return enrichAnnouncements(
    apartmentId,
    rawAnnouncements as unknown as Array<IAnnouncement & { _id: Types.ObjectId }>
  );
};