/**
 * Guest Invitation Email Template
 * Sent to guest applicants to encourage them to register and unlock full platform features
 */

interface GuestInvitationEmailParams {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  recruiterName: string;
  registrationLink: string;
  benefits: string[];
}

export function generateGuestInvitationEmail(params: GuestInvitationEmailParams): string {
  const {
    candidateName,
    jobTitle,
    companyName,
    recruiterName,
    registrationLink,
    benefits,
  } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unlock Your Full Potential on HotGigs</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .title {
      color: #1a1a1a;
      font-size: 28px;
      font-weight: 700;
      margin: 20px 0 10px;
      line-height: 1.2;
    }
    .subtitle {
      color: #666;
      font-size: 16px;
      margin-bottom: 30px;
    }
    .greeting {
      font-size: 18px;
      color: #333;
      margin-bottom: 20px;
    }
    .content {
      font-size: 16px;
      color: #555;
      margin-bottom: 25px;
      line-height: 1.8;
    }
    .benefits {
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      border-left: 4px solid #667eea;
      border-radius: 8px;
      padding: 25px;
      margin: 30px 0;
    }
    .benefits-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 15px;
    }
    .benefits-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .benefits-list li {
      padding: 8px 0;
      padding-left: 30px;
      position: relative;
      color: #333;
      font-size: 15px;
    }
    .benefits-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
      font-size: 18px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 20px 0;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
    }
    .cta-container {
      text-align: center;
      margin: 30px 0;
    }
    .job-info {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    .job-info-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .job-info-value {
      font-size: 16px;
      color: #1a1a1a;
      font-weight: 600;
      margin-bottom: 15px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #999;
      font-size: 14px;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .note {
      background-color: #fff8e1;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">HG</div>
      <h1 class="title">Unlock Your Full Potential</h1>
      <p class="subtitle">Complete your registration and access exclusive features</p>
    </div>

    <div class="greeting">
      Hi ${candidateName},
    </div>

    <div class="content">
      <p>
        Thank you for applying to the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>. 
        ${recruiterName} from our team has reviewed your application and would like to invite you to create a full account on HotGigs.
      </p>
      
      <p>
        By registering, you'll unlock powerful features that will help you throughout your job search journey and keep you connected with opportunities.
      </p>
    </div>

    <div class="job-info">
      <div class="job-info-label">Your Application</div>
      <div class="job-info-value">${jobTitle}</div>
      <div class="job-info-label">Company</div>
      <div class="job-info-value">${companyName}</div>
    </div>

    <div class="benefits">
      <div class="benefits-title">🚀 What You'll Get With a Full Account:</div>
      <ul class="benefits-list">
        ${benefits.map(benefit => `<li>${benefit}</li>`).join('')}
      </ul>
    </div>

    <div class="cta-container">
      <a href="${registrationLink}" class="cta-button">
        Create Your Free Account
      </a>
    </div>

    <div class="note">
      <strong>Quick & Easy:</strong> Registration takes less than 2 minutes, and your application information will be automatically linked to your new account.
    </div>

    <div class="content">
      <p>
        We're excited to help you find your next great opportunity. If you have any questions, feel free to reach out to our support team.
      </p>
      <p>
        Best regards,<br>
        <strong>The HotGigs Team</strong>
      </p>
    </div>

    <div class="footer">
      <p>
        This invitation was sent by ${recruiterName} from ${companyName}.<br>
        <a href="${registrationLink}">Register Now</a> | <a href="https://hotgigs.com/help">Help Center</a>
      </p>
      <p>
        © ${new Date().getFullYear()} HotGigs - AI-Powered Recruitment Platform. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
