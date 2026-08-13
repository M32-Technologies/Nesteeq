import { BrevoClient } from "@getbrevo/brevo";
import { env } from "../config/env.js";
import {
  emailVerificationOtpTemplate,
  passwordResetTemplate,
} from "./emailTemplates.js";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let brevoClient: BrevoClient | null = null;

const getBrevoClient = () => {
  if (!env.brevoApiKey) {
    throw new Error("BREVO_API_KEY is required to send emails.");
  }

  brevoClient ??= new BrevoClient({
    apiKey: env.brevoApiKey,
    timeoutInSeconds: 20,
    maxRetries: 2,
  });

  return brevoClient;
};

const sendEmail = async ({ to, subject, html, text }: SendEmailInput) => {
  if (!env.brevoSenderEmail) {
    throw new Error("BREVO_SENDER_EMAIL is required to send emails.");
  }

  await getBrevoClient().transactionalEmails.sendTransacEmail({
    sender: {
      email: env.brevoSenderEmail,
      name: env.brevoSenderName,
    },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
  });
};

export const emailService = {
  sendVerificationOtp: async (email: string, otp: string) => {
    await sendEmail({
      to: email,
      ...emailVerificationOtpTemplate(otp),
    });
  },

  sendPasswordReset: async (email: string, resetUrl: string) => {
    await sendEmail({
      to: email,
      ...passwordResetTemplate(resetUrl),
    });
  },
};
