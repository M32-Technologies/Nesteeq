import { Worker, type Job } from "bullmq";
import { Types } from "mongoose";
import redis from "../../config/redis.js";
import {
    Announcement,
    AnnouncementStatus,
    AnnouncementTargetType,
    AnnouncementType,
} from "../../modules/announcements/announcements.model.js";
import { Flat } from "../../modules/flat/flat.model.js";
import { Notification } from "../../modules/notification/notification.model.js";
import type {
    NotificationSeverity,
    NotificationType,
} from "../../modules/notification/notification.types.js";
import { ResidentModel } from "../../modules/resident/resident.model.js";
import {
    ANNOUNCEMENT_CREATED_JOB,
    NOTIFICATION_QUEUE_NAME,
    type AnnouncementCreatedJobData,
    type NotificationJobPayload,
} from "../queues/notification.queue.js";
import { sendRealtimeNotification } from "../../socket/socket.js";

export const BATCH_SIZE = 500;

interface BatchProcessResult {
    batchNumber: number;
    batchSize: number;
    upsertedCount: number;
    matchedCount: number;
}

interface BatchInput {
    batchNumber: number;
    userIds: string[];
    announcementId: string;
    apartmentId: string;
    title: string;
    message: string;
    createdBy: string | null;
    notificationType: NotificationType;
    severity: NotificationSeverity;
}
const processResidentBatch = async ({ batchNumber, userIds, announcementId, apartmentId, title, message, createdBy, notificationType, severity, }: BatchInput): Promise<BatchProcessResult> => {
    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
    if (uniqueUserIds.length === 0) {
        return {
            batchNumber,
            batchSize: 0,
            upsertedCount: 0,
            matchedCount: 0,
        };
    }

    // 1. Idempotent persistent notification insertion via bulkWrite + $setOnInsert
    const bulkOps = uniqueUserIds.map((userId) => ({
        updateOne: {
            filter: {
                relatedResourceId: announcementId,
                recipientUserId: userId,
            },
            update: {
                $setOnInsert: {
                    apartment: apartmentId,
                    recipientUserId: userId,
                    recipientRole: null,
                    type: notificationType,
                    severity,
                    title: title.slice(0, 160),
                    message: message.slice(0, 1000),
                    relatedResourceType: "ANNOUNCEMENT",
                    relatedResourceId: announcementId,
                    createdBy,
                    readAt: null,
                },
            },
            upsert: true,
        },
    }));

    const writeResult = await Notification.bulkWrite(bulkOps, { ordered: false });

    // 2. Deliver real-time Socket.IO notification to online residents
    const realtimePayload = {
        apartment: apartmentId,
        type: notificationType,
        severity,
        title,
        message,
        relatedResourceType: "ANNOUNCEMENT",
        relatedResourceId: announcementId,
        readAt: null,
        createdAt: new Date(),
    };

    for (const userId of uniqueUserIds) {
        try {
            sendRealtimeNotification(userId, {
                ...realtimePayload,
                recipientUserId: userId,
            });
        } catch (socketError) {
            console.warn(
                `[NotificationWorker] Socket emit failed for user ${userId}:`,
                socketError
            );
        }
    }

    return {
        batchNumber,
        batchSize: uniqueUserIds.length,
        upsertedCount: writeResult.upsertedCount || 0,
        matchedCount: writeResult.matchedCount || 0,
    };
};

