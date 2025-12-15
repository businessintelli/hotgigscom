import { sendEmail } from "./emailService";

interface PanelInvitationEmailData {
  panelistEmail: string;
  panelistName?: string;
  recruiterName: string;
  candidateName: string;
  jobTitle: string;
  companyName?: string;
  interviewDate: Date;
  interviewDuration: number;
  interviewType: string;
  meetingLink?: string;
  location?: string;
  notes?: string;
  acceptUrl?: string;
  declineUrl?: string;
  rescheduleUrl?: string;
  feedbackUrl?: string;
}

export async function sendPanelInvitationEmail(data: PanelInvitationEmailData): Promise<boolean> {
  const formattedDate = data.interviewDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const formattedTime = data.interviewDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const interviewTypeLabel = {
    'video': 'Video Call',
    'phone': 'Phone Call',
    'in-person': 'In-Person',
    'ai-interview': 'AI Interview',
  }[data.interviewType] || data.interviewType;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Panel Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                🎯 Interview Panel Invitation
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                You've been invited to participate as an interviewer
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: white; padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi ${data.panelistName || 'there'},
              </p>
              
              <p style="margin: 0 0 25px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>${data.recruiterName}</strong> has invited you to join the interview panel for a candidate applying to the <strong>${data.jobTitle}</strong> position${data.companyName ? ` at <strong>${data.companyName}</strong>` : ''}.
              </p>
              
              <!-- Interview Details Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="background-color: #f8fafc; border-radius: 12px; padding: 25px;">
                    <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px; font-weight: 600;">
                      📋 Interview Details
                    </h3>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 120px;">Candidate:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${data.candidateName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Position:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${data.jobTitle}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Date:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Time:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${formattedTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Duration:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${data.interviewDuration} minutes</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Format:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${interviewTypeLabel}</td>
                      </tr>
                      ${data.meetingLink ? `
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Meeting Link:</td>
                        <td style="padding: 8px 0;">
                          <a href="${data.meetingLink}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">Join Meeting →</a>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.location ? `
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Location:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${data.location}</td>
                      </tr>
                      ` : ''}
                    </table>
                    
                    ${data.notes ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0; color: #64748b; font-size: 14px;"><strong>Notes:</strong></p>
                      <p style="margin: 5px 0 0 0; color: #374151; font-size: 14px;">${data.notes}</p>
                    </div>
                    ` : ''}
                  </td>
                </tr>
              </table>
              
              <!-- What's Expected -->
              <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px; font-weight: 600;">
                  ✨ What's Expected
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
                  <li>Join the interview at the scheduled time</li>
                  <li>Evaluate the candidate based on your expertise</li>
                  <li>Submit your feedback after the interview</li>
                  <li>Provide a hiring recommendation</li>
                </ul>
              </div>
              
              <!-- CTA Buttons -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <p style="margin: 0 0 15px 0; color: #64748b; font-size: 14px;">
                      Please respond to this invitation:
                    </p>
                    <table role="presentation" style="border-collapse: collapse;">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="${data.acceptUrl || '#'}" style="display: inline-block; background-color: #22c55e; color: white; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                            ✓ Accept
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="${data.rescheduleUrl || '#'}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                            🕐 Reschedule
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="${data.declineUrl || '#'}" style="display: inline-block; background-color: #ef4444; color: white; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                            ✗ Decline
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 20px 0 0 0; color: #64748b; font-size: 13px;">
                      After the interview, use this link to submit your feedback:
                    </p>
                    <a href="${data.feedbackUrl || '#'}" style="display: inline-block; margin-top: 10px; background-color: #8b5cf6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      📝 Submit Feedback (after interview)
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 25px 30px; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 13px;">
                This invitation was sent by HotGigs on behalf of ${data.recruiterName}.
              </p>
              <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 12px;">
                If you have questions, please contact the recruiter directly.
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

  const textContent = `
Interview Panel Invitation

Hi ${data.panelistName || 'there'},

${data.recruiterName} has invited you to join the interview panel for a candidate applying to the ${data.jobTitle} position${data.companyName ? ` at ${data.companyName}` : ''}.

INTERVIEW DETAILS:
- Candidate: ${data.candidateName}
- Position: ${data.jobTitle}
- Date: ${formattedDate}
- Time: ${formattedTime}
- Duration: ${data.interviewDuration} minutes
- Format: ${interviewTypeLabel}
${data.meetingLink ? `- Meeting Link: ${data.meetingLink}` : ''}
${data.location ? `- Location: ${data.location}` : ''}
${data.notes ? `- Notes: ${data.notes}` : ''}

WHAT'S EXPECTED:
- Join the interview at the scheduled time
- Evaluate the candidate based on your expertise
- Submit your feedback after the interview
- Provide a hiring recommendation

Please respond to this invitation by clicking the appropriate link in the HTML version of this email.

Best regards,
HotGigs Team
  `;

  try {
    await sendEmail({
      to: data.panelistEmail,
      subject: `Interview Panel Invitation: ${data.candidateName} for ${data.jobTitle}`,
      html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send panel invitation email:', error);
    return false;
  }
}
