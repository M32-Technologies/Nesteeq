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
