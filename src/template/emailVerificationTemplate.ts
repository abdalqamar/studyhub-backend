export const emailVerificationTemplate = (
  otp: string,
  name?: string,
  expiryMinutes: number = 5,
) => {
  const currentYear = new Date().getFullYear();
  const greetingName = name && name.trim().length > 0 ? name : "there";

  const otpDigitsHtml = otp
    .split("")
    .map(
      (digit) => `
        <td style="width:38px; height:48px; border:1.5px solid #22d3ee; background-color:#ecfeff;">
          <div style="font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:22px; font-weight:500; color:#0f172a; text-align:center; line-height:48px;">${digit}</div>
        </td>
        <td style="width:6px;">&nbsp;</td>
      `,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>OTP Verification - StudyHub</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;500&display=swap');
  body { margin:0; padding:0; background-color:#f1f5f9; -webkit-text-size-adjust:100%; }
  table { border-collapse:collapse; }
  img { border:0; display:block; }
  @media (max-width:600px){
    .container{ width:100% !important; }
    .px{ padding-left:20px !important; padding-right:20px !important; }
  }
</style>
</head>
<body>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px; background-color:#ffffff; border:1px solid #cbd5e1;">

          <tr>
            <td style="height:4px; background-color:#22d3ee; line-height:4px; font-size:4px;">&nbsp;</td>
          </tr>

          <tr>
            <td class="px" style="padding:28px 36px 0 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="https://studyhubedu.online" target="_blank" style="text-decoration:none;">
                      <img src="https://res.cloudinary.com/du7xquzsm/image/upload/v1767602264/svgviewer-png-output_zldy0l.png" alt="StudyHub" width="28" height="28" style="vertical-align:middle; margin-right:8px;" />
                      <span style="font-family:'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:18px; font-weight:700; color:#0f172a; letter-spacing:-0.3px; vertical-align:middle;">
                        Study<span style="color:#0891b2;">Hub</span>
                      </span>
                    </a>
                  </td>
                  <td align="right" style="font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:10px; color:#64748b; letter-spacing:1.5px; text-transform:uppercase;">
                    OTP&nbsp;Verification
                  </td>
                </tr>
              </table>
              <div style="border-bottom:1px dashed #cbd5e1; margin-top:16px;"></div>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:32px 36px 0 36px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:56px; height:56px; border:1.5px solid #22d3ee; border-radius:50%; text-align:center; vertical-align:middle;">
                    <span style="font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:22px; color:#0891b2; line-height:56px;">@</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" align="center" style="padding:16px 36px 4px 36px;">
              <p style="margin:0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#0891b2;">Verify Your Identity</p>
            </td>
          </tr>
          <tr>
            <td class="px" align="center" style="padding:6px 36px 10px 36px;">
              <h1 style="margin:0; font-family:'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:22px; color:#0f172a; font-weight:700; line-height:1.4;">
                Hi ${greetingName}, here's your code
              </h1>
            </td>
          </tr>
          <tr>
            <td class="px" align="center" style="padding:0 36px 28px 36px;">
              <p style="margin:0; font-family:'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; color:#64748b; line-height:1.6;">
                Enter this one-time password to complete your StudyHub registration.
              </p>
            </td>
          </tr>

          <tr>
            <td class="px" align="center" style="padding:0 36px 8px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  ${otpDigitsHtml}
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" align="center" style="padding:14px 36px 28px 36px;">
              <p style="margin:0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:11px; color:#dc2626; letter-spacing:0.5px;">
                Expires in ${expiryMinutes} minutes
              </p>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:0 36px 4px 36px;">
              <div style="border-top:1px dashed #cbd5e1;"></div>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:20px 36px 0 36px;">
              <p style="margin:0 0 8px 0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:#94a3b8;">Security Note</p>
              <p style="margin:0; font-family:'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:13px; color:#334155; line-height:1.6;">
                Didn't request this code? You can safely ignore this email — no account will be verified without it.
              </p>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:32px 36px 28px 36px;">
              <div style="border-top:1px dashed #cbd5e1; margin-bottom:20px;"></div>
              <p style="margin:0 0 8px 0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:11px; color:#94a3b8; text-align:center;">
                Need help? <a href="mailto:info@studyhubedu.online" style="color:#0891b2; text-decoration:none;">info@studyhubedu.online</a>
              </p>
              <p style="margin:16px 0 0 0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:10px; color:#cbd5e1; text-align:center; letter-spacing:0.5px;">
                &copy; ${currentYear} StudyHub &middot; studyhubedu.online
              </p>
            </td>
          </tr>

          <tr>
            <td style="height:4px; background-color:#22d3ee; line-height:4px; font-size:4px;">&nbsp;</td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
};
