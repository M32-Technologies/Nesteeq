import { BrevoClient } from "@getbrevo/brevo";
import { env } from "../config/env.js";

import {
  emailVerificationOtpTemplate,
  loginOtpTemplate,
  passwordResetTemplate,
  residentInviteTemplate,
} from "./emailTemplates.js";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let brevoClient: BrevoClient | null = null;

const getBrevoClient = (): BrevoClient => {
  if (!env.brevoApiKey) {
    throw new Error(
      "BREVO_API_KEY is required to send emails.",
    );
  }

  brevoClient ??= new BrevoClient({
    apiKey: env.brevoApiKey,
    timeoutInSeconds: 20,
    maxRetries: 2,
  });

  return brevoClient;
};

const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: SendEmailInput): Promise<void> => {
  if (!env.brevoSenderEmail) {
    throw new Error(
      "BREVO_SENDER_EMAIL is required to send emails.",
    );
  }

  try {
    await getBrevoClient()
      .transactionalEmails
      .sendTransacEmail({
        sender: {
          email: env.brevoSenderEmail,
          name: env.brevoSenderName ?? "Nesteeq",
        },

        to: [
          {
            email: to,
          },
        ],

        subject,

        htmlContent: html,

        textContent: text,
      });
  } catch (error) {
    console.error("Brevo email error:", {
      to,
      subject,
      error,
    });

    throw new Error("Failed to send email.");
  }
};

export const emailService = {
  sendLoginOtp: async (
    email: string,
    otp: string,
  ): Promise<void> => {
    await sendEmail({
      to: email,
      ...loginOtpTemplate(otp),
    });
  },
  sendVerificationOtp: async (
    email: string,
    otp: string,
  ): Promise<void> => {
    await sendEmail({
      to: email,
      ...emailVerificationOtpTemplate(otp),
    });
  },
  sendResidentInvite: async (
    email: string,
    input: {
      name: string;
      apartmentName: string;
      inviteLink: string;
    },
  ): Promise<void> => {
    await sendEmail({
      to: email,
      ...residentInviteTemplate(input),
    });
  },
}
