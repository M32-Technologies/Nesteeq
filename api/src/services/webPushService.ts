import webpush from "web-push";
import { env } from "../config/env.js";
import { PushSubscription } from "../modules/notification/push-subscription.model.js";
import { getAuthDB } from "../config/auth-db.js";
import { normalizeRole } from "../utils/role.js";

export interface WebPushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
}

let isVapidConfigured = false;

export const initializeWebPush = (): boolean => {
  if (isVapidConfigured) return true;

  if (env.vapidPublicKey && env.vapidPrivateKey) {
    try {
      webpush.setVapidDetails(
        env.vapidSubject || "mailto:support@nesteeq.com",
        env.vapidPublicKey,
        env.vapidPrivateKey
      );
      isVapidConfigured = true;
      console.log("[WebPush] VAPID details configured successfully.");
      return true;
    } catch (err) {
      console.error("[WebPush] Failed to initialize VAPID details:", err);
      return false;
    }
  } else {
    console.warn("[WebPush] VAPID keys not configured in environment.");
    return false;
  }
};

// Initialize immediately on module load
initializeWebPush();

/**
 * Saves or updates a Web Push subscription for a user.
 */
export const savePushSubscription = async (
  userId: string,
  apartmentId: string | null | undefined,
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  userAgent?: string
) => {
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    throw new Error("Invalid push subscription object: missing endpoint or keys");
  }

  // Detect simple device category
  const ua = userAgent?.toLowerCase() || "";
  const deviceType = ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")
    ? "mobile"
    : ua.includes("tablet") || ua.includes("ipad")
    ? "tablet"
    : "desktop";

  return PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    {
      userId,
      apartmentId: apartmentId ?? null,
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      deviceType,
      userAgent: userAgent || null,
    },
    { upsert: true, new: true }
  );
};

/**
 * Removes a push subscription by its endpoint.
 */
export const deletePushSubscription = async (endpoint: string) => {
  if (!endpoint) return;
  await PushSubscription.deleteOne({ endpoint });
};

/**
 * Sends a Web Push notification to all active devices of a given user.
 */
export const sendWebPushToUser = async (
  userId: string,
  payload: WebPushPayload
): Promise<number> => {
  if (!initializeWebPush()) return 0;
  if (!userId) return 0;

  const subscriptions = await PushSubscription.find({ userId }).lean();
  if (subscriptions.length === 0) return 0;

  const notificationBody = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: payload.badge || "/icons/badge-72x72.png",
    tag: payload.tag || "nesteeq-alert",
    data: {
      url: payload.url || "/",
      ...payload.data,
    },
    requireInteraction: payload.requireInteraction ?? false,
  });

  let deliveredCount = 0;
  const expiredEndpoints: string[] = [];

  const promises = subscriptions.map(async (sub) => {
    if (!sub.keys?.p256dh || !sub.keys?.auth) return;
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        },
        notificationBody
      );
      deliveredCount++;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      // 404 or 410 indicates subscription has expired or was unsubscribed
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        expiredEndpoints.push(sub.endpoint);
      } else {
        console.error(`[WebPush] Error sending to endpoint ${sub.endpoint}:`, error?.message || error);
      }
    }
  });

  await Promise.allSettled(promises);

  if (expiredEndpoints.length > 0) {
    await PushSubscription.deleteMany({ endpoint: { $in: expiredEndpoints } });
  }

  return deliveredCount;
};

/**
 * Sends a Web Push notification to multiple users simultaneously.
 */
export const sendWebPushToUsers = async (
  userIds: string[],
  payload: WebPushPayload
): Promise<number> => {
  if (!initializeWebPush() || !userIds || userIds.length === 0) return 0;

  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueUserIds.length === 0) return 0;

  const results = await Promise.allSettled(
    uniqueUserIds.map((userId) => sendWebPushToUser(userId, payload))
  );

  return results.reduce((acc, curr) => {
    return curr.status === "fulfilled" ? acc + curr.value : acc;
  }, 0);
};

/**
 * Sends a Web Push notification to all users matching a specific role in an apartment.
 * E.g., SECURITY_STAFF, PROPERTY_MANAGER, RESIDENT
 */
export const sendWebPushToRole = async (
  role: string,
  apartmentId: string | undefined | null,
  payload: WebPushPayload
): Promise<number> => {
  if (!initializeWebPush()) return 0;

  const normalized = normalizeRole(role);
  const authDb = getAuthDB();

  const query: Record<string, unknown> = {
    role: { $regex: new RegExp(`^${normalized}$`, "i") },
  };

  if (apartmentId) {
    query.apartmentId = apartmentId.toString();
  }

  try {
    const matchingUsers = await authDb
      .collection<{ id?: string; _id?: { toString: () => string } }>("user")
      .find(query, { projection: { id: 1, _id: 1 } })
      .toArray();

    const userIds = matchingUsers
      .map((u) => u.id || u._id?.toString())
      .filter((id): id is string => Boolean(id));

    if (userIds.length === 0) return 0;

    return await sendWebPushToUsers(userIds, payload);
  } catch (err) {
    console.error(`[WebPush] Failed to resolve users for role ${role}:`, err);
    return 0;
  }
};
