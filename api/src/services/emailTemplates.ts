import { env } from "../config/env.js";

type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

const APP_NAME = "Nesteeq";

const COLORS = {
  brand: "#07584F",
  brandHover: "#064C44",
  brandDark: "#043B35",

  background: "#F7F8F5",
  surface: "#FAFBFA",
  white: "#FFFFFF",

  ink: "#111111",
  text: "#56625D",
  muted: "#7C8782",

  border: "#DDE3DF",
  softGreen: "#E7F0ED",
};

function layout(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>${APP_NAME}</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: ${COLORS.background};
          font-family: Arial, Helvetica, sans-serif;
          color: ${COLORS.text};
          -webkit-font-smoothing: antialiased;
        "
      >
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          role="presentation"
          style="
            width: 100%;
            background-color: ${COLORS.background};
            padding: 40px 16px;
          "
        >
          <tr>
            <td align="center">

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
                style="
                  width: 100%;
                  max-width: 540px;
                  background-color: ${COLORS.white};
                  border: 1px solid ${COLORS.border};
                  border-radius: 14px;
                "
              >
                <tr>
                  <td
                    style="
                      padding: 40px 32px;
                    "
                  >

                    <!-- Brand -->
                    <div
                      style="
                        text-align: center;
                        margin-bottom: 32px;
                      "
                    >
                      <div
                        style="
                          display: inline-block;
                          font-size: 25px;
                          line-height: 1;
                          font-weight: 800;
                          letter-spacing: -0.8px;
                          color: ${COLORS.brand};
                        "
                      >
                        Nesteeq
                      </div>
                    </div>

                    ${content}

                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
                style="
                  width: 100%;
                  max-width: 540px;
                "
              >
                <tr>
                  <td
                    align="center"
                    style="
                      padding: 22px 16px 0;
                      color: ${COLORS.muted};
                      font-size: 12px;
                      line-height: 1.6;
                    "
                  >
                    ${APP_NAME}
                    <br />
                    Apartment management, simplified.
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function buildOtpBoxes(otp: string): string {
  return otp
    .split("")
    .map(
      (digit) => `
        <span
          style="
            display: inline-block;
            width: 42px;
            height: 48px;
            line-height: 48px;
            text-align: center;
            background-color: ${COLORS.white};
            border: 1px solid ${COLORS.border};
            border-radius: 8px;
            font-size: 22px;
            font-weight: 700;
            color: ${COLORS.ink};
            margin: 0 3px;
          "
        >
          ${digit}
        </span>
      `,
    )
    .join("");
}

function buildLoginOtpHtml(otp: string): string {
  return layout(`
    <div style="text-align: center;">

      <h1
        style="
          margin: 0 0 12px;
          color: ${COLORS.ink};
          font-size: 25px;
          line-height: 1.3;
          font-weight: 700;
        "
      >
        Sign in to Nesteeq
      </h1>

      <p
        style="
          max-width: 420px;
          margin: 0 auto 28px;
          color: ${COLORS.text};
          font-size: 14px;
          line-height: 1.7;
        "
      >
        Use the verification code below to securely sign in
        to your Nesteeq account.
      </p>

      <div
        style="
          margin: 0 0 26px;
          padding: 26px 10px;
          background-color: ${COLORS.surface};
          border: 1px solid ${COLORS.border};
          border-radius: 12px;
        "
      >
        <div
          style="
            text-align: center;
            white-space: nowrap;
          "
        >
          ${buildOtpBoxes(otp)}
        </div>
      </div>

      <p
        style="
          margin: 0 0 8px;
          color: ${COLORS.text};
          font-size: 13px;
          line-height: 1.6;
        "
      >
        This code expires in
        <strong style="color: ${COLORS.brand};">
          5 minutes
        </strong>.
      </p>

      <p
        style="
          margin: 0;
          color: ${COLORS.muted};
          font-size: 12px;
          line-height: 1.6;
        "
      >
        Do not share this code with anyone.
      </p>

      <div
        style="
          height: 1px;
          margin: 28px 0;
          background-color: ${COLORS.border};
        "
      ></div>

      <p
        style="
          margin: 0;
          color: ${COLORS.muted};
          font-size: 12px;
          line-height: 1.6;
        "
      >
        If you did not attempt to sign in to Nesteeq,
        you can safely ignore this email.
      </p>

    </div>
  `);
}

function buildVerificationOtpHtml(otp: string): string {
  return layout(`
    <div style="text-align: center;">

      <h1
        style="
          margin: 0 0 12px;
          color: ${COLORS.ink};
          font-size: 25px;
          line-height: 1.3;
          font-weight: 700;
        "
      >
        Verify your email
      </h1>

      <p
        style="
          max-width: 420px;
          margin: 0 auto 28px;
          color: ${COLORS.text};
          font-size: 14px;
          line-height: 1.7;
        "
      >
        Use the verification code below to confirm your email
        address and continue setting up your Nesteeq account.
      </p>

      <div
        style="
          margin: 0 0 26px;
          padding: 26px 10px;
          background-color: ${COLORS.softGreen};
          border: 1px solid ${COLORS.border};
          border-radius: 12px;
        "
      >
        <div
          style="
            text-align: center;
            white-space: nowrap;
          "
        >
          ${buildOtpBoxes(otp)}
        </div>
      </div>

      <p
        style="
          margin: 0 0 8px;
          color: ${COLORS.text};
          font-size: 13px;
          line-height: 1.6;
        "
      >
        This code expires in
        <strong style="color: ${COLORS.brand};">
          5 minutes
        </strong>.
      </p>

      <p
        style="
          margin: 0;
          color: ${COLORS.muted};
          font-size: 12px;
          line-height: 1.6;
        "
      >
        Never share this verification code with anyone.
      </p>

      <div
        style="
          height: 1px;
          margin: 28px 0;
          background-color: ${COLORS.border};
        "
      ></div>

      <p
        style="
          margin: 0;
          color: ${COLORS.muted};
          font-size: 12px;
          line-height: 1.6;
        "
      >
        If you did not create a Nesteeq account,
        you can safely ignore this email.
      </p>

    </div>
  `);
}

function buildPasswordResetHtml(otp: string): string {
  return layout(`
    <div style="text-align: center;">

      <h1
        style="
          margin: 0 0 12px;
          color: ${COLORS.ink};
          font-size: 25px;
          line-height: 1.3;
          font-weight: 700;
        "
      >
        Reset your password
      </h1>

      <p
        style="
          max-width: 420px;
          margin: 0 auto 28px;
          color: ${COLORS.text};
          font-size: 14px;
          line-height: 1.7;
        "
      >
        We received a request to reset your Nesteeq password.
        Use the verification code below to continue.
      </p>

      <div
        style="
          margin: 0 0 26px;
          padding: 26px 10px;
          background-color: ${COLORS.surface};
          border: 1px solid ${COLORS.border};
          border-radius: 12px;
        "
      >
        <div
          style="
            text-align: center;
            white-space: nowrap;
          "
        >
          ${buildOtpBoxes(otp)}
        </div>
      </div>

      <p
        style="
          margin: 0 0 8px;
          color: ${COLORS.text};
          font-size: 13px;
          line-height: 1.6;
        "
      >
        This code expires in
        <strong style="color: ${COLORS.brand};">
          5 minutes
        </strong>.
      </p>

      <p
        style="
          margin: 0;
          color: ${COLORS.muted};
          font-size: 12px;
          line-height: 1.6;
        "
      >
        Never share this code with anyone.
      </p>

      <div
        style="
          height: 1px;
          margin: 28px 0;
          background-color: ${COLORS.border};
        "
      ></div>

      <p
        style="
          margin: 0;
          color: ${COLORS.muted};
          font-size: 12px;
          line-height: 1.6;
        "
      >
        If you did not request a password reset,
        you can safely ignore this email.
      </p>

    </div>
  `);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildResidentInviteHtml(input: {
  name: string;
  apartmentName: string;
  inviteLink: string;
}): string {
  const name = escapeHtml(input.name);
  const apartmentName = escapeHtml(input.apartmentName);
  const inviteLink = escapeHtml(input.inviteLink);

  return layout(`
    <div style="text-align: center;">

      <h1
        style="
          margin: 0 0 12px;
          color: ${COLORS.ink};
          font-size: 25px;
          line-height: 1.3;
          font-weight: 700;
        "
      >
        You have been invited to ${apartmentName}
      </h1>

      <p
        style="
          max-width: 420px;
          margin: 0 auto 28px;
          color: ${COLORS.text};
          font-size: 14px;
          line-height: 1.7;
        "
      >
        Hi ${name}, you have been invited to join
        ${apartmentName} on Nesteeq. Accept the invitation
        to open your apartment page and complete your setup.
      </p>

      <a
        href="${inviteLink}"
        style="
          display: inline-block;
          padding: 13px 22px;
          background-color: ${COLORS.brand};
          color: ${COLORS.white};
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
        "
      >
        Accept invitation
      </a>

      <p
        style="
          margin: 26px 0 0;
          color: ${COLORS.text};
          font-size: 13px;
          line-height: 1.6;
        "
      >
        This invitation expires in
        <strong style="color: ${COLORS.brand};">
          7 days
        </strong>.
      </p>

      <div
        style="
          height: 1px;
          margin: 28px 0;
          background-color: ${COLORS.border};
        "
      ></div>

      <p
        style="
          margin: 0;
          color: ${COLORS.muted};
          font-size: 12px;
          line-height: 1.6;
        "
      >
        If the button does not work, copy and paste this link into your browser:
        <br />
        <span style="word-break: break-all;">${inviteLink}</span>
      </p>

    </div>
  `);
}

/**
 * Public templates used by EmailService.
 */

export function loginOtpTemplate(otp: string): EmailTemplate {
  return {
    subject: `${otp} is your Nesteeq sign-in code`,

    html: buildLoginOtpHtml(otp),

    text: `
Sign in to Nesteeq

Use the verification code below to securely sign in to your Nesteeq account.

Verification code: ${otp}

This code expires in 5 minutes.

Never share this code with anyone.

If you did not attempt to sign in to Nesteeq, you can safely ignore this email.
    `.trim(),
  };
}

export function emailVerificationOtpTemplate(
  otp: string,
): EmailTemplate {
  return {
    subject: `${otp} is your Nesteeq verification code`,

    html: buildVerificationOtpHtml(otp),

    text: `
Verify your email

Use the verification code below to confirm your email address and continue setting up your Nesteeq account.

Verification code: ${otp}

This code expires in 5 minutes.

Never share this verification code with anyone.

If you did not create a Nesteeq account, you can safely ignore this email.
    `.trim(),
  };
}

export function passwordResetTemplate(
  otp: string,
): EmailTemplate {
  return {
    subject: `${otp} is your Nesteeq password reset code`,

    html: buildPasswordResetHtml(otp),

    text: `
Reset your password

We received a request to reset your Nesteeq password.

Verification code: ${otp}

This code expires in 5 minutes.

Never share this code with anyone.

If you did not request a password reset, you can safely ignore this email.
    `.trim(),
  };
}

export function residentInviteTemplate(input: {
  name: string;
  apartmentName: string;
  inviteLink: string;
}): EmailTemplate {
  return {
    subject: `You are invited to ${input.apartmentName} on Nesteeq`,

    html: buildResidentInviteHtml(input),

    text: `
Hi ${input.name},

You have been invited to join ${input.apartmentName} on Nesteeq.

Accept the invitation to open your apartment page and complete your setup:
${input.inviteLink}

This invitation expires in 7 days.

If you were not expecting this invitation, you can safely ignore this email.
    `.trim(),
  };
}

export function apartmentDeactivatedTemplate(input: {
  managerName: string;
  apartmentName: string;
  reason?: string;
  supportEmail?: string;
}): EmailTemplate {
  const reasonText = input.reason?.trim() || "Administrative review or subscription status.";
  const supportEmail = input.supportEmail || env.brevoSenderEmail || "support@nesteeq.com";

  return {
    subject: `Important: ${input.apartmentName} has been temporarily deactivated on Nesteeq`,
    html: layout(`
      <div style="text-align: left;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="
            display: inline-block;
            background-color: #FEF2F2;
            border: 1px solid #FECACA;
            color: #991B1B;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            padding: 5px 14px;
            border-radius: 9999px;
          ">
            Apartment Deactivated
          </span>
        </div>

        <h1 style="
          margin: 0 0 16px;
          color: ${COLORS.ink};
          font-size: 20px;
          font-weight: 700;
          line-height: 1.4;
          text-align: center;
        ">
          Community Access Temporarily Suspended
        </h1>

        <p style="
          margin: 0 0 18px;
          color: ${COLORS.text};
          font-size: 14px;
          line-height: 1.6;
        ">
          Hi ${input.managerName},
        </p>

        <p style="
          margin: 0 0 22px;
          color: ${COLORS.text};
          font-size: 14px;
          line-height: 1.6;
        ">
          We are writing to notify you that your apartment community, <strong>${input.apartmentName}</strong>, has been temporarily deactivated by the Nesteeq platform administration.
        </p>

        <!-- Information Card -->
        <div style="
          background-color: #FFF5F5;
          border: 1px solid #FED7D7;
          border-radius: 10px;
          padding: 18px 20px;
          margin-bottom: 22px;
        ">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.6;">
            <tr>
              <td style="color: #742A2A; font-weight: 700; width: 110px; vertical-align: top; padding-bottom: 8px;">Apartment:</td>
              <td style="color: #2D3748; font-weight: 600; padding-bottom: 8px;">${input.apartmentName}</td>
            </tr>
            <tr>
              <td style="color: #742A2A; font-weight: 700; width: 110px; vertical-align: top; padding-bottom: 8px;">Status:</td>
              <td style="color: #C53030; font-weight: 700; padding-bottom: 8px;">Inactive</td>
            </tr>
            <tr>
              <td style="color: #742A2A; font-weight: 700; width: 110px; vertical-align: top; padding-bottom: 8px;">Reason:</td>
              <td style="color: #4A5568; font-style: italic; padding-bottom: 8px;">${reasonText}</td>
            </tr>
            <tr>
              <td style="color: #742A2A; font-weight: 700; width: 110px; vertical-align: top;">Impact:</td>
              <td style="color: #4A5568;">Resident, staff, and management access is temporarily restricted.</td>
            </tr>
          </table>
        </div>

        <!-- Data Guarantee Note -->
        <div style="
          background-color: ${COLORS.surface};
          border: 1px solid ${COLORS.border};
          border-radius: 8px;
          padding: 14px 16px;
          margin-bottom: 26px;
        ">
          <p style="
            margin: 0;
            color: ${COLORS.muted};
            font-size: 12px;
            line-height: 1.5;
          ">
            <strong style="color: ${COLORS.text};">Data Safety Assurance:</strong> None of your community data has been deleted. All resident profiles, flat units, billing histories, and service records remain safely preserved and will be instantly available upon reactivation.
          </p>
        </div>

        <div style="text-align: center; margin-bottom: 26px;">
          <a
            href="mailto:${supportEmail}?subject=Reactivation%20Inquiry%20-%20${encodeURIComponent(input.apartmentName)}"
            style="
              display: inline-block;
              padding: 12px 28px;
              background-color: ${COLORS.ink};
              color: ${COLORS.white};
              border-radius: 8px;
              font-size: 14px;
              font-weight: 700;
              text-decoration: none;
            "
          >
            Contact Support Team
          </a>
        </div>

        <p style="
          margin: 0;
          color: ${COLORS.muted};
          font-size: 12px;
          line-height: 1.5;
          text-align: center;
        ">
          Have questions? Reply directly to this email or reach us at <a href="mailto:${supportEmail}" style="color: ${COLORS.brand}; text-decoration: underline;">${supportEmail}</a>.
        </p>
      </div>
    `),
    text: `
Important Notice: ${input.apartmentName} has been temporarily deactivated on Nesteeq

Hi ${input.managerName},

We are writing to notify you that your apartment community, "${input.apartmentName}", has been temporarily deactivated by the Nesteeq platform administration.

Details:
- Apartment: ${input.apartmentName}
- Status: Inactive
- Reason: ${reasonText}
- Impact: Resident, staff, and management access is temporarily restricted.

Data Safety Guarantee:
All your community data, member profiles, billing records, and flat setups remain safely intact and will be immediately restored upon reactivation.

To discuss reactivation or if you have any questions, please contact our support team at ${supportEmail}.
    `.trim(),
  };
}

export function apartmentReactivatedTemplate(input: {
  managerName: string;
  apartmentName: string;
  loginUrl?: string;
}): EmailTemplate {
  const loginUrl = input.loginUrl || `${env.webUrl}/login`;

  return {
    subject: `Access Restored: ${input.apartmentName} is now active on Nesteeq`,
    html: layout(`
      <div style="text-align: left;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="
            display: inline-block;
            background-color: #ECFDF5;
            border: 1px solid #A7F3D0;
            color: #065F46;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            padding: 5px 14px;
            border-radius: 9999px;
          ">
            Apartment Active
          </span>
        </div>

        <h1 style="
          margin: 0 0 16px;
          color: ${COLORS.ink};
          font-size: 20px;
          font-weight: 700;
          line-height: 1.4;
          text-align: center;
        ">
          Community Access Restored
        </h1>

        <p style="
          margin: 0 0 18px;
          color: ${COLORS.text};
          font-size: 14px;
          line-height: 1.6;
        ">
          Hi ${input.managerName},
        </p>

        <p style="
          margin: 0 0 22px;
          color: ${COLORS.text};
          font-size: 14px;
          line-height: 1.6;
        ">
          Great news! Your apartment community, <strong>${input.apartmentName}</strong>, has been reactivated on Nesteeq. Full platform access has been restored for you, your staff, and all residents.
        </p>

        <!-- Information Card -->
        <div style="
          background-color: #F0FDF4;
          border: 1px solid #BBF7D0;
          border-radius: 10px;
          padding: 18px 20px;
          margin-bottom: 26px;
        ">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.6;">
            <tr>
              <td style="color: #166534; font-weight: 700; width: 110px; vertical-align: top; padding-bottom: 8px;">Apartment:</td>
              <td style="color: #1F2937; font-weight: 600; padding-bottom: 8px;">${input.apartmentName}</td>
            </tr>
            <tr>
              <td style="color: #166534; font-weight: 700; width: 110px; vertical-align: top; padding-bottom: 8px;">Status:</td>
              <td style="color: #15803D; font-weight: 700; padding-bottom: 8px;">Active</td>
            </tr>
            <tr>
              <td style="color: #166534; font-weight: 700; width: 110px; vertical-align: top;">Access:</td>
              <td style="color: #374151;">All dashboards, resident portals, and staff features are fully operational.</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-bottom: 26px;">
          <a
            href="${loginUrl}"
            style="
              display: inline-block;
              padding: 13px 30px;
              background-color: ${COLORS.brand};
              color: ${COLORS.white};
              border-radius: 8px;
              font-size: 14px;
              font-weight: 700;
              text-decoration: none;
            "
          >
            Sign In to Dashboard
          </a>
        </div>

        <p style="
          margin: 0;
          color: ${COLORS.muted};
          font-size: 12px;
          line-height: 1.5;
          text-align: center;
        ">
          If you need any assistance, feel free to reach out to our support team at any time.
        </p>
      </div>
    `),
    text: `
Access Restored: ${input.apartmentName} is now active on Nesteeq

Hi ${input.managerName},

Great news! Your apartment community, "${input.apartmentName}", has been reactivated on Nesteeq. Full platform access has been restored for you, your staff, and all residents.

Details:
- Apartment: ${input.apartmentName}
- Status: Active
- Access: All dashboards, resident portals, and management features are fully operational.

You can sign in to your dashboard here:
${loginUrl}

Thank you for choosing Nesteeq!
    `.trim(),
  };
}
