/**
 * Email templates for application stage transitions
 */

export interface StageTransitionEmailData {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  currentStage: string;
  nextSteps?: string;
  interviewDate?: string;
  interviewTime?: string;
  meetingLink?: string;
  recruiterName?: string;
  recruiterEmail?: string;
}

/**
 * Generate HTML email for submitted stage
 */
export function generateSubmittedEmail(data: StageTransitionEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Submitted</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with gradient -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Application Submitted ✅</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
        Hi <strong>${data.candidateName}</strong>,
      </p>
      
      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
        Thank you for applying to the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>!
      </p>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #667eea; font-size: 18px;">📋 What Happens Next?</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: #555555; line-height: 1.8;">
          <li>Our recruitment team will review your application</li>
          <li>We'll assess your qualifications against the job requirements</li>
          <li>You'll hear from us within 5-7 business days</li>
          <li>Check your email regularly for updates</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.VITE_FRONTEND_URL || 'https://hotgigs.com'}/my-applications" 
           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
          View Application Status
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666666; line-height: 1.6; margin-top: 30px;">
        Best regards,<br>
        <strong>${data.recruiterName || 'The Recruitment Team'}</strong><br>
        ${data.companyName}
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 12px; color: #999999; margin: 0;">
        © 2024 HotGigs. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate HTML email for reviewing stage
 */
