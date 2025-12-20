/**
 * Professional HTML email templates for HotGigs platform
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 40px 20px;
    text-align: center;
  }
  .header h1 {
    color: #ffffff;
    margin: 0;
    font-size: 28px;
    font-weight: 700;
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
    margin: 20px 0;
  }
  .info-box {
    background-color: #f9fafb;
    border-left: 4px solid #667eea;
    padding: 20px;
    margin: 20px 0;
    border-radius: 4px;
  }
  .info-box-item {
    margin: 8px 0;
  }
  .info-box-label {
    font-weight: 600;
    color: #1f2937;
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

interface InterviewInvitationParams {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewType: string;
  interviewDate: Date;
  interviewLink?: string;
  interviewLocation?: string;
  duration: number;
  notes?: string;
}

export function generateInterviewInvitationEmail(params: InterviewInvitationParams): string {
  const {
    candidateName,
    jobTitle,
    companyName,
    interviewType,
    interviewDate,
    interviewLink,
    interviewLocation,
    duration,
    notes,
  } = params;

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
  <title>Interview Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🎉 Interview Invitation</h1>
    </div>
    <div style="padding: 40px 30px; color: #374151; line-height: 1.6;">
      <p>Dear ${candidateName},</p>
      
      <p>Congratulations! We're excited to invite you to interview for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
      
      <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <div style="margin: 8px 0;">
          <span style="font-weight: 600; color: #1f2937;">Interview Type:</span> ${interviewType}
        </div>
        <div style="margin: 8px 0;">
          <span style="font-weight: 600; color: #1f2937;">Date:</span> ${formattedDate}
        </div>
        <div style="margin: 8px 0;">
          <span style="font-weight: 600; color: #1f2937;">Time:</span> ${formattedTime}
        </div>
        <div style="margin: 8px 0;">
          <span style="font-weight: 600; color: #1f2937;">Duration:</span> ${duration} minutes
        </div>
        ${interviewLink ? `<div style="margin: 8px 0;"><span style="font-weight: 600; color: #1f2937;">Meeting Link:</span> <a href="${interviewLink}" style="color: #667eea; text-decoration: none;">${interviewLink}</a></div>` : ''}
        ${interviewLocation ? `<div style="margin: 8px 0;"><span style="font-weight: 600; color: #1f2937;">Location:</span> ${interviewLocation}</div>` : ''}
      </div>
      
      ${notes ? `<p><strong>Additional Notes:</strong><br>${notes}</p>` : ''}
      
      <p>Please log in to your HotGigs account to confirm your attendance and view full interview details.</p>
      
      <center>
        <a href="${process.env.VITE_APP_URL || 'https://hotgigs.manus.space'}/candidate-dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0;">
          View Interview Details
        </a>
      </center>
      
      <p>We look forward to speaking with you!</p>
      
      <p>Best regards,<br>
      <strong>The HotGigs Team</strong></p>
    </div>
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px;">
      <p>© 2025 HotGigs. All rights reserved.</p>
      <p>
        <a href="${process.env.VITE_APP_URL || 'https://hotgigs.manus.space'}" style="color: #667eea; text-decoration: none;">Visit HotGigs</a> | 
        <a href="${process.env.VITE_APP_URL || 'https://hotgigs.manus.space'}/settings" style="color: #667eea; text-decoration: none;">Email Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

interface StatusUpdateParams {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  oldStatus: string;
  newStatus: string;
  message?: string;
}

export function generateStatusUpdateEmail(params: StatusUpdateParams): string {
  const { candidateName, jobTitle, companyName, oldStatus, newStatus, message } = params;

  const statusEmoji = {
    pending: '⏳',
    reviewing: '👀',
    interviewing: '📅',
    offered: '🎉',
    rejected: '📝',
    withdrawn: '↩️',
  };

  const emoji = statusEmoji[newStatus as keyof typeof statusEmoji] || '📋';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">${emoji} Application Update</h1>
    </div>
    <div style="padding: 40px 30px; color: #374151; line-height: 1.6;">
      <p>Dear ${candidateName},</p>
      
      <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated.</p>
      
      <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <div style="margin: 8px 0;">
          <span style="font-weight: 600; color: #1f2937;">Previous Status:</span> ${oldStatus}
        </div>
        <div style="margin: 8px 0;">
          <span style="font-weight: 600; color: #1f2937;">New Status:</span> <strong>${newStatus}</strong>
        </div>
      </div>
      
      ${message ? `<p>${message}</p>` : ''}
      
      <p>Log in to your HotGigs account to view full details and take any necessary next steps.</p>
      
      <center>
        <a href="${process.env.VITE_APP_URL || 'https://hotgigs.manus.space'}/candidate-dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0;">
          View Application
        </a>
      </center>
      
      <p>Thank you for using HotGigs!</p>
      
      <p>Best regards,<br>
      <strong>The HotGigs Team</strong></p>
    </div>
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px;">
      <p>© 2025 HotGigs. All rights reserved.</p>
      <p>
        <a href="${process.env.VITE_APP_URL || 'https://hotgigs.manus.space'}" style="color: #667eea; text-decoration: none;">Visit HotGigs</a> | 
        <a href="${process.env.VITE_APP_URL || 'https://hotgigs.manus.space'}/settings" style="color: #667eea; text-decoration: none;">Email Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

interface InterviewReminderParams {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewType: string;
  interviewDate: Date;
  interviewLink?: string;
  interviewLocation?: string;
  hoursUntil: number;
}

export function generateInterviewReminderEmail(params: InterviewReminderParams): string {
  const {
    candidateName,
    jobTitle,
    companyName,
    interviewType,
    interviewDate,
    interviewLink,
    interviewLocation,
    hoursUntil,
  } = params;

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

  const reminderText = hoursUntil === 24 
    ? 'Your interview is coming up tomorrow!' 
    : 'Your interview is starting in 1 hour!';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">⏰ Interview Reminder</h1>
    </div>
    <div style="padding: 40px 30px; color: #374151; line-height: 1.6;">
      <p>Dear ${candidateName},</p>
      
      <p><strong>${reminderText}</strong></p>
      
      <p>This is a friendly reminder about your upcoming interview for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
      
      <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <div style="margin: 8px 0;">
          <span style="font-weight: 600; color: #1f2937;">Interview Type:</span> ${interviewType}
        </div>
        <div style="margin: 8px 0;">
          <span style="font-weight: 600; color: #1f2937;">Date:</span> ${formattedDate}
        </div>
        <div style="margin: 8px 0;">
          <span style="font-weight: 600; color: #1f2937;">Time:</span> ${formattedTime}
        </div>
        ${interviewLink ? `<div style="margin: 8px 0;"><span style="font-weight: 600; color: #1f2937;">Meeting Link:</span> <a href="${interviewLink}" style="color: #667eea; text-decoration: none;">${interviewLink}</a></div>` : ''}
        ${interviewLocation ? `<div style="margin: 8px 0;"><span style="font-weight: 600; color: #1f2937;">Location:</span> ${interviewLocation}</div>` : ''}
      </div>
      
      ${hoursUntil === 24 ? `
      <p><strong>Preparation Tips:</strong></p>
      <ul style="color: #374151; line-height: 1.8;">
        <li>Review the job description and your application</li>
        <li>Research the company and prepare questions</li>
        <li>Test your technology (camera, microphone) if it's a video interview</li>
        <li>Prepare examples of your relevant experience</li>
        <li>Get a good night's sleep!</li>
      </ul>
      ` : `
      <p><strong>Final Checklist:</strong></p>
      <ul style="color: #374151; line-height: 1.8;">
        <li>Have a copy of your resume ready</li>
        <li>Ensure your device is charged and connected</li>
        <li>Find a quiet, well-lit space</li>
        <li>Join the meeting 5 minutes early</li>
      </ul>
      `}
      
      <center>
        <a href="${interviewLink || process.env.VITE_APP_URL || 'https://hotgigs.manus.space'}/candidate-dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0;">
          ${interviewLink ? 'Join Interview' : 'View Details'}
        </a>
      </center>
      
      <p>Good luck! We're rooting for you.</p>
      
      <p>Best regards,<br>
      <strong>The HotGigs Team</strong></p>
    </div>
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px;">
      <p>© 2025 HotGigs. All rights reserved.</p>
      <p>
        <a href="${process.env.VITE_APP_URL || 'https://hotgigs.manus.space'}" style="color: #667eea; text-decoration: none;">Visit HotGigs</a> | 
        <a href="${process.env.VITE_APP_URL || 'https://hotgigs.manus.space'}/settings" style="color: #667eea; text-decoration: none;">Email Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

interface NewApplicationParams {
  recruiterName: string;
  candidateName: string;
  jobTitle: string;
  applicationDate: Date;
  resumeUrl?: string;
}

export function generateNewApplicationEmail(params: NewApplicationParams): string {
  const { recruiterName, candidateName, jobTitle, applicationDate, resumeUrl } = params;

  const formattedDate = applicationDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Application Received</title>
  <style>${EMAIL_STYLES}</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>📨 New Application</h1>
    </div>
    <div class="content">
      <p>Dear ${recruiterName},</p>
      
      <p>You have received a new application for <strong>${jobTitle}</strong>.</p>
      
      <div class="info-box">
        <div class="info-box-item">
          <span class="info-box-label">Candidate:</span> ${candidateName}
        </div>
        <div class="info-box-item">
          <span class="info-box-label">Position:</span> ${jobTitle}
        </div>
        <div class="info-box-item">
          <span class="info-box-label">Applied On:</span> ${formattedDate}
        </div>
        ${resumeUrl ? `<div class="info-box-item"><span class="info-box-label">Resume:</span> <a href="${resumeUrl}">View Resume</a></div>` : ''}
      </div>
      
      <p>Log in to your HotGigs dashboard to review the application, view AI matching scores, and take action.</p>
      
      <center>
        <a href="${process.env.VITE_APP_URL || 'https://hotgigs.manus.space'}/recruiter/applications" class="button">
          Review Application
        </a>
      </center>
      
      <p>Best regards,<br>
      <strong>The HotGigs Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 HotGigs. All rights reserved.</p>
      <p>
        <a href="${process.env.VITE_APP_URL || 'https://hotgigs.manus.space'}">Visit HotGigs</a> | 
        <a href="${process.env.VITE_APP_URL || 'https://hotgigs.manus.space'}/settings">Notification Settings</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

interface CandidateInvitationParams {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  jobId: number;
  companyName: string;
  recruiterName: string;
  registrationUrl: string;
}

export function generateCandidateInvitationEmail(params: CandidateInvitationParams): string {
  const { candidateName, jobTitle, companyName, recruiterName, registrationUrl } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Application Invitation</title>
  <style>${EMAIL_STYLES}</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🎯 You've Been Invited to Apply!</h1>
    </div>
    <div class="content">
      <p>Hello ${candidateName},</p>
      
      <p><strong>${recruiterName}</strong> from <strong>${companyName}</strong> has submitted your application for the following position:</p>
      
      <div class="info-box">
        <div class="info-box-item">
          <span class="info-box-label">Position:</span> ${jobTitle}
        </div>
        <div class="info-box-item">
          <span class="info-box-label">Company:</span> ${companyName}
        </div>
        <div class="info-box-item">
          <span class="info-box-label">Submitted By:</span> ${recruiterName}
        </div>
      </div>
      
      <p>To review your application details and complete your registration on HotGigs, please click the button below:</p>
      
      <center>
        <a href="${registrationUrl}" class="button">
          Review Application & Register
        </a>
      </center>
      
      <p><strong>Once registered, you'll be able to:</strong></p>
      <ul>
        <li>View and manage your application status</li>
        <li>Update your profile and resume</li>
        <li>Track interview schedules</li>
        <li>Apply for other opportunities</li>
      </ul>
      
      <p style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px;">
        <strong>Note:</strong> If you didn't expect this invitation or have any questions, please contact ${recruiterName} directly.
      </p>
      
      <p>Best regards,<br>
      <strong>The HotGigs Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 HotGigs. All rights reserved.</p>
      <p>
        <a href="${process.env.VITE_APP_URL || 'https://hotgigs.manus.space'}">Visit HotGigs</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
