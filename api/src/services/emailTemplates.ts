type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

const appName = "Nesteeq";

const baseLayout = ({
  title,
  body,
  footer,
}: {
  title: string;
  body: string;
  footer: string;
}) => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111111;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e8e8;">
            <tr>
              <td style="padding:28px 28px 18px;">
                <div style="font-size:22px;font-weight:700;color:#09493e;">${appName}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                ${body}
                <p style="margin:28px 0 0;font-size:12px;line-height:20px;color:#777777;">${footer}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const emailVerificationOtpTemplate = (otp: string): EmailTemplate => ({
  subject: "Verify your Nesteeq email",
  html: baseLayout({
    title: "Verify your Nesteeq email",
    body: `
      <h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#111111;">Verify your email</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#4a4a4a;">Use this one-time password to finish creating your Nesteeq account.</p>
      <div style="margin:0;padding:18px 20px;background:#09493e0d;border:1px solid #dbe8e5;border-radius:12px;text-align:center;font-size:32px;letter-spacing:8px;font-weight:700;color:#09493e;">${otp}</div>
      <p style="margin:18px 0 0;font-size:14px;line-height:22px;color:#4a4a4a;">This code expires in 5 minutes.</p>
    `,
    footer: "If you did not create a Nesteeq account, you can ignore this email.",
  }),
  text: `Use this OTP to verify your Nesteeq email: ${otp}. This code expires in 5 minutes.`,
});

export const passwordResetTemplate = (url: string): EmailTemplate => ({
  subject: "Reset your Nesteeq password",
  html: baseLayout({
    title: "Reset your Nesteeq password",
    body: `
      <h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#111111;">Reset your password</h1>
      <p style="margin:0 0 22px;font-size:15px;line-height:24px;color:#4a4a4a;">We received a request to reset your password. Use the button below to choose a new password.</p>
      <a href="${url}" style="display:inline-block;background:#09493e;color:#ffffff;text-decoration:none;border-radius:10px;padding:12px 18px;font-size:14px;font-weight:700;">Reset password</a>
      <p style="margin:22px 0 0;font-size:13px;line-height:21px;color:#777777;">If the button does not work, paste this link into your browser:<br />${url}</p>
    `,
    footer: "If you did not request a password reset, you can ignore this email.",
  }),
  text: `Reset your Nesteeq password using this link: ${url}`,
});
