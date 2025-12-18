/**
 * Comprehensive Email Templates for Recruitment
 * Pre-built templates for all recruitment scenarios
 */

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'job' | 'interview' | 'offer' | 'onboarding' | 'general';
  subject: string;
  html: string;
  variables: string[];
}

// ==================== JOB SHARING TEMPLATES ====================

export const jobSharingTemplate: EmailTemplate = {
  id: 'job-sharing',
  name: 'Job Opportunity Sharing',
  category: 'job',
  subject: 'Exciting Opportunity: {{jobTitle}} at {{companyName}}',
  variables: ['recipientName', 'jobTitle', 'companyName', 'location', 'salary', 'jobDescription', 'applyLink', 'recruiterName', 'recruiterEmail'],
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🔥 New Opportunity</h1>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px;">Hi {{recipientName}},</p>
    
    <p>I came across your profile and thought you'd be a great fit for an exciting opportunity!</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3B82F6;">
      <h2 style="margin: 0 0 10px 0; color: #1e40af;">{{jobTitle}}</h2>
      <p style="margin: 5px 0; color: #64748b;"><strong>Company:</strong> {{companyName}}</p>
      <p style="margin: 5px 0; color: #64748b;"><strong>Location:</strong> {{location}}</p>
      <p style="margin: 5px 0; color: #64748b;"><strong>Salary:</strong> {{salary}}</p>
    </div>
    
    <h3 style="color: #1e40af;">About the Role</h3>
    <p>{{jobDescription}}</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{applyLink}}" style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Apply Now</a>
    </div>
    
    <p>If you're interested or know someone who might be, feel free to reach out!</p>
    
    <p style="margin-top: 30px;">
      Best regards,<br>
      <strong>{{recruiterName}}</strong><br>
      <a href="mailto:{{recruiterEmail}}" style="color: #3B82F6;">{{recruiterEmail}}</a>
    </p>
  </div>
  
  <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
    Powered by HotGigs - AI-Powered Recruitment Platform
  </p>
</body>
</html>
  `,
};

// ==================== INTERVIEW TEMPLATES ====================

export const interviewScheduleTemplate: EmailTemplate = {
  id: 'interview-schedule',
  name: 'Interview Scheduled',
  category: 'interview',
  subject: 'Interview Scheduled: {{jobTitle}} at {{companyName}}',
  variables: ['candidateName', 'jobTitle', 'companyName', 'interviewDate', 'interviewTime', 'interviewType', 'meetingLink', 'location', 'duration', 'interviewerName', 'notes', 'recruiterName'],
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📅 Interview Scheduled</h1>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px;">Hi {{candidateName}},</p>
    
    <p>Great news! Your interview has been scheduled for the <strong>{{jobTitle}}</strong> position at <strong>{{companyName}}</strong>.</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10B981;">
      <h3 style="margin: 0 0 15px 0; color: #059669;">Interview Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; width: 120px;">📅 Date:</td>
          <td style="padding: 8px 0; font-weight: bold;">{{interviewDate}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">⏰ Time:</td>
          <td style="padding: 8px 0; font-weight: bold;">{{interviewTime}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">⏱️ Duration:</td>
          <td style="padding: 8px 0; font-weight: bold;">{{duration}} minutes</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">📍 Type:</td>
          <td style="padding: 8px 0; font-weight: bold;">{{interviewType}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">👤 With:</td>
          <td style="padding: 8px 0; font-weight: bold;">{{interviewerName}}</td>
        </tr>
      </table>
    </div>
    
    {{#if meetingLink}}
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{meetingLink}}" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Join Meeting</a>
    </div>
    {{/if}}
    
    {{#if location}}
    <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>📍 Location:</strong> {{location}}</p>
    </div>
    {{/if}}
    
    {{#if notes}}
    <div style="background: #e0f2fe; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>📝 Notes:</strong> {{notes}}</p>
    </div>
    {{/if}}
    
    <h3 style="color: #059669;">Tips for Success</h3>
    <ul style="color: #64748b;">
      <li>Test your video/audio setup 10 minutes before</li>
      <li>Have a copy of your resume handy</li>
      <li>Prepare questions about the role and company</li>
      <li>Find a quiet, well-lit space</li>
    </ul>
    
    <p style="margin-top: 30px;">
      Good luck! 🍀<br>
      <strong>{{recruiterName}}</strong>
    </p>
  </div>
</body>
</html>
  `,
};

