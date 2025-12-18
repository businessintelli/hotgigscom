/**
 * Generate guest application confirmation email
 */
export function generateGuestApplicationConfirmationEmail(data: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  applicationId: number;
  registrationLink: string;
}): { subject: string; html: string; text: string } {
  const subject = `Application Received: ${data.jobTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .job-details {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .job-details h2 {
      margin-top: 0;
      color: #667eea;
      font-size: 20px;
    }
    .job-details p {
      margin: 8px 0;
    }
    .cta-button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .cta-button:hover {
      background: #5568d3;
    }
    .benefits {
      background: #e8f4f8;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .benefits h3 {
      margin-top: 0;
      color: #0066cc;
    }
    .benefits ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .benefits li {
      margin: 8px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
      border-top: 1px solid #e0e0e0;
      margin-top: 20px;
    }
    .checkmark {
      font-size: 48px;
      color: #4caf50;
      text-align: center;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>✓ Application Received!</h1>
  </div>
  
  <div class="content">
    <p>Hi ${data.candidateName},</p>
    
    <p>Thank you for applying! We've successfully received your application and wanted to confirm the details.</p>
    
    <div class="job-details">
      <h2>${data.jobTitle}</h2>
      <p><strong>Company:</strong> ${data.companyName}</p>
      <p><strong>Application ID:</strong> #${data.applicationId}</p>
      <p><strong>Status:</strong> Under Review</p>
    </div>
    
    <h3>What Happens Next?</h3>
    <ol>
      <li><strong>Review:</strong> The hiring team will review your application and resume</li>
      <li><strong>Evaluation:</strong> If your profile matches their requirements, they'll reach out</li>
      <li><strong>Interview:</strong> Selected candidates will be invited for interviews</li>
      <li><strong>Decision:</strong> You'll be notified of the final decision</li>
    </ol>
    
    <div class="benefits">
      <h3>🚀 Create Your Account to Unlock More Features</h3>
      <p>Register now to get access to:</p>
      <ul>
        <li>Track your application status in real-time</li>
        <li>Apply to multiple jobs with one click</li>
        <li>Get personalized job recommendations</li>
        <li>Receive instant notifications about your applications</li>
        <li>Build your professional profile</li>
        <li>Access career resources and tips</li>
      </ul>
      <div style="text-align: center;">
        <a href="${data.registrationLink}" class="cta-button">Create Your Free Account</a>
      </div>
      <p style="font-size: 12px; color: #666; margin-top: 15px;">
        When you register with the same email address, we'll automatically link this application to your account.
      </p>
    </div>
    
    <p>We appreciate your interest in joining ${data.companyName}. Good luck with your application!</p>
    
    <p>Best regards,<br>
    The HotGigs Team</p>
  </div>
  
  <div class="footer">
    <p>This is an automated message. Please do not reply to this email.</p>
    <p>&copy; 2024 HotGigs - AI-Powered Recruitment Platform. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  const text = `
Application Received: ${data.jobTitle}

Hi ${data.candidateName},

Thank you for applying! We've successfully received your application and wanted to confirm the details.

Job Details:
- Position: ${data.jobTitle}
- Company: ${data.companyName}
- Application ID: #${data.applicationId}
- Status: Under Review

What Happens Next?
1. Review: The hiring team will review your application and resume
2. Evaluation: If your profile matches their requirements, they'll reach out
3. Interview: Selected candidates will be invited for interviews
4. Decision: You'll be notified of the final decision

Create Your Account to Unlock More Features:
Register now to get access to:
- Track your application status in real-time
- Apply to multiple jobs with one click
- Get personalized job recommendations
- Receive instant notifications about your applications
- Build your professional profile
- Access career resources and tips

Create your free account: ${data.registrationLink}

When you register with the same email address, we'll automatically link this application to your account.

We appreciate your interest in joining ${data.companyName}. Good luck with your application!

Best regards,
The HotGigs Team

---
This is an automated message. Please do not reply to this email.
© 2024 HotGigs - AI-Powered Recruitment Platform. All rights reserved.
  `;

  return { subject, html, text };
}
