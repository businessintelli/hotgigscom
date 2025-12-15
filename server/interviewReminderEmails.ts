/**
 * Interview Reminder Email Templates
 * Sent 24 hours and 1 hour before scheduled interviews
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
    background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
    padding: 40px 20px;
    text-align: center;
  }
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
  .countdown {
    background: rgba(255,255,255,0.2);
    display: inline-block;
    padding: 10px 20px;
    border-radius: 20px;
    margin-top: 15px;
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
  }
  .content {
    padding: 40px 30px;
    color: #374151;
    line-height: 1.6;
  }
  .button {
    display: inline-block;
    padding: 14px 32px;
    background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
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
    border-left: 4px solid #8b5cf6;
    padding: 20px;
    margin: 20px 0;
    border-radius: 4px;
  }
  .checklist {
    background-color: #f0fdf4;
    border: 1px solid #22c55e;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }
  .checklist h3 {
    color: #16a34a;
    margin: 0 0 15px 0;
    font-size: 16px;
  }
  .checklist ul {
    margin: 0;
    padding-left: 0;
    list-style: none;
  }
  .checklist li {
    margin: 10px 0;
    padding-left: 28px;
    position: relative;
  }
  .checklist li::before {
    content: "☐";
    position: absolute;
    left: 0;
    color: #22c55e;
    font-size: 18px;
  }
  .quick-tips {
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }
  .quick-tips h3 {
    color: #d97706;
    margin: 0 0 15px 0;
    font-size: 16px;
  }
  .meeting-details {
    background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
    border-radius: 12px;
    padding: 25px;
    margin: 20px 0;
    text-align: center;
  }
  .meeting-details h3 {
    color: #6d28d9;
    margin: 0 0 15px 0;
  }
  .meeting-link {
    display: inline-block;
    padding: 12px 24px;
    background: #6d28d9;
    color: #ffffff !important;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    margin-top: 10px;
  }
  .footer {
    background-color: #f9fafb;
    padding: 30px;
    text-align: center;
    color: #6b7280;
    font-size: 14px;
  }
  .footer a {
    color: #8b5cf6;
    text-decoration: none;
  }
`;

const APP_URL = process.env.VITE_APP_URL || 'https://hotgigs.manus.space';

interface InterviewReminderParams {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  interviewDate: Date;
  interviewType: string;
  interviewLink?: string;
  interviewLocation?: string;
  duration: number;
  interviewerName?: string;
}

/**
 * 24-Hour Interview Reminder Email
 * Includes full preparation checklist
 */
