import dotenv from "dotenv";
dotenv.config();

const mongoUrl = (process.env.MONGO_URL || "").trim();
const betterAuthSecret = (process.env.BETTER_AUTH_SECRET || "").trim();
const betterAuthUrl = (process.env.BETTER_AUTH_URL || "").trim();
const webUrl = (process.env.WEB_URL || "http://localhost:3000").trim();
const brevoApiKey = (
  process.env.BREVO_API_KEY ||
  process.env.BRAVO_API_KEY ||
  ""
).trim();
const brevoSenderEmail = (process.env.BREVO_SENDER_EMAIL || "").trim();
const brevoSenderName = (
  process.env.BREVO_SENDER_NAME ||
  "Nesteeq"
).trim();
const razorPayKeyId = (process.env.RAZORPAY_KEY_ID || "").trim();
const razorPaySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

const redisUrl = (process.env.REDIS_URL || "").trim();

const vapidPublicKey = (process.env.VAPID_PUBLIC_KEY || "").trim();
const vapidPrivateKey = (process.env.VAPID_PRIVATE_KEY || "").trim();
const vapidSubject = (process.env.VAPID_SUBJECT || "mailto:support@nesteeq.com").trim();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number((process.env.PORT ?? "6001").trim()),
  mongoUrl,
  betterAuthSecret,
  betterAuthUrl,
  webUrl,
  brevoApiKey,
  brevoSenderEmail,
  brevoSenderName,
  razorPayKeyId,
  razorPaySecret ,
  redisUrl,
  vapidPublicKey,
  vapidPrivateKey,
  vapidSubject,
};
