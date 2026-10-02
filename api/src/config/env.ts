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


const awsRegion = (process.env.AWS_REGION || "").trim();
const awsAccessKeyId = (process.env.AWS_ACCESS_KEY_ID || "").trim();
const awsSecretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || "").trim();
const awsS3BucketName = (process.env.AWS_S3_BUCKET_NAME || "").trim();

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
  razorPaySecret,
  redisUrl,
  awsRegion,
  awsAccessKeyId,
  awsSecretAccessKey,
  awsS3BucketName,
};