export const interviewReminderTemplate: EmailTemplate = {
  id: 'interview-reminder',
  name: 'Interview Reminder',
  category: 'interview',
  subject: 'Reminder: Interview Tomorrow for {{jobTitle}}',
  variables: ['candidateName', 'jobTitle', 'companyName', 'interviewDate', 'interviewTime', 'meetingLink', 'recruiterName'],
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Interview Reminder</h1>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px;">Hi {{candidateName}},</p>
    
    <p>This is a friendly reminder about your upcoming interview!</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #F59E0B; text-align: center;">
      <h2 style="margin: 0; color: #D97706;">{{jobTitle}}</h2>
      <p style="margin: 10px 0 0 0; color: #64748b;">at {{companyName}}</p>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0;">{{interviewDate}} at {{interviewTime}}</p>
    </div>
    
    {{#if meetingLink}}
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{meetingLink}}" style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Join Meeting</a>
    </div>
    {{/if}}
    
    <p>We're looking forward to speaking with you!</p>
    
    <p style="margin-top: 30px;">
      Best,<br>
      <strong>{{recruiterName}}</strong>
    </p>
  </div>
</body>
</html>
  `,
};

// ==================== OFFER TEMPLATES ====================

export const offerLetterTemplate: EmailTemplate = {
  id: 'offer-letter',
  name: 'Job Offer Letter',
  category: 'offer',
  subject: 'Congratulations! Job Offer for {{jobTitle}} at {{companyName}}',
  variables: ['candidateName', 'jobTitle', 'companyName', 'salary', 'startDate', 'benefits', 'offerDeadline', 'acceptLink', 'recruiterName', 'recruiterTitle'],
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Congratulations!</h1>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px;">Dear {{candidateName}},</p>
    
    <p>We are thrilled to extend an offer for you to join <strong>{{companyName}}</strong> as a <strong>{{jobTitle}}</strong>!</p>
    
    <p>After careful consideration, we believe your skills, experience, and passion make you an excellent fit for our team.</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #8B5CF6;">
      <h3 style="margin: 0 0 15px 0; color: #7C3AED;">Offer Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; width: 140px;">Position:</td>
          <td style="padding: 8px 0; font-weight: bold;">{{jobTitle}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Compensation:</td>
          <td style="padding: 8px 0; font-weight: bold;">{{salary}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Start Date:</td>
          <td style="padding: 8px 0; font-weight: bold;">{{startDate}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Response By:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #DC2626;">{{offerDeadline}}</td>
        </tr>
      </table>
    </div>
    
    {{#if benefits}}
    <h3 style="color: #7C3AED;">Benefits Package</h3>
    <p>{{benefits}}</p>
    {{/if}}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{acceptLink}}" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 5px;">Accept Offer</a>
    </div>
    
    <p>Please respond by <strong>{{offerDeadline}}</strong> to confirm your acceptance. If you have any questions, don't hesitate to reach out.</p>
    
    <p>We're excited about the possibility of having you on our team!</p>
    
    <p style="margin-top: 30px;">
      Warm regards,<br>
      <strong>{{recruiterName}}</strong><br>
      {{recruiterTitle}}<br>
      {{companyName}}
    </p>
  </div>
</body>
</html>
  `,
};

export const offerAcceptanceTemplate: EmailTemplate = {
  id: 'offer-acceptance',
  name: 'Offer Acceptance Confirmation',
  category: 'offer',
  subject: 'Welcome to {{companyName}}! Offer Accepted',
  variables: ['candidateName', 'jobTitle', 'companyName', 'startDate', 'onboardingLink', 'contactPerson', 'contactEmail', 'recruiterName'],
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎊 Welcome to the Team!</h1>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px;">Dear {{candidateName}},</p>
    
    <p>We're delighted to confirm that you've accepted our offer to join <strong>{{companyName}}</strong> as a <strong>{{jobTitle}}</strong>!</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; border: 2px solid #10B981;">
      <p style="font-size: 18px; margin: 0;">Your start date is</p>
      <p style="font-size: 28px; font-weight: bold; color: #059669; margin: 10px 0;">{{startDate}}</p>
    </div>
    
    <h3 style="color: #059669;">What's Next?</h3>
    <ol style="color: #64748b;">
      <li>Complete your onboarding paperwork</li>
      <li>Review the employee handbook</li>
      <li>Set up your accounts and equipment</li>
      <li>Meet your team on your first day!</li>
    </ol>
    
    {{#if onboardingLink}}
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{onboardingLink}}" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Start Onboarding</a>
    </div>
    {{/if}}
    
    <div style="background: #e0f2fe; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Questions?</strong> Contact {{contactPerson}} at <a href="mailto:{{contactEmail}}" style="color: #3B82F6;">{{contactEmail}}</a></p>
    </div>
    
    <p>We can't wait to have you on board!</p>
    
    <p style="margin-top: 30px;">
      Welcome aboard! 🚀<br>
      <strong>{{recruiterName}}</strong><br>
      {{companyName}}
    </p>
  </div>
</body>
</html>
  `,
};

export const offerRejectionTemplate: EmailTemplate = {
  id: 'offer-rejection',
  name: 'Offer Declined Response',
  category: 'offer',
  subject: 'Thank You for Your Consideration - {{companyName}}',
  variables: ['candidateName', 'jobTitle', 'companyName', 'recruiterName'],
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Thank You</h1>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px;">Dear {{candidateName}},</p>
    
    <p>Thank you for letting us know about your decision regarding the <strong>{{jobTitle}}</strong> position at <strong>{{companyName}}</strong>.</p>
    
    <p>While we're disappointed that you won't be joining our team, we completely understand and respect your decision. We wish you all the best in your future endeavors.</p>
    
    <p>Should your circumstances change or if you'd like to explore other opportunities with us in the future, please don't hesitate to reach out. We'd be happy to reconnect.</p>
    
    <p>Thank you for considering {{companyName}}, and we wish you continued success in your career!</p>
    
    <p style="margin-top: 30px;">
      Best wishes,<br>
      <strong>{{recruiterName}}</strong><br>
      {{companyName}}
    </p>
  </div>
</body>
</html>
  `,
};

// ==================== ONBOARDING TEMPLATES ====================

export const welcomeEmailTemplate: EmailTemplate = {
  id: 'welcome-email',
  name: 'New Employee Welcome',
  category: 'onboarding',
  subject: 'Welcome to {{companyName}}, {{candidateName}}! 🎉',
  variables: ['candidateName', 'jobTitle', 'companyName', 'startDate', 'managerName', 'teamName', 'officeLocation', 'firstDaySchedule', 'recruiterName'],
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 40px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to {{companyName}}!</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">We're excited to have you join us</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px;">Dear {{candidateName}},</p>
    
    <p>On behalf of everyone at <strong>{{companyName}}</strong>, welcome to the team! We're thrilled to have you join us as our new <strong>{{jobTitle}}</strong>.</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3B82F6;">
      <h3 style="margin: 0 0 15px 0; color: #1e40af;">Your First Day Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; width: 120px;">📅 Date:</td>
          <td style="padding: 8px 0; font-weight: bold;">{{startDate}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">📍 Location:</td>
          <td style="padding: 8px 0; font-weight: bold;">{{officeLocation}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">👤 Manager:</td>
          <td style="padding: 8px 0; font-weight: bold;">{{managerName}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">👥 Team:</td>
          <td style="padding: 8px 0; font-weight: bold;">{{teamName}}</td>
        </tr>
      </table>
    </div>
    
    {{#if firstDaySchedule}}
    <h3 style="color: #1e40af;">First Day Schedule</h3>
    <p>{{firstDaySchedule}}</p>
    {{/if}}
    
    <h3 style="color: #1e40af;">What to Bring</h3>
    <ul style="color: #64748b;">
      <li>Government-issued ID</li>
      <li>Banking information for direct deposit</li>
      <li>Any completed onboarding paperwork</li>
      <li>A great attitude! 😊</li>
    </ul>
    
    <p>If you have any questions before your start date, please don't hesitate to reach out.</p>
    
    <p style="margin-top: 30px;">
      See you soon! 🚀<br>
      <strong>{{recruiterName}}</strong><br>
      {{companyName}}
    </p>
  </div>
</body>
</html>
  `,
};

// ==================== GENERAL TEMPLATES ====================

export const recruiterSignupWelcomeTemplate: EmailTemplate = {
  id: 'recruiter-signup-welcome',
  name: 'Recruiter Signup Welcome',
  category: 'general',
  subject: 'Welcome to HotGigs, {{recruiterName}}! 🔥',
  variables: ['recruiterName', 'companyName', 'dashboardLink', 'supportEmail'],
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #EF4444 0%, #F97316 100%); padding: 40px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🔥 Welcome to HotGigs!</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">AI-Powered Recruitment Platform</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px;">Hi {{recruiterName}},</p>
    
    <p>Welcome to HotGigs! We're excited to have you on board. Your account has been successfully created{{#if companyName}} for <strong>{{companyName}}</strong>{{/if}}.</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #EF4444;">Getting Started</h3>
      <ol style="color: #64748b; padding-left: 20px;">
        <li style="margin-bottom: 10px;"><strong>Complete your profile</strong> - Add your company details and bio</li>
        <li style="margin-bottom: 10px;"><strong>Post your first job</strong> - Use AI to generate compelling descriptions</li>
        <li style="margin-bottom: 10px;"><strong>Discover AI matching</strong> - Find the best candidates automatically</li>
        <li style="margin-bottom: 10px;"><strong>Schedule interviews</strong> - With video conferencing built-in</li>
      </ol>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboardLink}}" style="background: linear-gradient(135deg, #EF4444 0%, #F97316 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
    </div>
    
    <h3 style="color: #EF4444;">Key Features</h3>
    <ul style="color: #64748b;">
      <li>🤖 AI-powered candidate matching</li>
      <li>📹 Built-in video interviews</li>
      <li>📊 Analytics and insights</li>
      <li>📧 Email campaign tools</li>
      <li>📅 Calendar integration</li>
    </ul>
    
    <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Need help?</strong> Contact us at <a href="mailto:{{supportEmail}}" style="color: #D97706;">{{supportEmail}}</a></p>
    </div>
    
    <p>Happy recruiting! 🎯</p>
    
    <p style="margin-top: 30px;">
      The HotGigs Team
    </p>
  </div>
</body>
</html>
  `,
};

export const applicationReceivedTemplate: EmailTemplate = {
  id: 'application-received',
  name: 'Application Received',
  category: 'general',
  subject: 'Application Received: {{jobTitle}} at {{companyName}}',
  variables: ['candidateName', 'jobTitle', 'companyName', 'applicationDate', 'nextSteps', 'recruiterName'],
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">✅ Application Received</h1>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px;">Hi {{candidateName}},</p>
    
    <p>Thank you for applying to the <strong>{{jobTitle}}</strong> position at <strong>{{companyName}}</strong>!</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3B82F6;">
      <p style="margin: 0; color: #64748b;">Application submitted on</p>
      <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">{{applicationDate}}</p>
    </div>
    
    <p>We've received your application and our team is reviewing it. We'll be in touch soon with next steps.</p>
    
    {{#if nextSteps}}
    <h3 style="color: #1D4ED8;">What's Next?</h3>
    <p>{{nextSteps}}</p>
    {{/if}}
    
    <p>In the meantime, feel free to explore other opportunities on our platform.</p>
    
    <p style="margin-top: 30px;">
      Best regards,<br>
      <strong>{{recruiterName}}</strong><br>
      {{companyName}}
    </p>
  </div>
</body>
</html>
  `,
};

export const rejectionTemplate: EmailTemplate = {
  id: 'application-rejection',
  name: 'Application Rejection',
  category: 'general',
  subject: 'Update on Your Application - {{jobTitle}} at {{companyName}}',
  variables: ['candidateName', 'jobTitle', 'companyName', 'feedback', 'recruiterName'],
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Application Update</h1>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px;">Dear {{candidateName}},</p>
    
    <p>Thank you for your interest in the <strong>{{jobTitle}}</strong> position at <strong>{{companyName}}</strong> and for taking the time to apply.</p>
    
    <p>After careful consideration, we've decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
    
    {{#if feedback}}
    <div style="background: #e0f2fe; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Feedback:</strong> {{feedback}}</p>
    </div>
    {{/if}}
    
    <p>This decision was not easy, as we received many strong applications. We encourage you to apply for future positions that match your skills and experience.</p>
    
    <p>We wish you the best in your job search and future career endeavors.</p>
    
    <p style="margin-top: 30px;">
      Best regards,<br>
      <strong>{{recruiterName}}</strong><br>
      {{companyName}}
    </p>
  </div>
</body>
</html>
  `,
};

// Export all templates as a collection
export const allEmailTemplates: EmailTemplate[] = [
  jobSharingTemplate,
  interviewScheduleTemplate,
  interviewReminderTemplate,
  offerLetterTemplate,
  offerAcceptanceTemplate,
  offerRejectionTemplate,
  welcomeEmailTemplate,
  recruiterSignupWelcomeTemplate,
  applicationReceivedTemplate,
  rejectionTemplate,
];

// Helper function to get template by ID
export function getEmailTemplateById(id: string): EmailTemplate | undefined {
  return allEmailTemplates.find(t => t.id === id);
}

// Helper function to get templates by category
export function getEmailTemplatesByCategory(category: EmailTemplate['category']): EmailTemplate[] {
  return allEmailTemplates.filter(t => t.category === category);
}

// Helper function to fill template variables
export function fillEmailTemplate(template: EmailTemplate, variables: Record<string, string>): { subject: string; html: string } {
  let subject = template.subject;
  let html = template.html;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, value);
    html = html.replace(regex, value);
  }
  
  // Handle conditional blocks (simple implementation)
  html = html.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
    return variables[varName] ? content : '';
  });
  
  return { subject, html };
}