export const processAnnouncementCreatedJob = async (
    data: AnnouncementCreatedJobData
) => {
    const { announcementId, apartmentId, type: jobType } = data;

    if (!announcementId || !apartmentId) {
        throw new Error(
            `Invalid job payload: announcementId (${announcementId}) and apartmentId (${apartmentId}) are required`
        );
    }

    // 1. Fetch announcement
    const announcement = await Announcement.findById(announcementId).lean();
    if (!announcement) {
        console.warn(
            `[NotificationWorker] Announcement ${announcementId} not found. Skipping job.`
        );
        return { skipped: true, reason: "Announcement not found" };
    }

    if (announcement.status !== AnnouncementStatus.PUBLISHED) {
        console.warn(
            `[NotificationWorker] Announcement ${announcementId} is not published (status: ${announcement.status}). Skipping job.`
        );
        return { skipped: true, reason: `Status is ${announcement.status}` };
    }

    // 2. Determine notification severity and type
    const isEmergency = jobType === "emergency" || announcement.type === AnnouncementType.EMERGENCY;
    const notificationType: NotificationType = isEmergency ? "EMERGENCY_ANNOUNCEMENT" : "ANNOUNCEMENT";
    const severity: NotificationSeverity = isEmergency ? "ERROR" : "INFO";

    // 3. Resolve target resident query filter
    const residentFilter: Record<string, unknown> = {
        apartmentId: new Types.ObjectId(apartmentId),
        status: "active",
        userId: { $exists: true, $ne: null },
    };

    if (
        announcement.targetType === AnnouncementTargetType.BLOCK &&
        Array.isArray(announcement.targetIds) &&
        announcement.targetIds.length > 0
    ) {
        const validBlockObjectIds = announcement.targetIds
            .filter((id) => Types.ObjectId.isValid(id))
            .map((id) => new Types.ObjectId(id));

        if (validBlockObjectIds.length > 0) {
            const flatsInBlocks = await Flat.find({
                apartmentId: new Types.ObjectId(apartmentId),
                blockId: { $in: validBlockObjectIds },
            })
                .select("_id")
                .lean();

            const flatIds = flatsInBlocks.map((f) => f._id);
            residentFilter.flatId = { $in: flatIds };
        }
    }

    // 4. Stream residents in batches using MongoDB cursor
    const cursor = ResidentModel.find(residentFilter)
        .select("userId")
        .lean()
        .cursor({ batchSize: BATCH_SIZE });

    let currentBatch: string[] = [];
    let batchIndex = 1;
    let totalProcessed = 0;
    let totalUpserted = 0;

    for await (const residentDoc of cursor) {
        if (residentDoc.userId) {
            currentBatch.push(residentDoc.userId);
        }

        if (currentBatch.length >= BATCH_SIZE) {
            const result = await processResidentBatch({
                batchNumber: batchIndex,
                userIds: currentBatch,
                announcementId,
                apartmentId,
                title: announcement.title,
                message: announcement.message,
                createdBy: announcement.createdBy || null,
                notificationType,
                severity,
            });

            totalProcessed += result.batchSize;
            totalUpserted += result.upsertedCount;
            batchIndex += 1;
            currentBatch = [];
        }
    }

    // Process remaining residents in final batch
    if (currentBatch.length > 0) {
        const result = await processResidentBatch({
            batchNumber: batchIndex,
            userIds: currentBatch,
            announcementId,
            apartmentId,
            title: announcement.title,
            message: announcement.message,
            createdBy: announcement.createdBy || null,
            notificationType,
            severity,
        });

        totalProcessed += result.batchSize;
        totalUpserted += result.upsertedCount;
    }

    console.log(
        `[NotificationWorker] Announcement ${announcementId} processed: ${totalProcessed} residents notified across ${batchIndex} batch(es) (${totalUpserted} newly inserted).`
    );

    return {
        success: true,
        announcementId,
        totalProcessed,
        totalUpserted,
    };
};

export const notificationWorker = new Worker<NotificationJobPayload>(
    NOTIFICATION_QUEUE_NAME,
    async (job: Job<NotificationJobPayload>) => {
        console.log(`[NotificationWorker] Starting job ${job.id} (name: ${job.name})`);

        if (job.name === "test-notification") {
            console.log(`[NotificationWorker] Test notification received:`, job.data);
            return { success: true, test: true, data: job.data };
        }

        if (job.name === ANNOUNCEMENT_CREATED_JOB) {
            return await processAnnouncementCreatedJob(
                job.data as AnnouncementCreatedJobData
            );
        }

        console.warn(`[NotificationWorker] Unknown job name: ${job.name}`);
        return { unknownJob: true };
    },
    {
        connection: redis,
    }
);

notificationWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

notificationWorker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed`, error);
});
