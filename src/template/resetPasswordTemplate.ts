export const resetPasswordTemplate = (
  email: string,
  name: string,
  frontendUrl: string,
  expiryMinutes: number = 5,
) => {
  const currentYear = new Date().getFullYear();

  const requestTime = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const validUntil = new Date(
    Date.now() + expiryMinutes * 60 * 1000,
  ).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Reset Your Password - StudyHub</title>
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
                  <td style="font-family:'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:18px; font-weight:700; color:#0f172a; letter-spacing:-0.3px;">
                    <img src="https://res.cloudinary.com/du7xquzsm/image/upload/v1767602264/svgviewer-png-output_zldy0l.png" alt="StudyHub" width="28" height="28" style="vertical-align:middle; margin-right:8px;" />
                    Study<span style="color:#0891b2;">Hub</span>
                  </td>
                  <td align="right" style="font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:10px; color:#64748b; letter-spacing:1.5px; text-transform:uppercase;">
                    Password&nbsp;Reset
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
                    <span style="font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:22px; color:#0891b2; line-height:56px;">&#128274;</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" align="center" style="padding:16px 36px 4px 36px;">
              <p style="margin:0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#0891b2;">Action Required</p>
            </td>
          </tr>
          <tr>
            <td class="px" align="center" style="padding:6px 36px 10px 36px;">
              <h1 style="margin:0; font-family:'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:22px; color:#0f172a; font-weight:700; line-height:1.4;">
                Reset your password
              </h1>
            </td>
          </tr>
          <tr>
            <td class="px" align="center" style="padding:0 36px 28px 36px;">
              <p style="margin:0; font-family:'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; color:#64748b; line-height:1.6;">
                Hi ${name}, we received a request to reset the password for <strong style="color:#0f172a;">${email}</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td class="px" align="center" style="padding:0 36px 8px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#0891b2;" align="center">
                    <a href="${frontendUrl}" target="_blank" style="display:inline-block; padding:13px 32px; font-family:'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none; letter-spacing:0.3px;">
                      Reset My Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" align="center" style="padding:18px 36px 0 36px;">
              <p style="margin:0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:10px; color:#94a3b8; line-height:1.6;">
                Button not working? Paste this link in your browser:
              </p>
              <p style="margin:6px 0 0 0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:11px; color:#0891b2; word-break:break-all;">
                ${frontendUrl}
              </p>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:28px 36px 0 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #cbd5e1;">
                <tr>
                  <td style="width:50%; padding:12px 18px; border-right:1px dashed #e2e8f0;">
                    <p style="margin:0 0 4px 0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:9px; letter-spacing:1.5px; text-transform:uppercase; color:#94a3b8;">Requested On</p>
                    <p style="margin:0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:12px; color:#334155;">${requestTime}</p>
                  </td>
                  <td style="width:50%; padding:12px 18px;">
                    <p style="margin:0 0 4px 0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:9px; letter-spacing:1.5px; text-transform:uppercase; color:#94a3b8;">Link Expires</p>
                    <p style="margin:0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:12px; color:#dc2626; font-weight:500;">${validUntil}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:28px 36px 0 36px;">
              <div style="border:1px solid #fde68a; background-color:#fffbeb; padding:16px 18px;">
                <p style="margin:0 0 8px 0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:#b45309;">Didn't request this?</p>
                <p style="margin:0; font-family:'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:13px; color:#78350f; line-height:1.6;">
                  Ignore this email — your password stays unchanged. If you're concerned about your account, reach out to <a href="mailto:security@studyhubedu.online" style="color:#b45309; text-decoration:underline;">security@studyhubedu.online</a>.
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:28px 36px 0 36px;">
              <p style="margin:0 0 12px 0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:#94a3b8;">Password Tips</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:5px 0; vertical-align:top; width:20px; color:#0891b2; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:13px;">&#8212;</td>
                  <td style="padding:5px 0; font-family:'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:13px; color:#334155;">At least 8 characters, mixing case, numbers &amp; symbols</td>
                </tr>
                <tr>
                  <td style="padding:5px 0; vertical-align:top; width:20px; color:#0891b2; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:13px;">&#8212;</td>
                  <td style="padding:5px 0; font-family:'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:13px; color:#334155;">Don't reuse passwords from other accounts</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:32px 36px 28px 36px;">
              <div style="border-top:1px dashed #cbd5e1; margin-bottom:20px;"></div>
              <p style="margin:0 0 8px 0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:11px; color:#94a3b8; text-align:center;">
                Need help? <a href="mailto:support@studyhubedu.online" style="color:#0891b2; text-decoration:none;">support@studyhubedu.online</a>
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
