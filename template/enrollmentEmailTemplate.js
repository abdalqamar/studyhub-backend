const enrollmentEmailTemplate = (name, amount, orderId, paymentId, courses) => {
  const coursesList = courses
    .map(
      (course) => `<li style="margin: 8px 0; text-align: left;">${course}</li>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <title>Course Purchase & Enrollment Confirmation – StudyHub</title>
    <style>
        body {
            background-color: #f5f5f5;
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            padding: 40px 20px;
            text-align: center;
        }

        .logo {
            max-width: 160px;
            height: auto;
            margin-bottom: 15px;
            background-color: transparent;
        }

        .header-title {
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
            margin: 0;
        }

        .content {
            padding: 40px 30px;
        }

        .success-badge {
            background-color: #4caf50;
            color: #ffffff;
            display: inline-block;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: bold;
            margin-bottom: 20px;
        }

        .greeting {
            font-size: 20px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 20px;
        }

        .message {
            font-size: 16px;
            color: #555555;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .info-box {
            background-color: #f9f9f9;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }

        .info-row:last-child {
            border-bottom: none;
        }

        .info-label {
            font-weight: bold;
            color: #666666;
        }

        .info-value {
            color: #333333;
            font-weight: 600;
        }

        .amount {
            color: #4caf50;
            font-size: 20px;
            font-weight: bold;
        }

        .courses-section {
            margin: 30px 0;
        }

        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 15px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
        }

        .courses-list {
            background-color: #f9f9f9;
            padding: 20px 25px;
            border-radius: 5px;
            margin: 0;
        }

        .courses-list li {
            color: #333333;
            font-size: 15px;
            line-height: 1.8;
        }

        .enrollment-banner {
            background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
            color: #ffffff;
            text-align: center;
            padding: 25px;
            border-radius: 8px;
            margin: 30px 0;
        }

        .enrollment-banner h2 {
            margin: 0 0 10px 0;
            font-size: 22px;
        }

        .enrollment-banner p {
            margin: 0;
            font-size: 16px;
        }

        .cta {
            display: inline-block;
            padding: 15px 40px;
            background-color: #3b82f6;
            color: #ffffff;
            text-decoration: none;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            margin-top: 25px;
            transition: background-color 0.3s;
        }

        .cta:hover {
            background-color: #2563eb;
        }

        .footer {
            background-color: #f5f5f5;
            padding: 30px;
            text-align: center;
        }

        .support {
            font-size: 14px;
            color: #666666;
            line-height: 1.6;
        }

        .support a {
            color: #3b82f6;
            text-decoration: none;
            font-weight: bold;
        }

        .divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 30px 0;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <img class="logo" src="https://res.cloudinary.com/du7xquzsm/image/upload/v1759739371/StudyHub_Logo_a62jmn.png" alt="StudyHub Logo">
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
                    <span class="info-label">Amount Paid:</span>
                    <span class="info-value amount">₹${amount}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Order ID:</span>
                    <span class="info-value">${orderId}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Payment ID:</span>
                    <span class="info-value">${paymentId}</span>
                </div>
            </div>

            <div class="courses-section">
                <div class="section-title">📚 Your Enrolled Courses</div>
                <ul class="courses-list">
                    ${coursesList}
                </ul>
            </div>

            <div class="enrollment-banner">
                <h2>🎉 You Are Now Enrolled!</h2>
                <p>You can start learning immediately. Access your courses anytime, anywhere.</p>
            </div>

            <div style="text-align: center;">
                <a href="https://studyHub-edtech-project.vercel.app/dashboard" class="cta">Start Learning Now</a>
            </div>

            <div class="divider"></div>

            <div class="message" style="font-size: 14px; color: #666666;">
                All your courses are now available in your dashboard. Happy learning! 🚀
            </div>
        </div>

        <div class="footer">
            <div class="support">
                If you have any questions or need assistance, please feel free to reach out to us at 
                <a href="mailto:info@studyHub.com">info@studyHub.com</a>. We are here to help!
            </div>
        </div>
    </div>
</body>

</html>`;
};

export default enrollmentEmailTemplate;
