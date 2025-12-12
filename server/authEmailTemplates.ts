const APP_TITLE = process.env.VITE_APP_TITLE || 'HotGigs';

export function getVerificationEmailHtml(verificationUrl: string, userName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">${APP_TITLE}</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
    
    <p>Hi ${userName},</p>
    
    <p>Thank you for signing up for ${APP_TITLE}! Please verify your email address to activate your account and start using our platform.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email Address</a>
    </div>
    
    <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
    <p style="color: #667eea; word-break: break-all; font-size: 14px;">${verificationUrl}</p>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours.</p>
    
    <p style="color: #666; font-size: 14px;">If you didn't create an account with ${APP_TITLE}, please ignore this email.</p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ${APP_TITLE}. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

export function getPasswordResetEmailHtml(resetUrl: string, userName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">${APP_TITLE}</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
    
    <p>Hi ${userName},</p>
    
    <p>We received a request to reset your password for your ${APP_TITLE} account. Click the button below to create a new password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
    </div>
    
    <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
    <p style="color: #667eea; word-break: break-all; font-size: 14px;">${resetUrl}</p>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
    
    <p style="color: #666; font-size: 14px;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ${APP_TITLE}. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

export function getVerificationEmailText(verificationUrl: string, userName: string): string {
  return `
Hi ${userName},

Thank you for signing up for ${APP_TITLE}!

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with ${APP_TITLE}, please ignore this email.

---
${APP_TITLE}
  `.trim();
}

export function getPasswordResetEmailText(resetUrl: string, userName: string): string {
  return `
Hi ${userName},

We received a request to reset your password for your ${APP_TITLE} account.

Click the link below to create a new password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

---
${APP_TITLE}
  `.trim();
}
