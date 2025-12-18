export function getPasswordResetEmailTemplate(resetLink: string, userName: string, appTitle: string = "HotGigs"): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - ${appTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 60px; height: 60px; background-color: rgba(255, 255, 255, 0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="color: #ffffff; font-size: 32px; font-weight: bold;">HG</span>
              </div>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; line-height: 1.3;">
                Reset Your Password
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #1a202c; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi <strong>${userName}</strong>,
              </p>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We received a request to reset your password for your <strong>${appTitle}</strong> account.
              </p>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Click the button below to create a new password:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              
              <p style="color: #667eea; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0; word-break: break-all;">
                ${resetLink}
              </p>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0; border-radius: 4px;">
                <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0; font-weight: 600;">
                  ⚠️ Security Notice
                </p>
                <p style="color: #78350f; font-size: 13px; line-height: 1.6; margin: 8px 0 0 0;">
                  This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                <strong>${appTitle}</strong> - AI-Powered Recruitment Platform
              </p>
              
              <p style="color: #a0aec0; font-size: 13px; line-height: 1.6; margin: 0;">
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