export function generate24HourReminderEmail(params: InterviewReminderParams): string {
  const { candidateName, jobTitle, companyName, interviewDate, interviewType, interviewLink, interviewLocation, duration, interviewerName } = params;
  
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
  
  const isVideo = interviewType.toLowerCase().includes('video') || interviewType.toLowerCase().includes('virtual');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Reminder - 24 Hours</title>
  <style>${EMAIL_STYLES}</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>⏰ Interview Tomorrow!</h1>
      <p>Your interview is in 24 hours</p>
      <div class="countdown">📅 ${formattedDate} at ${formattedTime}</div>
    </div>
    <div class="content">
      <p>Hi ${candidateName},</p>
      
      <p>This is a friendly reminder that your interview for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> is scheduled for tomorrow!</p>
      
      <div class="info-box">
        <p><strong>📅 Date:</strong> ${formattedDate}</p>
        <p><strong>🕐 Time:</strong> ${formattedTime}</p>
        <p><strong>⏱️ Duration:</strong> ${duration} minutes</p>
        <p><strong>📍 Type:</strong> ${interviewType}</p>
        ${interviewerName ? `<p><strong>👤 Interviewer:</strong> ${interviewerName}</p>` : ''}
        ${interviewLocation ? `<p><strong>📍 Location:</strong> ${interviewLocation}</p>` : ''}
      </div>
      
      ${interviewLink ? `
      <div class="meeting-details">
        <h3>🔗 Meeting Link</h3>
        <p>Click the button below to join your interview:</p>
        <a href="${interviewLink}" class="meeting-link">Join Interview</a>
        <p style="font-size: 12px; margin-top: 10px; color: #6b7280;">
          Link: ${interviewLink}
        </p>
      </div>
      ` : ''}
      
      <div class="checklist">
        <h3>✅ Interview Preparation Checklist</h3>
        <ul>
          ${isVideo ? `
          <li>Test your camera and microphone</li>
          <li>Check your internet connection</li>
          <li>Find a quiet, well-lit space</li>
          <li>Have a professional background</li>
          ` : `
          <li>Plan your route and transportation</li>
          <li>Prepare to arrive 10-15 minutes early</li>
          <li>Dress professionally</li>
          `}
          <li>Research ${companyName} - recent news, products, culture</li>
          <li>Review the job description and your resume</li>
          <li>Prepare 3-5 questions to ask the interviewer</li>
          <li>Practice your "Tell me about yourself" answer</li>
          <li>Have examples ready for behavioral questions (STAR method)</li>
          <li>Prepare a notepad and pen for notes</li>
          <li>Get a good night's sleep!</li>
        </ul>
      </div>
      
      <div class="quick-tips">
        <h3>💡 Pro Tips</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li><strong>Research the interviewer</strong> on LinkedIn if you know their name</li>
          <li><strong>Review common interview questions</strong> for ${jobTitle} roles</li>
          <li><strong>Prepare specific examples</strong> of your achievements with metrics</li>
          <li><strong>Have a glass of water nearby</strong> during the interview</li>
        </ul>
      </div>
      
      <center>
        <a href="${APP_URL}/candidate-dashboard" class="button">View Interview Details</a>
        <a href="${APP_URL}/interview-prep" class="button button-secondary">Practice Interview</a>
      </center>
      
      <p>You've got this! We're rooting for you. 🎉</p>
      
      <p>Best of luck,<br>
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
 * 1-Hour Interview Reminder Email
 * Quick tips and final reminders
 */
export function generate1HourReminderEmail(params: InterviewReminderParams): string {
  const { candidateName, jobTitle, companyName, interviewDate, interviewType, interviewLink, interviewLocation, duration } = params;
  
  const formattedTime = interviewDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const isVideo = interviewType.toLowerCase().includes('video') || interviewType.toLowerCase().includes('virtual');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Reminder - 1 Hour</title>
  <style>${EMAIL_STYLES}</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🚀 Interview Starting Soon!</h1>
      <p>Your interview begins in 1 hour</p>
      <div class="countdown">🕐 ${formattedTime}</div>
    </div>
    <div class="content">
      <p>Hi ${candidateName},</p>
      
      <p>Your interview for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> starts in <strong>1 hour</strong>!</p>
      
      ${interviewLink ? `
      <div class="meeting-details">
        <h3>🔗 Join Your Interview</h3>
        <a href="${interviewLink}" class="meeting-link">Click to Join</a>
        <p style="font-size: 12px; margin-top: 10px; color: #6b7280;">
          ${interviewLink}
        </p>
      </div>
      ` : ''}
      
      ${interviewLocation ? `
      <div class="info-box">
        <p><strong>📍 Location:</strong> ${interviewLocation}</p>
        <p><strong>⏱️ Duration:</strong> ${duration} minutes</p>
        <p style="color: #dc2626;"><strong>⚠️ Remember:</strong> Arrive 10-15 minutes early!</p>
      </div>
      ` : ''}
      
      <div class="quick-tips">
        <h3>⚡ Last-Minute Checklist</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${isVideo ? `
          <li>✓ Close unnecessary browser tabs and apps</li>
          <li>✓ Test your audio/video one more time</li>
          <li>✓ Silence your phone notifications</li>
          <li>✓ Have the meeting link ready</li>
          ` : `
          <li>✓ Leave now if you haven't already!</li>
          <li>✓ Bring copies of your resume</li>
          <li>✓ Silence your phone</li>
          `}
          <li>✓ Take a few deep breaths - you're prepared!</li>
          <li>✓ Smile and be confident</li>
        </ul>
      </div>
      
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="font-size: 18px; margin: 0; color: #92400e;">
          <strong>💪 You've prepared for this moment!</strong>
        </p>
        <p style="margin: 10px 0 0 0; color: #a16207;">
          Be yourself, stay calm, and show them why you're the perfect fit.
        </p>
      </div>
      
      ${interviewLink ? `
      <center>
        <a href="${interviewLink}" class="button">Join Interview Now</a>
      </center>
      ` : ''}
      
      <p>Good luck! 🍀</p>
      
      <p>The HotGigs Team</p>
    </div>
    <div class="footer">
      <p>© 2025 HotGigs. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Get reminder email based on time before interview
 */
export function getInterviewReminderEmail(
  hoursBeforeInterview: number,
  params: InterviewReminderParams
): { subject: string; html: string } {
  if (hoursBeforeInterview <= 1) {
    return {
      subject: `⏰ Interview in 1 Hour: ${params.jobTitle} at ${params.companyName}`,
      html: generate1HourReminderEmail(params),
    };
  } else {
    return {
      subject: `📅 Interview Tomorrow: ${params.jobTitle} at ${params.companyName}`,
      html: generate24HourReminderEmail(params),
    };
  }
}
