/**
 * Panelist Reminder Email Templates
 * Sends automated reminders to panel members 24 hours and 1 hour before interviews
 */

interface PanelistReminderData {
  panelistName: string;
  panelistEmail: string;
  candidateName: string;
  jobTitle: string;
  companyName?: string;
  interviewDate: Date;
  interviewDuration: number;
  interviewType: string;
  meetingLink?: string;
  location?: string;
  notes?: string;
}

/**
 * Generate 24-hour reminder email for panelists
 */
export function generate24HourReminderEmail(data: PanelistReminderData): { subject: string; html: string } {
  const formattedDate = data.interviewDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = data.interviewDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `⏰ Interview Tomorrow: ${data.candidateName} for ${data.jobTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⏰ Interview Tomorrow</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 14px;">24-Hour Reminder</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${data.panelistName || 'there'},
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                This is a friendly reminder that you have an interview scheduled for <strong>tomorrow</strong>.
              </p>
              
              <!-- Interview Details Card -->
              <div style="background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%); border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #667eea; margin: 0 0 15px 0; font-size: 18px;">📋 Interview Details</h3>
                <table width="100%" cellpadding="5" cellspacing="0">
                  <tr>
                    <td style="color: #666; width: 120px; vertical-align: top;">Candidate:</td>
                    <td style="color: #333; font-weight: 600;">${data.candidateName}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; vertical-align: top;">Position:</td>
                    <td style="color: #333; font-weight: 600;">${data.jobTitle}${data.companyName ? ` at ${data.companyName}` : ''}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; vertical-align: top;">Date:</td>
                    <td style="color: #333; font-weight: 600;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; vertical-align: top;">Time:</td>
                    <td style="color: #333; font-weight: 600;">${formattedTime}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; vertical-align: top;">Duration:</td>
                    <td style="color: #333; font-weight: 600;">${data.interviewDuration} minutes</td>
                  </tr>
                  <tr>
                    <td style="color: #666; vertical-align: top;">Type:</td>
                    <td style="color: #333; font-weight: 600;">${data.interviewType}</td>
                  </tr>
                  ${data.location ? `
                  <tr>
                    <td style="color: #666; vertical-align: top;">Location:</td>
                    <td style="color: #333; font-weight: 600;">${data.location}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              ${data.meetingLink ? `
              <!-- Meeting Link Button -->
              <div style="text-align: center; margin: 25px 0;">
                <a href="${data.meetingLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  🔗 Save Meeting Link
                </a>
              </div>
              ` : ''}
              
              <!-- Preparation Checklist -->
              <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #f57c00; margin: 0 0 10px 0;">📝 Preparation Checklist</h4>
                <ul style="color: #666; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Review the candidate's resume and application materials</li>
                  <li>Prepare your interview questions based on the role requirements</li>
                  <li>Test your audio/video equipment (for video interviews)</li>
                  <li>Find a quiet, well-lit space for the interview</li>
                  <li>Have the feedback form ready to take notes</li>
                  <li>Review the job description and key requirements</li>
                  <li>Prepare examples of team culture and company values to share</li>
                </ul>
              </div>
              
              ${data.notes ? `
              <!-- Interview Notes -->
              <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #1976d2; margin: 0 0 10px 0;">📌 Notes from Recruiter</h4>
                <p style="color: #666; margin: 0; line-height: 1.6;">${data.notes}</p>
              </div>
              ` : ''}
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                We'll send you another reminder 1 hour before the interview. Good luck!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                HotGigs - AI-Powered Recruitment Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Generate 1-hour reminder email for panelists
 */
export function generate1HourReminderEmail(data: PanelistReminderData): { subject: string; html: string } {
  const formattedTime = data.interviewDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `🚨 Interview in 1 Hour: ${data.candidateName} for ${data.jobTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Starting Soon</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f44336 0%, #e91e63 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🚨 Starting in 1 Hour!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Interview at ${formattedTime}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${data.panelistName || 'there'},
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Your interview with <strong>${data.candidateName}</strong> for the <strong>${data.jobTitle}</strong> position starts in <strong>1 hour</strong>.
              </p>
              
              ${data.meetingLink ? `
              <!-- Join Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.meetingLink}" style="display: inline-block; background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 8px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);">
                  🎥 Join Interview
                </a>
              </div>
              ` : ''}
              
              <!-- Quick Checklist -->
              <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h4 style="color: #2e7d32; margin: 0 0 15px 0;">✅ Last-Minute Checklist</h4>
                <ul style="color: #333; margin: 0; padding-left: 20px; line-height: 2;">
                  <li>Close unnecessary browser tabs and applications</li>
                  <li>Test your microphone and camera</li>
                  <li>Have a glass of water nearby</li>
                  <li>Put your phone on silent</li>
                  <li>Have the feedback form open and ready</li>
                </ul>
              </div>
              
              <!-- Interview Summary -->
              <div style="background-color: #f5f5f5; border-radius: 8px; padding: 15px 20px; margin: 20px 0;">
                <table width="100%" cellpadding="5" cellspacing="0">
                  <tr>
                    <td style="color: #666; width: 100px;">Candidate:</td>
                    <td style="color: #333; font-weight: 600;">${data.candidateName}</td>
                  </tr>
                  <tr>
                    <td style="color: #666;">Position:</td>
                    <td style="color: #333; font-weight: 600;">${data.jobTitle}</td>
                  </tr>
                  <tr>
                    <td style="color: #666;">Duration:</td>
                    <td style="color: #333; font-weight: 600;">${data.interviewDuration} minutes</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                🌟 You've got this! Good luck with the interview.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                HotGigs - AI-Powered Recruitment Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}
