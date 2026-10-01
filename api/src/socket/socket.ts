import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import { env } from "../config/env.js";
import { normalizeRole } from "../utils/role.js";

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.webUrl || "http://localhost:3000",
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    const rawUserId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
    const rawApartmentId = socket.handshake.auth?.apartmentId || socket.handshake.query?.apartmentId;
    const rawRole = socket.handshake.auth?.role || socket.handshake.query?.role;

    const userId = typeof rawUserId === "string" ? rawUserId.trim() : null;
    const apartmentId = typeof rawApartmentId === "string" ? rawApartmentId.trim() : null;
    const role = typeof rawRole === "string" ? normalizeRole(rawRole) : null;

    if (userId) {
      socket.join(`user:${userId}`);
    }

    if (apartmentId) {
      socket.join(`apartment:${apartmentId}`);
    }

    if (role) {
      socket.join(`role:${role}`);
      if (apartmentId) {
        socket.join(`apartment:${apartmentId}:role:${role}`);
      }
    }

    socket.on(
      "join",
      (data: { userId?: string; apartmentId?: string; role?: string }) => {
        if (typeof data?.userId === "string" && data.userId.trim()) {
          socket.join(`user:${data.userId.trim()}`);
        }
        if (typeof data?.apartmentId === "string" && data.apartmentId.trim()) {
          socket.join(`apartment:${data.apartmentId.trim()}`);
        }
        if (typeof data?.role === "string" && data.role.trim()) {
          const normRole = normalizeRole(data.role);
          socket.join(`role:${normRole}`);
          if (data?.apartmentId && typeof data.apartmentId === "string") {
            socket.join(`apartment:${data.apartmentId.trim()}:role:${normRole}`);
          }
        }
      }
    );

    socket.on("disconnect", () => {
      // socket disconnected
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => io;

export const isUserOnline = (userId: string): boolean => {
  if (!io) return false;
  const room = io.sockets.adapter.rooms.get(`user:${userId}`);
  return (room?.size ?? 0) > 0;
};

export const sendRealtimeNotification = (
  userId: string,
  notification: Record<string, unknown>
): boolean => {
  if (!io) return false;
  io.to(`user:${userId}`).emit("notification", notification);
  if (
    notification.type === "EMERGENCY_ANNOUNCEMENT" ||
    notification.severity === "ERROR" ||
    notification.severity === "URGENT"
  ) {
    io.to(`user:${userId}`).emit("emergency_alert", notification);
  }
  return true;
};

export const sendRealtimeNotificationToRole = (
  role: string,
  notification: Record<string, unknown>,
  apartmentId?: string
): boolean => {
  if (!io) return false;
  const normalized = normalizeRole(role);

  if (apartmentId) {
    io.to(`apartment:${apartmentId}:role:${normalized}`).emit(
      "notification",
      notification
    );
  } else {
    io.to(`role:${normalized}`).emit("notification", notification);
  }

  return true;
};

export const sendRealtimeNotificationToApartment = (
  apartmentId: string,
  notification: Record<string, unknown>
): boolean => {
  if (!io) return false;
  io.to(`apartment:${apartmentId}`).emit("notification", notification);
  return true;
};
