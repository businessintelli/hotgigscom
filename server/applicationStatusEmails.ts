/**
 * Enhanced application status email templates with personalized next steps
 * Each status change triggers a specific email with relevant content
 */

const EMAIL_STYLES = `
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: #f3f4f6;
  }
  .email-container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
  }
  .header {
    padding: 40px 20px;
    text-align: center;
  }
  .header-received { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
  .header-reviewing { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
  .header-interview { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); }
  .header-offer { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
  .header-rejected { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); }
  .header h1 {
    color: #ffffff;
    margin: 0;
    font-size: 28px;
    font-weight: 700;
  }
  .header p {
    color: rgba(255,255,255,0.9);
    margin: 10px 0 0 0;
    font-size: 16px;
  }
  .content {
    padding: 40px 30px;
    color: #374151;
    line-height: 1.6;
  }
  .button {
    display: inline-block;
    padding: 14px 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff !important;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    margin: 10px 5px;
  }
  .button-secondary {
    background: #f3f4f6;
    color: #374151 !important;
    border: 1px solid #d1d5db;
  }
  .info-box {
    background-color: #f9fafb;
    border-left: 4px solid #667eea;
    padding: 20px;
    margin: 20px 0;
    border-radius: 4px;
  }
  .next-steps {
    background-color: #ecfdf5;
    border: 1px solid #10b981;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }
  .next-steps h3 {
    color: #059669;
    margin: 0 0 15px 0;
    font-size: 16px;
  }
  .next-steps ul {
    margin: 0;
    padding-left: 20px;
  }
  .next-steps li {
    margin: 8px 0;
  }
  .tip-box {
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 8px;
    padding: 15px;
    margin: 20px 0;
  }
  .tip-box strong {
    color: #d97706;
  }
  .footer {
    background-color: #f9fafb;
    padding: 30px;
    text-align: center;
    color: #6b7280;
    font-size: 14px;
  }
  .footer a {
    color: #667eea;
    text-decoration: none;
  }
`;

const APP_URL = process.env.VITE_APP_URL || 'https://hotgigs.manus.space';

interface ApplicationEmailParams {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  applicationId?: number;
}

/**
 * Application Received - Sent immediately after submission
 */
