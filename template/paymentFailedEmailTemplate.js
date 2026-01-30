const paymentFailureEmailTemplate = (name, amount, orderId, reason) => {
  const formattedAmount = Number(amount).toLocaleString("en-IN");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Failed – StudyHub</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background-color: #fef2f2;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #fef2f2;
      padding: 40px 20px;
    }

    .logo-section {
      text-align: left;
      margin-bottom: 40px;
    }

    .logo {
      max-width: 150px;
    }

    .content-box {
      background-color: #fee2e2;
      border-radius: 12px 12px 0 0;
      padding: 60px 40px;
      text-align: center;
    }

    .warning-icon {
      font-size: 80px;
      margin-bottom: 20px;
    }

    h1 {
      color: #dc2626;
      font-size: 32px;
      font-weight: bold;
      line-height: 1.3;
      margin: 0 0 20px 0;
    }

    .greeting {
      color: #991b1b;
      font-size: 22px;
      margin-bottom: 15px;
      font-weight: 700;
    }

    .subtitle {
      color: #991b1b;
      font-size: 17px;
      line-height: 1.6;
      margin-bottom: 30px;
    }

    .info-box {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: left;
      border-left: 4px solid #dc2626;
    }

    .info-row {
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      color: #6b7280;
      font-size: 14px;
    }

    .info-value {
      font-weight: 600;
      color: #1f2937;
      margin-top: 5px;
      word-break: break-all;
    }

    .amount {
      color: #dc2626;
      font-size: 24px;
    }

    .reason-box {
      background-color: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: left;
    }

    .reason-title {
      color: #92400e;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .reason-text {
      color: #78350f;
      font-size: 15px;
      line-height: 1.5;
    }

    .help-box {
      background-color: #eff6ff;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: left;
    }

    .help-title {
      color: #1e40af;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .help-list {
      color: #1e3a8a;
      font-size: 14px;
      line-height: 1.8;
      margin: 10px 0;
      padding-left: 20px;
    }

    .help-list li {
      margin: 8px 0;
    }

    .cta-box {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      border-radius: 0 0 12px 12px;
      padding: 40px 40px;
      text-align: center;
      color: white;
    }

    .cta-text {
      font-size: 20px;
      font-weight: 600;
      line-height: 1.4;
      margin-bottom: 25px;
    }

    .button {
      display: inline-block;
      background-color: white;
      color: #dc2626;
      padding: 15px 50px;
      text-decoration: none;
      border-radius: 30px;
      font-weight: bold;
      font-size: 16px;
      margin: 0 10px 10px 10px;
    }

    .button-secondary {
      background-color: transparent;
      color: white;
      border: 2px solid white;
    }

    .footer {
      text-align: center;
      margin-top: 30px;
      color: #991b1b;
      font-size: 13px;
      padding: 20px;
    }

    .footer a {
      color: #dc2626;
      text-decoration: none;
      font-weight: 600;
    }

    .support-box {
      background-color: #fff7ed;
      border-radius: 8px;
      padding: 15px;
      margin-top: 20px;
      font-size: 14px;
    }

    @media only screen and (max-width: 600px) {
      .content-box {
        padding: 40px 20px;
      }

      h1 {
        font-size: 26px;
      }

      .cta-box {
        padding: 30px 20px;
      }

      .button {
        display: block;
        margin: 10px 0;
      }
    }
  </style>
</head>

<body>
  <div class="container">
    <div class="logo-section">
      <img class="logo" src="https://res.cloudinary.com/du7xquzsm/image/upload/v1767602264/svgviewer-png-output_zldy0l.png" alt="StudyHub Logo" />
    </div>

    <div class="content-box">
      <div class="warning-icon">❌</div>
      
      <h1>Payment Could Not Be Processed</h1>
      
      <div class="greeting">Hello ${name},</div>
      
      <div class="subtitle">
        We encountered an issue while processing your payment. Don't worry - no charges were made to your account.
      </div>

      <div class="info-box">
        <div class="info-row">
          <div class="info-label">Attempted Amount</div>
          <div class="info-value amount">₹${formattedAmount}</div>
        </div>

        <div class="info-row">
          <div class="info-label">Order ID</div>
          <div class="info-value">${orderId}</div>
        </div>

        <div class="info-row">
          <div class="info-label">Status</div>
          <div class="info-value" style="color: #dc2626;">Failed</div>
        </div>
      </div>

      ${
        reason
          ? `
      <div class="reason-box">
        <div class="reason-title">⚠️ Reason for Failure</div>
        <div class="reason-text">${reason}</div>
      </div>
      `
          : ""
      }

      <div class="help-box">
        <div class="help-title">💡 Common Solutions</div>
        <ul class="help-list">
          <li>Ensure your card has sufficient balance</li>
          <li>Check if your card is enabled for online transactions</li>
          <li>Verify the card details entered are correct</li>
          <li>Try using a different payment method</li>
          <li>Contact your bank if the issue persists</li>
        </ul>
      </div>
    </div>

    <div class="cta-box">
      <div class="cta-text">
        Ready to try again? Your courses are waiting for you!
      </div>
      
      <a href="https://studyhubedu.online/student/courses" class="button">Retry Payment</a>
      <a href="https://studyhub-edtech-project.vercel.app/contact" class="button button-secondary">Contact Support</a>
    </div>

    <div class="footer">
      <div class="support-box">
        <strong>Need Immediate Help?</strong><br>
        Contact us at <a href="mailto:info@studyhubedu.online">info@studyhubedu.online</a><br>
        Or call us at <strong>+91 1234567890</strong>
      </div>
      <div style="margin-top: 15px; color: #78350f;">
        © 2025 StudyHub. We're here to help you succeed.
      </div>
    </div>
  </div>
</body>
</html>`;
};

export default paymentFailureEmailTemplate;
