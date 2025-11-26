const resetPasswordTemplate = (email, fullName, frontendUrl) => {
  //   const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  return `<!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="UTF-8">
        <title>Reset Your Password - studyHub</title>
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
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
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

            .reset-box {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 10px;
                padding: 30px;
                text-align: center;
                margin: 30px 0;
            }

            .reset-button {
                display: inline-block;
                background-color: #ffffff;
                color: #667eea;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 50px;
                font-size: 16px;
                font-weight: bold;
                margin: 10px 0;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
                border: none;
                cursor: pointer;
            }

            .reset-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
            }

            .reset-text {
                color: #ffffff;
                margin-bottom: 20px;
                font-size: 16px;
            }

            .token-info {
                background-color: #e3f2fd;
                border: 1px solid #bbdefb;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
                border-left: 4px solid #2196f3;
            }

            .token-info h3 {
                color: #1565c0;
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 16px;
            }

            .token-info p {
                color: #1976d2;
                margin: 5px 0;
                font-size: 14px;
            }

            .alternative-link {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #6c757d;
            }

            .alternative-link h4 {
                margin-top: 0;
                color: #495057;
                font-size: 14px;
            }

            .link-text {
                font-size: 12px;
                color: #6c757d;
                word-break: break-all;
                background-color: #ffffff;
                padding: 10px;
                border-radius: 4px;
                border: 1px solid #dee2e6;
                margin-top: 10px;
            }

            .warning-box {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
                border-left: 4px solid #f39c12;
            }

            .warning-box h3 {
                color: #856404;
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 16px;
            }

            .warning-box p {
                color: #856404;
                margin: 0;
                font-size: 14px;
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

                .reset-box {
                    padding: 20px !important;
                }

                .reset-button {
                    padding: 12px 25px !important;
                    font-size: 14px !important;
                }
            }
        </style>
    
    </head>
    
    <body>
        <div class="container">
            <div class="header">
               
                    <img class="logo" src="https://res.cloudinary.com/du7xquzsm/image/upload/v1759739371/StudyHub_Logo_a62jmn.png" alt="studyHub Logo">
       
                <h1 class="header-title">Reset Your Password</h1>
            </div>

            <div class="content">
                <div class="greeting">Hello ${fullName},</div>
                
                <div class="message">
                    We received a request to reset your password for your studyHub account associated with 
                    <span class="highlight">${email}</span>.
                </div>

                <div class="reset-box">
                    <div class="reset-text">
                        Click the button below to reset your password. This link will expire in <strong>5 minutes</strong> for your security.
                    </div>
                    <a href="${frontendUrl}" class="reset-button">Reset My Password</a>
                </div>

                <div class="alternative-link">
                    <h4>Button not working? Copy and paste this link in your browser:</h4>
                    <div class="link-text">${frontendUrl}</div>
                </div>

                <div class="token-info">
                    <h3>🔐 Security Information</h3>
                    <p><strong>Request Time:</strong> ${new Date().toLocaleString(
                      "en-IN",
                      {
                        timeZone: "Asia/Kolkata",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}</p>
                    <p><strong>Valid Until:</strong> ${new Date(
                      Date.now() + 5 * 60 * 1000
                    ).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}</p>
                    <p><strong>IP Address:</strong> This request was made from your current location</p>
                </div>

                <div class="warning-box">
                    <h3>⚠️ Important Security Notice</h3>
                    <p><strong>If you didn't request this password reset:</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Please ignore this email - your password remains secure</li>
                        <li>Consider changing your password if you're concerned about account security</li>
                        <li>Contact our security team at <a href="mailto:security@studyHub.com">security@studyHub.com</a></li>
                    </ul>
                </div>

                <div class="message">
                    <strong>🛡️ Security Tips:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px; color: #555;">
                        <li>Choose a strong, unique password with at least 8 characters</li>
                        <li>Include uppercase, lowercase, numbers, and special characters</li>
                        <li>Don't reuse passwords from other accounts</li>
                        <li>Never share your password with anyone</li>
                    </ul>
                </div>
            </div>

            <div class="footer">
                <div class="support">
                    <p><strong>Need help?</strong> Our support team is here for you!</p>
                    <p>📧 Email: <a href="mailto:support@studyHub.com">support@studyHub.com</a></p>
                    <p>🔒 Security: <a href="mailto:security@studyHub.com">security@studyHub.com</a></p>
                    <p>🌐 Visit: <a href="https://studyHub-edtech-project.vercel.app">studyHub.com</a></p>
                    
                    <div class="timestamp">
                        This email was sent on ${new Date().toLocaleString(
                          "en-IN",
                          {
                            timeZone: "Asia/Kolkata",
                          }
                        )} IST
                    </div>
                </div>
            </div>
        </div>
    </body>
    
    </html>`;
};

export default resetPasswordTemplate;
