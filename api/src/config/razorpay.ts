// config/razorpay.ts
import Razorpay from "razorpay";
import { env } from "./env.js";

export const razorpay = new Razorpay({
  key_id: env.razorPayKeyId ,
  key_secret: env.razorPaySecret
});