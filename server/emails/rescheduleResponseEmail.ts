// Email templates for notifying panelists about reschedule request responses

export function generateRescheduleApprovedEmail(data: {
  panelistName: string;
  candidateName: string;
  jobTitle: string;
  originalDate: string;
  notes?: string;
}): { subject: string; html: string; text: string } {
  const subject = `✅ Your Reschedule Request Has Been Approved - ${data.jobTitle}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">✅ Reschedule Request Approved</h1>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.panelistName},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">Great news! Your request to reschedule the interview has been <strong style="color: #22c55e;">approved</strong>.</p>
        
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px;">Interview Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 140px;">Position:</td>
              <td style="padding: 8px 0; font-weight: 500;">${data.jobTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Candidate:</td>
              <td style="padding: 8px 0; font-weight: 500;">${data.candidateName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Original Date:</td>
              <td style="padding: 8px 0; font-weight: 500;">${data.originalDate}</td>
            </tr>
          </table>
        </div>
        
        ${data.notes ? `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #166534;"><strong>Note from recruiter:</strong> ${data.notes}</p>
        </div>
        ` : ''}
        
        <p style="font-size: 16px; margin-top: 20px;">The recruiter will contact you shortly with the new interview time. Please keep an eye on your inbox for the updated schedule.</p>
        
        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">Thank you for your flexibility!</p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
        <p>This is an automated message from HotGigs Recruitment Platform</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Reschedule Request Approved

Hi ${data.panelistName},

Great news! Your request to reschedule the interview has been approved.

Interview Details:
- Position: ${data.jobTitle}
- Candidate: ${data.candidateName}
- Original Date: ${data.originalDate}

${data.notes ? `Note from recruiter: ${data.notes}` : ''}

The recruiter will contact you shortly with the new interview time. Please keep an eye on your inbox for the updated schedule.

Thank you for your flexibility!

---
This is an automated message from HotGigs Recruitment Platform
  `;

  return { subject, html, text };
}

export function generateRescheduleRejectedEmail(data: {
  panelistName: string;
  candidateName: string;
  jobTitle: string;
  originalDate: string;
  notes?: string;
}): { subject: string; html: string; text: string } {
  const subject = `❌ Reschedule Request Not Approved - ${data.jobTitle}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">❌ Reschedule Request Not Approved</h1>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.panelistName},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">Unfortunately, your request to reschedule the interview could not be approved at this time.</p>
        
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px;">Interview Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 140px;">Position:</td>
              <td style="padding: 8px 0; font-weight: 500;">${data.jobTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Candidate:</td>
              <td style="padding: 8px 0; font-weight: 500;">${data.candidateName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Scheduled Date:</td>
              <td style="padding: 8px 0; font-weight: 500;">${data.originalDate}</td>
            </tr>
          </table>
        </div>
        
        ${data.notes ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Reason:</strong> ${data.notes}</p>
        </div>
        ` : ''}
        
        <p style="font-size: 16px; margin-top: 20px;">Please plan to attend the interview at the originally scheduled time. If you have any concerns, please contact the recruiter directly.</p>
        
        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">Thank you for your understanding.</p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
        <p>This is an automated message from HotGigs Recruitment Platform</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Reschedule Request Not Approved

Hi ${data.panelistName},

Unfortunately, your request to reschedule the interview could not be approved at this time.

Interview Details:
- Position: ${data.jobTitle}
- Candidate: ${data.candidateName}
- Scheduled Date: ${data.originalDate}

${data.notes ? `Reason: ${data.notes}` : ''}

Please plan to attend the interview at the originally scheduled time. If you have any concerns, please contact the recruiter directly.

Thank you for your understanding.

---
This is an automated message from HotGigs Recruitment Platform
  `;

  return { subject, html, text };
}

export function generateAlternativeProposedEmail(data: {
  panelistName: string;
  candidateName: string;
  jobTitle: string;
  originalDate: string;
  proposedDate: string;
  notes?: string;
  rescheduleRequestId?: number;
  confirmUrl?: string;
  declineUrl?: string;
}): { subject: string; html: string; text: string } {
  const subject = `📅 Alternative Interview Time Proposed - ${data.jobTitle}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📅 Alternative Time Proposed</h1>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.panelistName},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">The recruiter has reviewed your reschedule request and would like to propose an alternative time for the interview.</p>
        
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px;">Interview Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 140px;">Position:</td>
              <td style="padding: 8px 0; font-weight: 500;">${data.jobTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Candidate:</td>
              <td style="padding: 8px 0; font-weight: 500;">${data.candidateName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Original Date:</td>
              <td style="padding: 8px 0; text-decoration: line-through; color: #94a3b8;">${data.originalDate}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #1e40af;">Proposed New Time:</p>
          <p style="margin: 0; font-size: 20px; font-weight: 600; color: #1e40af;">${data.proposedDate}</p>
        </div>
        
        ${data.notes ? `
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #0369a1;"><strong>Note from recruiter:</strong> ${data.notes}</p>
        </div>
        ` : ''}
        
        ${data.confirmUrl && data.declineUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 14px; color: #64748b; margin-bottom: 15px;">Does this time work for you?</p>
          <a href="${data.confirmUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 0 10px;">✓ Confirm</a>
          <a href="${data.declineUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 0 10px;">✗ Decline</a>
        </div>
        ` : `
        <p style="font-size: 16px; margin-top: 20px;">Please confirm if this new time works for you by responding to this email or contacting the recruiter directly.</p>
        `}
        
        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">Thank you for your cooperation!</p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
        <p>This is an automated message from HotGigs Recruitment Platform</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Alternative Interview Time Proposed

Hi ${data.panelistName},

The recruiter has reviewed your reschedule request and would like to propose an alternative time for the interview.

Interview Details:
- Position: ${data.jobTitle}
- Candidate: ${data.candidateName}
- Original Date: ${data.originalDate}

PROPOSED NEW TIME: ${data.proposedDate}

${data.notes ? `Note from recruiter: ${data.notes}` : ''}

Please confirm if this new time works for you:
${data.confirmUrl ? `- To CONFIRM: ${data.confirmUrl}` : ''}
${data.declineUrl ? `- To DECLINE: ${data.declineUrl}` : ''}

Or respond to this email or contact the recruiter directly.

Thank you for your cooperation!

---
This is an automated message from HotGigs Recruitment Platform
  `;

  return { subject, html, text };
}
