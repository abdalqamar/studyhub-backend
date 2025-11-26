const paymentFailedEmailTemplate = (name, amount, orderId, reason) => {
  return `<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8" />
    <title>Payment Failed</title>
    <style>
        body {
            background-color: #f4f4f4;
            font-family: Arial, sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 20px;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }

        .logo {
            max-width: 200px;
            margin-bottom: 30px;
        }

        .error-icon {
            width: 60px;
            height: 60px;
            background-color: #e74c3c;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            font-size: 30px;
        }

        .message {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #e74c3c;
        }

        .body {
            font-size: 16px;
            margin-bottom: 25px;
            text-align: left;
            line-height: 1.8;
        }

        .body p {
            margin: 12px 0;
        }

        .info-box {
            background-color: #ffebee;
            border-left: 4px solid #e74c3c;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
        }

        .info-box p {
            margin: 8px 0;
            color: #c62828;
        }

        .retry-box {
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
            border-radius: 4px;
        }

        .retry-box h3 {
            color: #1565c0;
            margin-top: 0;
            margin-bottom: 10px;
        }

        .retry-box ul {
            margin: 10px 0;
            padding-left: 20px;
        }

        .retry-box li {
            margin: 5px 0;
            color: #1976d2;
        }

        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }

        .button:hover {
            background-color: #2980b9;
        }

        .support {
            font-size: 14px;
            color: #777;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
        }

        .support a {
            color: #3498db;
            text-decoration: none;
        }

        .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #999;
        }
    </style>
</head>

<body>
    <div class="container">
        <a href="https://studyHub-edtech-project.vercel.app">
            <img class="logo" 
                 src="https://res.cloudinary.com/du7xquzsm/image/upload/v1763790305/studyHub_logo-removebg-preview_ai0ckr.png" 
                 alt="StudyHub Logo" />
        </a>

        <div class="error-icon">✗</div>

        <div class="message">Payment Failed</div>

        <div class="body">
            <p>Dear <b>${name}</b>,</p>
            <p>We're sorry, but your payment could not be processed.</p>
            
            <div class="info-box">
                <p><b>Amount:</b> ₹${amount}</p>
                <p><b>Order ID:</b> ${orderId}</p>
                <p><b>Reason:</b> ${reason}</p>
            </div>

            <div class="retry-box">
                <h3>💡 What to do next?</h3>
                <ul>
                    <li>Check if your bank account has sufficient balance</li>
                    <li>Verify your card details are correct</li>
                    <li>Try using a different payment method</li>
                    <li>Contact your bank if the issue persists</li>
                </ul>
            </div>

            <p style="text-align: center;">
                <a href="https://studyHub-edtech-project.vercel.app/courses" class="button">
                    Try Again
                </a>
            </p>

            <p>Your cart items are still saved. You can complete the purchase anytime.</p>
        </div>

        <div class="support">
            Need help? We're here for you!<br>
            📧 Email: <a href="mailto:info@studyHub.com">info@studyHub.com</a><br>
            🌐 Visit: <a href="https://studyHub-edtech-project.vercel.app">studyHub.com</a>
        </div>

        <div class="footer">
            © 2025 StudyHub. All rights reserved.
        </div>
    </div>
</body>

</html>`;
};

export default paymentFailedEmailTemplate;
