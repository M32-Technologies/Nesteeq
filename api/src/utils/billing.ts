import crypto from "crypto";

export type DurationUnit = "days" | "months" | "years";

export type TaxBreakdown = {
  subtotalAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  totalAmount: number;
};

type RazorpaySignatureInput = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  razorpayKeySecret: string;
};

const roundAmount = (amount: number) => Number(amount.toFixed(2));

export const toPaise = (amount: number) => Math.round(amount * 100);

export const calculateInclusiveGST = (
  totalAmount: number,
  gstRate = 18
): TaxBreakdown => {
  const subtotalAmount = roundAmount(totalAmount / (1 + gstRate / 100));
  const taxAmount = roundAmount(totalAmount - subtotalAmount);
  const cgstAmount = roundAmount(taxAmount / 2);
  const sgstAmount = roundAmount(taxAmount - cgstAmount);

  return {
    subtotalAmount,
    cgstAmount,
    sgstAmount,
    igstAmount: 0,
    taxAmount,
    totalAmount: roundAmount(totalAmount),
  };
};

export const calculateEndDate = (
  startDate: Date,
  durationValue: number,
  durationUnit: DurationUnit
) => {
  const endDate = new Date(startDate);

  if (durationUnit === "days") {
    endDate.setDate(endDate.getDate() + durationValue);
  }

  if (durationUnit === "months") {
    endDate.setMonth(endDate.getMonth() + durationValue);
  }

  if (durationUnit === "years") {
    endDate.setFullYear(endDate.getFullYear() + durationValue);
  }

  return endDate;
};

export const isRazorpaySignatureValid = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  razorpayKeySecret,
}: RazorpaySignatureInput) => {
  const expectedSignature = crypto
    .createHmac("sha256", razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(razorpaySignature, "utf8");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
};
