import Razorpay from "razorpay";

import { env } from "./env.js";

const missingKeys = [
  !env.razorpayKeyId && "RAZORPAY_KEY_ID",
  !env.razorpayKeySecret && "RAZORPAY_KEY_SECRET",
].filter(Boolean);

if (missingKeys.length > 0) {
  throw new Error(
    `${missingKeys.join(", ")} must be configured before using Razorpay payments`
  );
}

export const razorpay = new Razorpay({
  key_id: env.razorpayKeyId,
  key_secret: env.razorpayKeySecret,
});

export const razorpayPublicKey = env.razorpayKeyId;
export const razorpayKeySecret = env.razorpayKeySecret;