export function generateReviewingEmail(data: StageTransitionEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Application Under Review</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Application Under Review 🔍</h1>
    </div>
    
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
        Hi <strong>${data.candidateName}</strong>,
      </p>
      
      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
        Great news! Your application for <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong> is now under review by our recruitment team.
      </p>
      
      <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #2e7d32; font-size: 18px;">✨ Current Status</h3>
        <p style="margin: 0; color: #555555; line-height: 1.6;">
          Your profile and qualifications are being carefully evaluated. We're impressed with your background and want to learn more about your experience.
        </p>
      </div>
      
      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
        We'll be in touch soon with next steps. In the meantime, feel free to explore more opportunities on our platform.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.VITE_FRONTEND_URL || 'https://hotgigs.com'}/my-applications" 
           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Track Your Application
        </a>
      </div>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 12px; color: #999999; margin: 0;">
        © 2024 HotGigs. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate HTML email for shortlisted stage
 */
export function generateShortlistedEmail(data: StageTransitionEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>You've Been Shortlisted!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">You've Been Shortlisted! 🎉</h1>
    </div>
    
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
        Hi <strong>${data.candidateName}</strong>,
      </p>
      
      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
        Congratulations! You've been shortlisted for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>.
      </p>
      
      <div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #e65100; font-size: 18px;">🚀 What This Means</h3>
        <p style="margin: 0; color: #555555; line-height: 1.6;">
          You're among the top candidates! We believe your skills and experience are a great match for this role. Our team will reach out soon to schedule an interview.
        </p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">💡 Prepare for Success</h3>
        <ul style="margin: 0; padding-left: 20px; color: #555555; line-height: 1.8;">
          <li>Review the job description and requirements</li>
          <li>Research our company and culture</li>
          <li>Prepare examples of your relevant experience</li>
          <li>Think about questions you'd like to ask us</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.VITE_FRONTEND_URL || 'https://hotgigs.com'}/my-applications" 
           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
          View Application
        </a>
      </div>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 12px; color: #999999; margin: 0;">
        © 2024 HotGigs. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate HTML email for interview stage
 */
export function generateInterviewEmail(data: StageTransitionEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Interview Scheduled</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Interview Scheduled! 📅</h1>
    </div>
    
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
        Hi <strong>${data.candidateName}</strong>,
      </p>
      
      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
        Great news! We'd like to invite you for an interview for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>.
      </p>
      
      ${data.interviewDate && data.interviewTime ? `
      <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 15px 0; color: #1565c0; font-size: 18px;">📅 Interview Details</h3>
        <p style="margin: 5px 0; color: #555555;"><strong>Date:</strong> ${data.interviewDate}</p>
        <p style="margin: 5px 0; color: #555555;"><strong>Time:</strong> ${data.interviewTime}</p>
        ${data.meetingLink ? `<p style="margin: 5px 0; color: #555555;"><strong>Meeting Link:</strong> <a href="${data.meetingLink}" style="color: #2196f3;">${data.meetingLink}</a></p>` : ''}
      </div>
      ` : `
      <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="margin: 0; color: #555555; line-height: 1.6;">
          We'll send you the interview details shortly. Please check your email and application dashboard for updates.
        </p>
      </div>
      `}
      
      <div style="background-color: #f8f9fa; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">✅ Before the Interview</h3>
        <ul style="margin: 0; padding-left: 20px; color: #555555; line-height: 1.8;">
          <li>Test your internet connection and audio/video setup</li>
          <li>Review your resume and the job description</li>
          <li>Prepare questions about the role and company</li>
          <li>Arrive 5 minutes early (or join the call early)</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.VITE_FRONTEND_URL || 'https://hotgigs.com'}/my-applications" 
           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
          View Interview Details
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666666; line-height: 1.6; margin-top: 30px;">
        If you have any questions or need to reschedule, please contact ${data.recruiterEmail || 'our recruitment team'}.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 12px; color: #999999; margin: 0;">
        © 2024 HotGigs. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate HTML email for offer stage
 */
export function generateOfferEmail(data: StageTransitionEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Job Offer!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Congratulations! 🎊</h1>
    </div>
    
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
        Hi <strong>${data.candidateName}</strong>,
      </p>
      
      <p style="font-size: 18px; color: #333333; line-height: 1.6; margin-bottom: 20px; font-weight: 600;">
        We're thrilled to offer you the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>!
      </p>
      
      <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #2e7d32; font-size: 18px;">🎉 You Did It!</h3>
        <p style="margin: 0; color: #555555; line-height: 1.6;">
          After careful consideration, we believe you're the perfect fit for our team. We're excited to have you join us!
        </p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">📋 Next Steps</h3>
        <ul style="margin: 0; padding-left: 20px; color: #555555; line-height: 1.8;">
          <li>Review the formal offer letter (attached or coming soon)</li>
          <li>Our HR team will contact you with details</li>
          <li>Complete any required background checks or paperwork</li>
          <li>Discuss your start date and onboarding schedule</li>
        </ul>
      </div>
      
      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
        Please review the offer carefully and let us know if you have any questions. We're here to help make this transition as smooth as possible.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.VITE_FRONTEND_URL || 'https://hotgigs.com'}/my-applications" 
           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
          View Offer Details
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666666; line-height: 1.6; margin-top: 30px;">
        We look forward to welcoming you to the team!<br><br>
        Best regards,<br>
        <strong>${data.recruiterName || 'The Recruitment Team'}</strong><br>
        ${data.companyName}
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 12px; color: #999999; margin: 0;">
        © 2024 HotGigs. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate HTML email for hired stage
 */
export function generateHiredEmail(data: StageTransitionEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Welcome to the Team!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Welcome to the Team! 🎊</h1>
    </div>
    
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
        Hi <strong>${data.candidateName}</strong>,
      </p>
      
      <p style="font-size: 18px; color: #333333; line-height: 1.6; margin-bottom: 20px; font-weight: 600;">
        Welcome to <strong>${data.companyName}</strong>! We're excited to have you on board as our new <strong>${data.jobTitle}</strong>.
      </p>
      
      <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #2e7d32; font-size: 18px;">🚀 Your Journey Begins</h3>
        <p style="margin: 0; color: #555555; line-height: 1.6;">
          You're now part of our team! We're committed to supporting your growth and success from day one.
        </p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">📋 Before Your First Day</h3>
        <ul style="margin: 0; padding-left: 20px; color: #555555; line-height: 1.8;">
          <li>Complete any pending paperwork and documentation</li>
          <li>Review your onboarding schedule and materials</li>
          <li>Set up your work accounts and access credentials</li>
          <li>Prepare any questions for your first day</li>
        </ul>
      </div>
      
      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
        Our HR team will be in touch with all the details you need for your first day. If you have any questions in the meantime, don't hesitate to reach out.
      </p>
      
      <p style="font-size: 14px; color: #666666; line-height: 1.6; margin-top: 30px;">
        We're thrilled to have you join us!<br><br>
        Best regards,<br>
        <strong>${data.recruiterName || 'The Team'}</strong><br>
        ${data.companyName}
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 12px; color: #999999; margin: 0;">
        © 2024 HotGigs. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate HTML email for rejected stage
 */
export function generateRejectedEmail(data: StageTransitionEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Application Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Application Update</h1>
    </div>
    
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
        Hi <strong>${data.candidateName}</strong>,
      </p>
      
      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
        Thank you for your interest in the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong> and for taking the time to go through our interview process.
      </p>
      
      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
        After careful consideration, we've decided to move forward with other candidates whose experience more closely matches our current needs.
      </p>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #667eea; font-size: 18px;">💡 Keep Moving Forward</h3>
        <p style="margin: 0; color: #555555; line-height: 1.6;">
          We were impressed with your qualifications and encourage you to apply for other positions that match your skills. We'll keep your profile on file for future opportunities.
        </p>
      </div>
      
      <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px;">
        We wish you all the best in your job search and future career endeavors.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.VITE_FRONTEND_URL || 'https://hotgigs.com'}/jobs" 
           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Explore More Opportunities
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666666; line-height: 1.6; margin-top: 30px;">
        Best regards,<br>
        <strong>${data.recruiterName || 'The Recruitment Team'}</strong><br>
        ${data.companyName}
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 12px; color: #999999; margin: 0;">
        © 2024 HotGigs. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Get email template based on stage
 */
export function getStageEmailTemplate(stage: string, data: StageTransitionEmailData): { subject: string; html: string } {
  const templates: Record<string, { subject: string; template: (data: StageTransitionEmailData) => string }> = {
    submitted: {
      subject: `Application Received - ${data.jobTitle} at ${data.companyName}`,
      template: generateSubmittedEmail,
    },
    reviewing: {
      subject: `Your Application is Under Review - ${data.jobTitle}`,
      template: generateReviewingEmail,
    },
    shortlisted: {
      subject: `You've Been Shortlisted! - ${data.jobTitle} at ${data.companyName}`,
      template: generateShortlistedEmail,
    },
    interview: {
      subject: `Interview Scheduled - ${data.jobTitle} at ${data.companyName}`,
      template: generateInterviewEmail,
    },
    offered: {
      subject: `Job Offer - ${data.jobTitle} at ${data.companyName}`,
      template: generateOfferEmail,
    },
    hired: {
      subject: `Welcome to ${data.companyName}!`,
      template: generateHiredEmail,
    },
    rejected: {
      subject: `Application Update - ${data.jobTitle} at ${data.companyName}`,
      template: generateRejectedEmail,
    },
  };

  const config = templates[stage];
  if (!config) {
    throw new Error(`No email template found for stage: ${stage}`);
  }

  return {
    subject: config.subject,
    html: config.template(data),
  };
}
