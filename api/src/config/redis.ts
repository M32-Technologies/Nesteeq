import { Redis } from "ioredis";
import { env } from "./env.js";

export const redisConnection = new Redis(env.redisUrl || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

redisConnection.on("connect", () => {
  console.log("Redis connected successfully");
});

redisConnection.on("error", (error) => {
  console.error("Redis connection error:", error);
});
