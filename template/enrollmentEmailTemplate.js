const enrollmentEmailTemplate = (name, amount, orderId, paymentId, courses) => {
  const formattedAmount = Number(amount).toLocaleString("en-IN");

  const coursesList = courses
    .map(
      (course) => `
        <li style="margin: 12px 0; padding-left: 5px; text-align: left; color: #1e40af;">
          ${course}
        </li>
      `,
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
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background-color: #e8f4f8;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #e8f4f8;
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
      background-color: #d4e8f0;
      border-radius: 12px 12px 0 0;
      padding: 60px 40px;
      text-align: center;
    }

    .celebration-icon {
      font-size: 80px;
      margin-bottom: 20px;
    }

    h1 {
      color: #1e40af;
      font-size: 36px;
      font-weight: bold;
      line-height: 1.3;
      margin: 0 0 30px 0;
    }

    .greeting {
      color: #1e40af;
      font-size: 22px;
      margin-bottom: 15px;
      font-weight: 700;
    }

    .subtitle {
      color: #1e40af;
      font-size: 18px;
      line-height: 1.6;
      margin-bottom: 30px;
    }

    .info-box {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: left;
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
      color: #10b981;
      font-size: 24px;
    }

    .courses-section {
      margin: 20px 0;
      text-align: left;
    }

    .courses-title {
      color: #1e40af;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .courses-list {
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 15px 15px 15px 35px;
      border-radius: 8px;
      margin: 0;
    }

    .cta-box {
      background-color: #2563eb;
      border-radius: 0 0 12px 12px;
      padding: 50px 40px;
      text-align: center;
      color: white;
    }

    .cta-text {
      font-size: 22px;
      font-weight: 600;
      line-height: 1.4;
      margin-bottom: 30px;
    }

    .button {
      display: inline-block;
      background-color: white;
      color: #2563eb;
      padding: 15px 50px;
      text-decoration: none;
      border-radius: 30px;
      font-weight: bold;
      font-size: 16px;
    }

    .social-icons {
      text-align: center;
      margin-top: 40px;
      margin-bottom: 20px;
    }

    .social-icon {
      display: inline-block;
      width: 40px;
      height: 40px;
      margin: 0 8px;
      background-color: #3b82f6;
      border-radius: 50%;
      text-align: center;
      line-height: 40px;
      color: white;
      text-decoration: none;
      font-size: 18px;
    }

    .footer {
      text-align: center;
      margin-top: 20px;
      color: #1e40af;
      font-size: 13px;
    }

    .footer a {
      color: #2563eb;
      text-decoration: none;
    }

    .copyright {
      margin-top: 10px;
      font-size: 12px;
    }

    @media only screen and (max-width: 600px) {
      .content-box {
        padding: 40px 20px;
      }

      h1 {
        font-size: 28px;
      }

      .cta-box {
        padding: 40px 20px;
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
      <div class="celebration-icon">🎉</div>
      
      <h1>Congratulations on the start of your thrilling learning adventure!</h1>
      
      <div class="greeting">Hello ${name}!</div>
      
      <div class="subtitle">
        You have successfully enrolled! We couldn't be more excited to have you join us!
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
        <div class="courses-title">📚 Your Enrolled Courses</div>
        <ul class="courses-list">
          ${coursesList}
        </ul>
      </div>
    </div>

    <div class="cta-box">
      <div class="cta-text">
        Your journey begins today! The first lesson is already waiting for you on our platform.
      </div>
      
      <a href="https://studyhubedu.online/" class="button">Start Learning Now</a>
    </div>

    <div class="social-icons">
      <a href="#" class="social-icon">f</a>
      <a href="#" class="social-icon">𝕏</a>
      <a href="#" class="social-icon">in</a>
      <a href="#" class="social-icon">▶</a>
    </div>

    <div class="footer">
      Need help? Contact us at <a href="mailto:info@studyhubedu.online">info@studyhubedu.online</a>
      <div class="copyright">© Copyright, 2025 StudyHub</div>
    </div>
  </div>
</body>
</html>`;
};

export default enrollmentEmailTemplate;
