import dotenv from "dotenv";
dotenv.config();

const mongoUrl = (process.env.MONGO_URL || "").trim();
const razorpayKeyId = (process.env.RAZORPAY_KEY_ID || "").trim();
const razorpayKeySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number((process.env.PORT ?? "6000").trim()),
  mongoUrl,
  frontendOrigin: (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000").trim(),
  razorpayKeyId,
  razorpayKeySecret,
};
