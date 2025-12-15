/**
 * Candidate Interview Reminder Email Templates
 * Sends automated reminders to candidates 24 hours and 1 hour before interviews
 */

interface CandidateReminderData {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName?: string;
  recruiterName?: string;
  interviewDate: Date;
  interviewDuration: number;
  interviewType: string;
  meetingLink?: string;
  location?: string;
  notes?: string;
}

/**
 * Generate 24-hour reminder email for candidates
 */
export function generateCandidate24HourReminderEmail(data: CandidateReminderData): { subject: string; html: string } {
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

  const subject = `⏰ Interview Tomorrow: ${data.jobTitle}${data.companyName ? ` at ${data.companyName}` : ''}`;

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
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⏰ Interview Tomorrow!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 14px;">24-Hour Reminder</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${data.candidateName || 'there'},
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                This is a friendly reminder that you have an interview scheduled for <strong>tomorrow</strong>. We're excited to meet you!
              </p>
              
              <!-- Interview Details Card -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #86efac;">
                <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 18px;">📋 Interview Details</h3>
                <table width="100%" cellpadding="5" cellspacing="0">
                  <tr>
                    <td style="color: #666; width: 120px; vertical-align: top;">Position:</td>
                    <td style="color: #333; font-weight: 600;">${data.jobTitle}</td>
                  </tr>
                  ${data.companyName ? `
                  <tr>
                    <td style="color: #666; vertical-align: top;">Company:</td>
                    <td style="color: #333; font-weight: 600;">${data.companyName}</td>
                  </tr>
                  ` : ''}
                  ${data.recruiterName ? `
                  <tr>
                    <td style="color: #666; vertical-align: top;">Interviewer:</td>
                    <td style="color: #333; font-weight: 600;">${data.recruiterName}</td>
                  </tr>
                  ` : ''}
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
                    <td style="color: #333; font-weight: 600;">${data.interviewType === 'video' ? '🎥 Video Call' : data.interviewType === 'phone' ? '📞 Phone Call' : data.interviewType === 'in-person' ? '🏢 In-Person' : '🤖 AI Interview'}</td>
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
                <a href="${data.meetingLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  🔗 Save Meeting Link
                </a>
              </div>
              ` : ''}
              
              <!-- Preparation Tips -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #d97706; margin: 0 0 10px 0;">💡 Preparation Tips</h4>
                <ul style="color: #666; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Research the company and role thoroughly</li>
                  <li>Review your resume and be ready to discuss your experience</li>
                  <li>Prepare questions to ask the interviewer</li>
                  <li>Test your equipment (camera, microphone) for video interviews</li>
                  <li>Choose a quiet, well-lit location</li>
                  <li>Dress professionally</li>
                  <li>Have a copy of your resume handy</li>
                </ul>
              </div>
              
              ${data.notes ? `
              <!-- Additional Notes -->
              <div style="background-color: #e0f2fe; border-left: 4px solid #0ea5e9; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #0284c7; margin: 0 0 10px 0;">📌 Additional Information</h4>
                <p style="color: #666; margin: 0; line-height: 1.6;">${data.notes}</p>
              </div>
              ` : ''}
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                We'll send you another reminder 1 hour before the interview. Good luck! 🍀
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
 * Generate 1-hour reminder email for candidates
 */
export function generateCandidate1HourReminderEmail(data: CandidateReminderData): { subject: string; html: string } {
  const formattedTime = data.interviewDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `🚀 Interview in 1 Hour: ${data.jobTitle}${data.companyName ? ` at ${data.companyName}` : ''}`;

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
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🚀 Starting in 1 Hour!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Interview at ${formattedTime}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${data.candidateName || 'there'},
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Your interview for the <strong>${data.jobTitle}</strong> position${data.companyName ? ` at <strong>${data.companyName}</strong>` : ''} starts in <strong>1 hour</strong>!
              </p>
              
              ${data.meetingLink ? `
              <!-- Join Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.meetingLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 8px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                  🎥 Join Interview
                </a>
              </div>
              ` : ''}
              
              <!-- Last-Minute Checklist -->
              <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h4 style="color: #1d4ed8; margin: 0 0 15px 0;">✅ Final Checklist</h4>
                <ul style="color: #333; margin: 0; padding-left: 20px; line-height: 2;">
                  <li>Close unnecessary browser tabs and apps</li>
                  <li>Test your microphone and camera one more time</li>
                  <li>Have a glass of water nearby</li>
                  <li>Put your phone on silent</li>
                  <li>Take a few deep breaths and relax</li>
                </ul>
              </div>
              
              <!-- Interview Summary -->
              <div style="background-color: #f5f5f5; border-radius: 8px; padding: 15px 20px; margin: 20px 0;">
                <table width="100%" cellpadding="5" cellspacing="0">
                  <tr>
                    <td style="color: #666; width: 100px;">Position:</td>
                    <td style="color: #333; font-weight: 600;">${data.jobTitle}</td>
                  </tr>
                  ${data.companyName ? `
                  <tr>
                    <td style="color: #666;">Company:</td>
                    <td style="color: #333; font-weight: 600;">${data.companyName}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="color: #666;">Duration:</td>
                    <td style="color: #333; font-weight: 600;">${data.interviewDuration} minutes</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin: 25px 0; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px;">
                <p style="color: #92400e; font-size: 18px; margin: 0; font-weight: 600;">
                  🌟 You've got this! Be confident and be yourself.
                </p>
              </div>
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
