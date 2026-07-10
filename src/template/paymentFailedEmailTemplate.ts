export const paymentFailedEmailTemplate = (
  name: string,
  amount: number,
  orderId: string,
  courses: string[],
  reason?: string,
) => {
  const formattedAmount = Number(amount).toLocaleString("en-IN");
  const currentYear = new Date().getFullYear();
  const failureReason =
    reason && reason.trim().length > 0 ? reason : "Payment was not completed";

  const coursesListHtml =
    courses.length > 0
      ? courses
          .map(
            (course) => `
              <tr>
                <td style="padding:6px 0; vertical-align:top; width:20px; color:#dc2626; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:13px;">&#8212;</td>
                <td style="padding:6px 0; font-family:'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:13px; color:#334155;">${course}</td>
              </tr>
            `,
          )
          .join("")
      : `
        <tr>
          <td colspan="2" style="padding:6px 0; font-family:'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:13px; color:#94a3b8; font-style:italic;">
            Cart details unavailable.
          </td>
        </tr>
      `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Payment Failed - StudyHub</title>
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
                    Doc&nbsp;No. ORD-${orderId}
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
                  <td style="width:56px; height:56px; border:1.5px solid #dc2626; border-radius:50%; text-align:center; vertical-align:middle;">
                    <span style="font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:24px; color:#dc2626; line-height:56px;">&#33;</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" align="center" style="padding:16px 36px 4px 36px;">
              <p style="margin:0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#dc2626;">Payment Failed</p>
            </td>
          </tr>
          <tr>
            <td class="px" align="center" style="padding:6px 36px 10px 36px;">
              <h1 style="margin:0; font-family:'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:22px; color:#0f172a; font-weight:700; line-height:1.4;">
                We couldn't process your payment, ${name}.
              </h1>
            </td>
          </tr>
          <tr>
            <td class="px" align="center" style="padding:0 36px 28px 36px;">
              <p style="margin:0; font-family:'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; color:#64748b; line-height:1.6;">
                No worries — you haven't been charged. Your cart is still saved, you can retry anytime.
              </p>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:0 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #cbd5e1;">
                <tr>
                  <td style="width:50%; padding:12px 18px; border-right:1px dashed #e2e8f0; border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px 0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:9px; letter-spacing:1.5px; text-transform:uppercase; color:#94a3b8;">Order ID</p>
                    <p style="margin:0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:13px; color:#334155; word-break:break-all;">${orderId}</p>
                  </td>
                  <td style="width:50%; padding:12px 18px; border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px 0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:9px; letter-spacing:1.5px; text-transform:uppercase; color:#94a3b8;">Amount Attempted</p>
                    <p style="margin:0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:13px; color:#334155;">&#8377;${formattedAmount}</p>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:12px 18px;">
                    <p style="margin:0 0 4px 0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:9px; letter-spacing:1.5px; text-transform:uppercase; color:#94a3b8;">Reason</p>
                    <p style="margin:0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:13px; color:#dc2626; font-weight:500;">${failureReason}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:28px 36px 0 36px;">
              <p style="margin:0 0 14px 0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:#94a3b8;">Items In Cart</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${coursesListHtml}
              </table>
            </td>
          </tr>

          <tr>
            <td class="px" align="center" style="padding:32px 36px 8px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#0891b2;" align="center">
                    <a href="https://studyhubedu.online/checkout?order=${orderId}" target="_blank" style="display:inline-block; padding:13px 32px; font-family:'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none; letter-spacing:0.3px;">
                      Retry Payment &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:32px 36px 4px 36px;">
              <div style="border-top:1px dashed #cbd5e1;"></div>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:20px 36px 0 36px;">
              <p style="margin:0 0 8px 0; font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:#94a3b8;">If This Keeps Happening</p>
              <p style="margin:0; font-family:'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:13px; color:#334155; line-height:1.6;">
                Check your bank balance, card limit, or try a different payment method. Still stuck? Reach out and we'll sort it out.
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
