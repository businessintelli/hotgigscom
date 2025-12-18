/**
 * Reschedule Request Email Template
 * Sent to recruiters when a panelist requests to reschedule an interview
 */

interface RescheduleRequestEmailData {
  recruiterName: string;
  panelistName: string;
  panelistEmail: string;
  candidateName: string;
  jobTitle: string;
  originalDate: string;
  originalTime: string;
  reason: string;
  preferredTimes: string[];
  dashboardUrl: string;
}

export function generateRescheduleRequestEmail(data: RescheduleRequestEmailData): { subject: string; html: string; text: string } {
  const subject = `Interview Reschedule Request: ${data.candidateName} - ${data.jobTitle}`;

  const preferredTimesHtml = data.preferredTimes.length > 0
    ? `
      <div style="margin-top: 20px;">
        <h3 style="color: #1e293b; font-size: 16px; margin-bottom: 10px;">Suggested Alternative Times:</h3>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${data.preferredTimes.map((time, index) => `
            <li style="padding: 8px 12px; background-color: #f0fdf4; border-left: 3px solid #22c55e; margin-bottom: 8px; border-radius: 4px;">
              <strong>Option ${index + 1}:</strong> ${new Date(time).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </li>
          `).join('')}
        </ul>
      </div>
    `
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Interview Reschedule Request</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Hi ${data.recruiterName},
        </p>
        
        <p style="margin-bottom: 20px;">
          A panel member has requested to reschedule an upcoming interview. Please review the details below and take appropriate action.
        </p>
        
        <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px;">⚠️ Action Required</h3>
          <p style="margin: 0; color: #78350f;">
            Please respond to this reschedule request to ensure the interview proceeds smoothly.
          </p>
        </div>
        
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 15px 0;">Interview Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 140px;">Candidate:</td>
              <td style="padding: 8px 0; font-weight: 600;">${data.candidateName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Position:</td>
              <td style="padding: 8px 0; font-weight: 600;">${data.jobTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Original Date:</td>
              <td style="padding: 8px 0; font-weight: 600;">${data.originalDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Original Time:</td>
              <td style="padding: 8px 0; font-weight: 600;">${data.originalTime}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 15px 0;">Panel Member</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 140px;">Name:</td>
              <td style="padding: 8px 0; font-weight: 600;">${data.panelistName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Email:</td>
              <td style="padding: 8px 0;">
                <a href="mailto:${data.panelistEmail}" style="color: #3b82f6; text-decoration: none;">${data.panelistEmail}</a>
              </td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px 20px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
          <h3 style="color: #991b1b; font-size: 14px; margin: 0 0 8px 0;">Reason for Rescheduling:</h3>
          <p style="margin: 0; color: #7f1d1d;">${data.reason}</p>
        </div>
        
        ${preferredTimesHtml}
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${data.dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Manage Reschedule Requests
          </a>
        </div>
        
        <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
          You can approve, reject, or propose alternative times from your recruiter dashboard.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">This is an automated message from HotGigs Recruitment Platform</p>
        <p style="margin: 5px 0 0 0;">Please do not reply directly to this email</p>
      </div>
    </body>
    </html>
  `;

  const preferredTimesText = data.preferredTimes.length > 0
    ? `\nSuggested Alternative Times:\n${data.preferredTimes.map((time, index) => 
        `  ${index + 1}. ${new Date(time).toLocaleString()}`
      ).join('\n')}\n`
    : '';

  const text = `
Interview Reschedule Request

Hi ${data.recruiterName},

A panel member has requested to reschedule an upcoming interview.

INTERVIEW DETAILS
-----------------
Candidate: ${data.candidateName}
Position: ${data.jobTitle}
Original Date: ${data.originalDate}
Original Time: ${data.originalTime}

PANEL MEMBER
------------
Name: ${data.panelistName}
Email: ${data.panelistEmail}

REASON FOR RESCHEDULING
-----------------------
${data.reason}
${preferredTimesText}

Please visit your dashboard to manage this request:
${data.dashboardUrl}

---
This is an automated message from HotGigs Recruitment Platform
  `.trim();

  return { subject, html, text };
}