export function generateApplicationReceivedEmail(params: ApplicationEmailParams): string {
  const { candidateName, jobTitle, companyName } = params;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Received</title>
  <style>${EMAIL_STYLES}</style>
</head>
<body>
  <div class="email-container">
    <div class="header header-received">
      <h1>✅ Application Received!</h1>
      <p>Your application has been successfully submitted</p>
    </div>
    <div class="content">
      <p>Dear ${candidateName},</p>
      
      <p>Great news! Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been successfully received.</p>
      
      <div class="info-box">
        <p><strong>Position:</strong> ${jobTitle}</p>
        <p><strong>Company:</strong> ${companyName}</p>
        <p><strong>Status:</strong> Application Received</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      
      <div class="next-steps">
        <h3>📋 What Happens Next?</h3>
        <ul>
          <li>The hiring team will review your application within 3-5 business days</li>
          <li>You'll receive an email update when your application status changes</li>
          <li>If selected, you'll be invited for an interview</li>
        </ul>
      </div>
      
      <div class="tip-box">
        <strong>💡 Pro Tip:</strong> While you wait, consider applying to similar positions to increase your chances. Our AI has found jobs matching your skills!
      </div>
      
      <center>
        <a href="${APP_URL}/candidate-dashboard" class="button">View Application Status</a>
        <a href="${APP_URL}/jobs" class="button button-secondary">Browse More Jobs</a>
      </center>
      
      <p>Thank you for choosing HotGigs!</p>
      
      <p>Best regards,<br>
      <strong>The HotGigs Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 HotGigs. All rights reserved.</p>
      <p>
        <a href="${APP_URL}">Visit HotGigs</a> | 
        <a href="${APP_URL}/candidate/settings">Email Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Application Under Review - Sent when recruiter starts reviewing
 */
export function generateApplicationReviewingEmail(params: ApplicationEmailParams): string {
  const { candidateName, jobTitle, companyName } = params;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Under Review</title>
  <style>${EMAIL_STYLES}</style>
</head>
<body>
  <div class="email-container">
    <div class="header header-reviewing">
      <h1>👀 Application Under Review</h1>
      <p>The hiring team is reviewing your profile</p>
    </div>
    <div class="content">
      <p>Dear ${candidateName},</p>
      
      <p>Exciting news! The hiring team at <strong>${companyName}</strong> has started reviewing your application for the <strong>${jobTitle}</strong> position.</p>
      
      <div class="info-box">
        <p><strong>Position:</strong> ${jobTitle}</p>
        <p><strong>Company:</strong> ${companyName}</p>
        <p><strong>Status:</strong> Under Review</p>
      </div>
      
      <div class="next-steps">
        <h3>📋 What This Means</h3>
        <ul>
          <li>Your resume and profile are being evaluated by the hiring team</li>
          <li>They're assessing your skills and experience against the job requirements</li>
          <li>You may be contacted for additional information or an interview</li>
        </ul>
      </div>
      
      <div class="tip-box">
        <strong>💡 Pro Tip:</strong> Make sure your profile is complete and up-to-date. Candidates with complete profiles are 40% more likely to get interviews!
      </div>
      
      <center>
        <a href="${APP_URL}/candidate-dashboard" class="button">View Application</a>
        <a href="${APP_URL}/candidate/profile" class="button button-secondary">Update Profile</a>
      </center>
      
      <p>We'll notify you as soon as there's an update!</p>
      
      <p>Best regards,<br>
      <strong>The HotGigs Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 HotGigs. All rights reserved.</p>
      <p>
        <a href="${APP_URL}">Visit HotGigs</a> | 
        <a href="${APP_URL}/candidate/settings">Email Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Interview Scheduled - Sent when interview is scheduled
 */
export function generateInterviewScheduledEmail(params: ApplicationEmailParams & {
  interviewDate: Date;
  interviewType: string;
  interviewLink?: string;
  interviewLocation?: string;
  duration: number;
}): string {
  const { candidateName, jobTitle, companyName, interviewDate, interviewType, interviewLink, interviewLocation, duration } = params;
  
  const formattedDate = interviewDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = interviewDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Scheduled</title>
  <style>${EMAIL_STYLES}</style>
</head>
<body>
  <div class="email-container">
    <div class="header header-interview">
      <h1>📅 Interview Scheduled!</h1>
      <p>Congratulations on making it to the interview stage</p>
    </div>
    <div class="content">
      <p>Dear ${candidateName},</p>
      
      <p>Congratulations! You've been selected for an interview for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
      
      <div class="info-box">
        <p><strong>📅 Date:</strong> ${formattedDate}</p>
        <p><strong>🕐 Time:</strong> ${formattedTime}</p>
        <p><strong>⏱️ Duration:</strong> ${duration} minutes</p>
        <p><strong>📍 Type:</strong> ${interviewType}</p>
        ${interviewLink ? `<p><strong>🔗 Link:</strong> <a href="${interviewLink}">${interviewLink}</a></p>` : ''}
        ${interviewLocation ? `<p><strong>📍 Location:</strong> ${interviewLocation}</p>` : ''}
      </div>
      
      <div class="next-steps">
        <h3>🎯 Interview Preparation Tips</h3>
        <ul>
          <li><strong>Research the company:</strong> Review ${companyName}'s website, recent news, and company culture</li>
          <li><strong>Review the job description:</strong> Be ready to discuss how your skills match the requirements</li>
          <li><strong>Prepare questions:</strong> Have 3-5 thoughtful questions ready for the interviewer</li>
          <li><strong>Test your setup:</strong> ${interviewType === 'video' ? 'Check your camera, microphone, and internet connection' : 'Plan your route and arrive 10-15 minutes early'}</li>
          <li><strong>Practice with AI:</strong> Use our AI mock interview feature to boost your confidence</li>
        </ul>
      </div>
      
      <center>
        <a href="${APP_URL}/candidate-dashboard" class="button">View Interview Details</a>
        <a href="${APP_URL}/interview-prep" class="button button-secondary">Practice Interview</a>
      </center>
      
      <p>We're rooting for you! Good luck with your interview.</p>
      
      <p>Best regards,<br>
      <strong>The HotGigs Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 HotGigs. All rights reserved.</p>
      <p>
        <a href="${APP_URL}">Visit HotGigs</a> | 
        <a href="${APP_URL}/candidate/settings">Email Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Interview Completed - Sent after interview is marked complete
 */
export function generateInterviewCompletedEmail(params: ApplicationEmailParams): string {
  const { candidateName, jobTitle, companyName } = params;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Completed</title>
  <style>${EMAIL_STYLES}</style>
</head>
<body>
  <div class="email-container">
    <div class="header header-interview">
      <h1>✨ Interview Completed!</h1>
      <p>Thank you for completing your interview</p>
    </div>
    <div class="content">
      <p>Dear ${candidateName},</p>
      
      <p>Thank you for completing your interview for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>!</p>
      
      <div class="info-box">
        <p><strong>Position:</strong> ${jobTitle}</p>
        <p><strong>Company:</strong> ${companyName}</p>
        <p><strong>Status:</strong> Interview Completed - Under Evaluation</p>
      </div>
      
      <div class="next-steps">
        <h3>📋 What Happens Next?</h3>
        <ul>
          <li>The hiring team will evaluate your interview performance</li>
          <li>You may be invited for additional interview rounds</li>
          <li>Final decisions are typically made within 1-2 weeks</li>
          <li>We'll notify you as soon as there's an update</li>
        </ul>
      </div>
      
      <div class="tip-box">
        <strong>💡 Pro Tip:</strong> Consider sending a brief thank-you note to your interviewer. It shows professionalism and genuine interest in the role!
      </div>
      
      <center>
        <a href="${APP_URL}/candidate-dashboard" class="button">View Application Status</a>
      </center>
      
      <p>Thank you for your time and effort!</p>
      
      <p>Best regards,<br>
      <strong>The HotGigs Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 HotGigs. All rights reserved.</p>
      <p>
        <a href="${APP_URL}">Visit HotGigs</a> | 
        <a href="${APP_URL}/candidate/settings">Email Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Offer Extended - Sent when candidate receives an offer
 */
export function generateOfferExtendedEmail(params: ApplicationEmailParams & {
  salaryRange?: string;
  startDate?: Date;
}): string {
  const { candidateName, jobTitle, companyName, salaryRange, startDate } = params;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Offer Extended</title>
  <style>${EMAIL_STYLES}</style>
</head>
<body>
  <div class="email-container">
    <div class="header header-offer">
      <h1>🎉 Congratulations!</h1>
      <p>You've received a job offer!</p>
    </div>
    <div class="content">
      <p>Dear ${candidateName},</p>
      
      <p>We're thrilled to inform you that <strong>${companyName}</strong> has extended an offer for the <strong>${jobTitle}</strong> position!</p>
      
      <div class="info-box">
        <p><strong>Position:</strong> ${jobTitle}</p>
        <p><strong>Company:</strong> ${companyName}</p>
        ${salaryRange ? `<p><strong>Compensation:</strong> ${salaryRange}</p>` : ''}
        ${startDate ? `<p><strong>Proposed Start Date:</strong> ${startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
        <p><strong>Status:</strong> Offer Extended - Awaiting Response</p>
      </div>
      
      <div class="next-steps">
        <h3>📋 Next Steps</h3>
        <ul>
          <li><strong>Review the offer:</strong> Take time to carefully review all terms and conditions</li>
          <li><strong>Ask questions:</strong> Don't hesitate to ask for clarification on any points</li>
          <li><strong>Negotiate if needed:</strong> It's okay to negotiate salary, benefits, or start date</li>
          <li><strong>Respond promptly:</strong> Let the employer know your decision within the specified timeframe</li>
        </ul>
      </div>
      
      <center>
        <a href="${APP_URL}/candidate-dashboard" class="button">View Offer Details</a>
      </center>
      
      <p>This is a significant achievement! We're so proud of you.</p>
      
      <p>Best regards,<br>
      <strong>The HotGigs Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 HotGigs. All rights reserved.</p>
      <p>
        <a href="${APP_URL}">Visit HotGigs</a> | 
        <a href="${APP_URL}/candidate/settings">Email Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Application Not Selected - Sent when application is rejected (with encouragement)
 */
export function generateApplicationRejectedEmail(params: ApplicationEmailParams & {
  feedback?: string;
}): string {
  const { candidateName, jobTitle, companyName, feedback } = params;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update</title>
  <style>${EMAIL_STYLES}</style>
</head>
<body>
  <div class="email-container">
    <div class="header header-rejected">
      <h1>📝 Application Update</h1>
      <p>Thank you for your interest in this position</p>
    </div>
    <div class="content">
      <p>Dear ${candidateName},</p>
      
      <p>Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong> and for taking the time to apply.</p>
      
      <p>After careful consideration, the hiring team has decided to move forward with other candidates whose qualifications more closely match their current needs.</p>
      
      ${feedback ? `
      <div class="info-box">
        <p><strong>Feedback from the hiring team:</strong></p>
        <p>${feedback}</p>
      </div>
      ` : ''}
      
      <div class="next-steps">
        <h3>🚀 Keep Going!</h3>
        <ul>
          <li><strong>Don't be discouraged:</strong> The right opportunity is out there for you</li>
          <li><strong>Improve your profile:</strong> Use our AI resume analyzer to get personalized improvement tips</li>
          <li><strong>Keep applying:</strong> We have many other positions that might be a great fit</li>
          <li><strong>Stay connected:</strong> New jobs matching your skills are posted daily</li>
        </ul>
      </div>
      
      <div class="tip-box">
        <strong>💡 Did you know?</strong> On average, it takes 10-15 applications to land an interview. Keep applying and stay positive!
      </div>
      
      <center>
        <a href="${APP_URL}/jobs" class="button">Browse New Jobs</a>
        <a href="${APP_URL}/candidate/profile" class="button button-secondary">Improve Profile</a>
      </center>
      
      <p>We wish you the best in your job search!</p>
      
      <p>Best regards,<br>
      <strong>The HotGigs Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 HotGigs. All rights reserved.</p>
      <p>
        <a href="${APP_URL}">Visit HotGigs</a> | 
        <a href="${APP_URL}/candidate/settings">Email Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Get the appropriate email template based on status
 */
export function getStatusEmailTemplate(
  status: string,
  params: ApplicationEmailParams & { 
    feedback?: string;
    interviewDate?: Date;
    interviewType?: string;
    interviewLink?: string;
    interviewLocation?: string;
    duration?: number;
    salaryRange?: string;
    startDate?: Date;
  }
): { subject: string; html: string } {
  switch (status) {
    case 'pending':
    case 'submitted':
      return {
        subject: `Application Received: ${params.jobTitle} at ${params.companyName}`,
        html: generateApplicationReceivedEmail(params),
      };
    case 'reviewing':
    case 'screening':
      return {
        subject: `Application Under Review: ${params.jobTitle} at ${params.companyName}`,
        html: generateApplicationReviewingEmail(params),
      };
    case 'interview_scheduled':
    case 'interviewing':
      return {
        subject: `Interview Scheduled: ${params.jobTitle} at ${params.companyName}`,
        html: generateInterviewScheduledEmail({
          ...params,
          interviewDate: params.interviewDate || new Date(),
          interviewType: params.interviewType || 'video',
          duration: params.duration || 60,
        }),
      };
    case 'interview_completed':
      return {
        subject: `Interview Completed: ${params.jobTitle} at ${params.companyName}`,
        html: generateInterviewCompletedEmail(params),
      };
    case 'offered':
      return {
        subject: `🎉 Congratulations! Job Offer: ${params.jobTitle} at ${params.companyName}`,
        html: generateOfferExtendedEmail(params),
      };
    case 'rejected':
    case 'not_selected':
      return {
        subject: `Application Update: ${params.jobTitle} at ${params.companyName}`,
        html: generateApplicationRejectedEmail(params),
      };
    default:
      return {
        subject: `Application Update: ${params.jobTitle} at ${params.companyName}`,
        html: generateApplicationReviewingEmail(params),
      };
  }
}
