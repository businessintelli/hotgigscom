// Email template for notifying candidates when their interview is rescheduled

export function generateInterviewRescheduledEmail(data: {
  candidateName: string;
  jobTitle: string;
  companyName?: string;
  originalDate: string;
  newDate: string;
  interviewType: string;
  meetingLink?: string;
  location?: string;
  recruiterName?: string;
  notes?: string;
}): { subject: string; html: string; text: string } {
  const subject = `📅 Interview Rescheduled - ${data.jobTitle}${data.companyName ? ` at ${data.companyName}` : ''}`;

  const interviewTypeLabel = {
    'video': '💻 Video Call',
    'phone': '📞 Phone Call',
    'in-person': '🏢 In-Person',
    'ai-interview': '🤖 AI Interview',
  }[data.interviewType] || data.interviewType;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📅 Interview Rescheduled</h1>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.candidateName},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">Your interview for <strong>${data.jobTitle}</strong>${data.companyName ? ` at <strong>${data.companyName}</strong>` : ''} has been rescheduled to a new time.</p>
        
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px;">Updated Interview Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 140px;">Position:</td>
              <td style="padding: 8px 0; font-weight: 500;">${data.jobTitle}</td>
            </tr>
            ${data.companyName ? `
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Company:</td>
              <td style="padding: 8px 0; font-weight: 500;">${data.companyName}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Interview Type:</td>
              <td style="padding: 8px 0; font-weight: 500;">${interviewTypeLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Original Time:</td>
              <td style="padding: 8px 0; text-decoration: line-through; color: #94a3b8;">${data.originalDate}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #1e40af; font-weight: 500;">✨ NEW INTERVIEW TIME</p>
          <p style="margin: 0; font-size: 22px; font-weight: 600; color: #1e40af;">${data.newDate}</p>
        </div>
        
        ${data.meetingLink ? `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #166534; font-weight: 500;">📹 Meeting Link:</p>
          <a href="${data.meetingLink}" style="color: #15803d; word-break: break-all;">${data.meetingLink}</a>
        </div>
        ` : ''}
        
        ${data.location ? `
        <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #92400e; font-weight: 500;">📍 Location:</p>
          <p style="margin: 0; color: #92400e;">${data.location}</p>
        </div>
        ` : ''}
        
        ${data.notes ? `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #475569; font-weight: 500;">📝 Additional Notes:</p>
          <p style="margin: 0; color: #475569;">${data.notes}</p>
        </div>
        ` : ''}
        
        <div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #854d0e;">
            <strong>💡 Tip:</strong> Please add this new time to your calendar and ensure you're available. If you have any conflicts, please contact ${data.recruiterName || 'the recruiter'} as soon as possible.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">We apologize for any inconvenience caused by this change. We look forward to speaking with you!</p>
        
        <p style="font-size: 14px; color: #64748b;">Best regards,<br/>${data.recruiterName || 'The Recruitment Team'}</p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
        <p>This is an automated message from HotGigs Recruitment Platform</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Interview Rescheduled

Hi ${data.candidateName},

Your interview for ${data.jobTitle}${data.companyName ? ` at ${data.companyName}` : ''} has been rescheduled to a new time.

Updated Interview Details:
- Position: ${data.jobTitle}
${data.companyName ? `- Company: ${data.companyName}` : ''}
- Interview Type: ${interviewTypeLabel}
- Original Time: ${data.originalDate} (cancelled)

✨ NEW INTERVIEW TIME: ${data.newDate}

${data.meetingLink ? `Meeting Link: ${data.meetingLink}` : ''}
${data.location ? `Location: ${data.location}` : ''}
${data.notes ? `Additional Notes: ${data.notes}` : ''}

Please add this new time to your calendar and ensure you're available. If you have any conflicts, please contact ${data.recruiterName || 'the recruiter'} as soon as possible.

We apologize for any inconvenience caused by this change. We look forward to speaking with you!

Best regards,
${data.recruiterName || 'The Recruitment Team'}

---
This is an automated message from HotGigs Recruitment Platform
  `;

  return { subject, html, text };
}
