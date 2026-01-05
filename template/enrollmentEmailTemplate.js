const enrollmentEmailTemplate = (name, amount, orderId, paymentId, courses) => {
  // format amount safely
  const formattedAmount = Number(amount).toLocaleString("en-IN");

  const coursesList = courses
    .map(
      (course) => `
        <li style="margin: 12px 0; padding-left: 5px; text-align: left; color: #333333;">
          ${course}
        </li>
      `
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Course Purchase & Enrollment Confirmation – StudyHub</title>

  <style>
    body {
      background-color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #333333;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }

    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      padding: 40px 20px;
      text-align: center;
    }

    .logo {
      max-width: 180px;
      margin-bottom: 20px;
    }

    .header-title {
      color: #ffffff;
      font-size: 28px;
      font-weight: bold;
      margin: 0;
    }

    .content {
      padding: 40px 30px;
    }

    .success-badge {
      background-color: #10b981;
      color: #ffffff;
      display: inline-block;
      padding: 10px 24px;
      border-radius: 25px;
      font-weight: 600;
      margin-bottom: 24px;
    }

    .greeting {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #1f2937;
    }

    .message {
      color: #4b5563;
      margin-bottom: 32px;
      line-height: 1.7;
    }

    .info-box {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }

    .info-row {
      padding: 12px 0;
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
      word-break: break-all;
    }

    .amount {
      color: #10b981;
      font-size: 24px;
    }

    .courses-section {
      margin: 32px 0;
    }

    .courses-list {
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 20px 20px 20px 40px;
      border-radius: 8px;
    }

    .enrollment-banner {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      text-align: center;
      padding: 32px 24px;
      border-radius: 12px;
      margin: 32px 0;
    }

    .cta {
      display: inline-block;
      padding: 16px 48px;
      background-color: #ffffff;
      color: #2563eb;
      text-decoration: none;
      border-radius: 30px;
      font-weight: 700;
      margin-top: 24px;
    }

    .footer {
      background-color: #f9fafb;
      padding: 32px 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }

    .support {
      font-size: 14px;
      color: #6b7280;
    }

    .support a {
      color: #3b82f6;
      font-weight: 600;
      text-decoration: none;
    }

    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
    }
  </style>
</head>

<body>
  <div class="container">
    <div class="header">
      <img class="logo" src="https://res.cloudinary.com/du7xquzsm/image/upload/v1767602264/svgviewer-png-output_zldy0l.png" alt="StudyHub Logo" />
      <p class="header-title">Payment Successful!</p>
    </div>

    <div class="content">
      <div class="success-badge">✓ Purchase Confirmed</div>

      <div class="greeting">Dear ${name},</div>

      <div class="message">
        Thank you for your purchase! Your payment has been successfully processed and your enrollment is now complete.
      </div>

      <div class="info-box">
        <div class="info-row">
          <div class="info-label">Amount Paid</div>
          <div class="info-value amount">₹${formattedAmount}</div>
        </div>

        <div class="info-row">
          <div class="info-label">Order ID</div>
          <div class="info-value">${orderId}</div>
        </div>

        <div class="info-row">
          <div class="info-label">Payment ID</div>
          <div class="info-value">${paymentId}</div>
        </div>
      </div>

      <div class="courses-section">
        <h3>📚 Your Enrolled Courses</h3>
        <ul class="courses-list">
          ${coursesList}
        </ul>
      </div>

      <div class="enrollment-banner">
        <h2>🎉 You Are Now Enrolled!</h2>
        <p>You can start learning immediately. Access your courses anytime, anywhere.</p>
      </div>

      <div style="text-align:center;">
        <a href="https://studyhub-edtech-project.vercel.app/dashboard" class="cta">
          Start Learning Now →
        </a>
      </div>
    </div>

    <div class="footer">
      <div class="support">
        Need help? Contact us at
        <a href="mailto:info@studyhubedu.online">info@studyhubedu.online</a>
      </div>
    </div>
  </div>
</body>
</html>`;
};

export default enrollmentEmailTemplate;
