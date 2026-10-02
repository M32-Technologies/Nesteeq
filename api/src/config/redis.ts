import { Redis } from "ioredis";
import { env } from "./env.js";

const redis = new Redis(env.redisUrl || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  console.log("Redis connected successfully");
});

redis.on("error", (error) => {
  console.error("Redis connection error:", error);
});


export const redisConnection = redis;
export default redis;