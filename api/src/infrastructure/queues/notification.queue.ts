import { Queue } from "bullmq";
import redis from "../../config/redis.js";

export const NOTIFICATION_QUEUE_NAME = "notification";
export const ANNOUNCEMENT_CREATED_JOB = "announcement-created";

export type AnnouncementNotificationType = "normal" | "emergency";

export interface AnnouncementCreatedJobData {
  announcementId: string;
  apartmentId: string;
  type: AnnouncementNotificationType;
}

export type NotificationJobPayload =
  | AnnouncementCreatedJobData
  | { message?: string;[key: string]: unknown };

export const notificationQueue = new Queue<NotificationJobPayload>(
  NOTIFICATION_QUEUE_NAME,
  {
    connection: redis,

    defaultJobOptions: {
      attempts: 4,

      backoff: {
        type: "exponential",
        delay: 5000,
      },

      removeOnComplete: {
        age: 3600,
        count: 10,
      },

      removeOnFail: 100,
    },
  }
);
