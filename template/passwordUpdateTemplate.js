const passwordUpdateTemplate = (email, fullName) => {
  return `<!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="UTF-8">
        <title>Password Update Confirmation</title>
        <style>
            body {
                background-color: #f4f4f4;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 16px;
                line-height: 1.6;
                color: #333333;
                margin: 0;
                padding: 0;
            }
    
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 0;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }

            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 30px 20px;
                text-align: center;
            }
    
            .logo {
                max-width: 150px;
                margin-bottom: 10px;
            }

            .header-title {
                color: #ffffff;
                font-size: 24px;
                font-weight: bold;
                margin: 0;
            }

            .content {
                padding: 40px 30px;
                text-align: left;
            }

            .greeting {
                font-size: 18px;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 15px;
            }
    
            .message {
                font-size: 16px;
                margin-bottom: 20px;
                color: #555555;
            }

            .security-alert {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
                border-left: 4px solid #f39c12;
            }

            .security-alert h3 {
                color: #856404;
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 16px;
            }

            .security-alert p {
                color: #856404;
                margin: 0;
                font-size: 14px;
            }

            .details-box {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #28a745;
            }

            .details-row {
                margin-bottom: 10px;
            }

            .label {
                font-weight: 600;
                color: #495057;
                display: inline-block;
                width: 120px;
            }

            .value {
                color: #6c757d;
            }
    
            .highlight {
                font-weight: 600;
                color: #007bff;
            }

            .footer {
                background-color: #f8f9fa;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #dee2e6;
            }

            .support {
                font-size: 14px;
                color: #6c757d;
                line-height: 1.5;
            }

            .support a {
                color: #007bff;
                text-decoration: none;
            }

            .support a:hover {
                text-decoration: underline;
            }

            .timestamp {
                font-size: 12px;
                color: #adb5bd;
                margin-top: 15px;
            }

            @media only screen and (max-width: 600px) {
                .container {
                    width: 100% !important;
                    margin: 0 !important;
                    border-radius: 0 !important;
                }
                
                .content {
                    padding: 20px !important;
                }

                .header {
                    padding: 20px !important;
                }
            }
        </style>
    
    </head>
    
    <body>
        <div class="container">
            <div class="header">
                <a href="https://studyHub-edtech-project.vercel.app">
                    <img class="logo" src="https://res.cloudinary.com/du7xquzsm/image/upload/v1759739371/StudyHub_Logo_a62jmn.png" alt="studyHub Logo">
                </a>
                <h1 class="header-title">Password Updated Successfully</h1>
            </div>

            <div class="content">
                <div class="greeting">Hello ${fullName},</div>
                
                <div class="message">
                    Your password has been successfully updated for your studyHub account.
                </div>

                <div class="details-box">
                    <div class="details-row">
                        <span class="label">Email:</span>
                        <span class="value highlight">${email}</span>
                    </div>
                    <div class="details-row">
                        <span class="label">Updated On:</span>
                        <span class="value">${new Date().toLocaleString(
                          "en-IN",
                          {
                            timeZone: "Asia/Kolkata",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}</span>
                    </div>
                </div>

                <div class="security-alert">
                    <h3>🔒 Security Notice</h3>
                    <p>If you did not make this change, please contact our support team immediately at 
                       <a href="mailto:security@studyHub.com">security@studyHub.com</a> or 
                       reset your password right away to secure your account.</p>
                </div>

                <div class="message">
                    <strong>Security Tips:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px; color: #555;">
                        <li>Keep your password secure and don't share it with anyone</li>
                        <li>Use a unique password for your studyHub account</li>
                        <li>Log out from shared or public devices</li>
                    </ul>
                </div>
            </div>

            <div class="footer">
                <div class="support">
                    <p>Need help? We're here for you!</p>
                    <p>📧 Email: <a href="mailto:support@studyHub.com">support@studyHub.com</a></p>
                    <p>🌐 Visit: <a href="https://studyHub-edtech-project.vercel.app">studyHub.com</a></p>
                    
                    <div class="timestamp">
                        This email was sent on ${new Date().toLocaleString(
                          "en-IN",
                          {
                            timeZone: "Asia/Kolkata",
                          }
                        )}
                    </div>
                </div>
            </div>
        </div>
    </body>
    
    </html>`;
};

export default passwordUpdateTemplate;
