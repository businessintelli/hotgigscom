import { getDb } from "../db";
import { users, candidates, profileReminders } from "../../drizzle/schema";
import { eq, and, lt, isNull } from "drizzle-orm";
import { sendEmail } from "../emailService";
import { calculateCandidateCompletion } from "../profileCompletionHelpers";

/**
 * Send profile completion reminder emails
 * This should be run as a scheduled job (daily)
 */
export async function sendProfileCompletionReminders(): Promise<{
  threeDay: number;
  sevenDay: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = {
    threeDay: 0,
    sevenDay: 0,
    errors: [] as string[],
  };

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    // Get all candidates with incomplete profiles
    const allCandidates = await db
      .select({
        userId: candidates.userId,
        candidateId: candidates.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
        candidate: candidates,
      })
      .from(candidates)
      .leftJoin(users, eq(candidates.userId, users.id))
      .where(eq(candidates.profileCompleted, false));

    for (const record of allCandidates) {
      if (!record.email || !record.candidate) continue;

      const completionPercentage = calculateCandidateCompletion(record.candidate);
      
      // Skip if profile is already complete
      if (completionPercentage >= 100) continue;

      const createdAt = new Date(record.createdAt);
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000));

      // Check if we should send 3-day reminder
      if (daysSinceCreation >= 3 && daysSinceCreation < 7) {
        const alreadySent = await db
          .select()
          .from(profileReminders)
          .where(and(
            eq(profileReminders.userId, record.userId),
            eq(profileReminders.reminderType, '3-day')
          ))
          .limit(1);

        if (alreadySent.length === 0) {
          try {
            await send3DayReminder(record.email, record.name || 'there', completionPercentage);
            
            await db.insert(profileReminders).values({
              userId: record.userId,
              reminderType: '3-day',
              profilePercentage: completionPercentage,
            });

            results.threeDay++;
          } catch (error: any) {
            results.errors.push(`3-day reminder failed for ${record.email}: ${error.message}`);
          }
        }
      }

      // Check if we should send 7-day reminder
      if (daysSinceCreation >= 7) {
        const alreadySent = await db
          .select()
          .from(profileReminders)
          .where(and(
            eq(profileReminders.userId, record.userId),
            eq(profileReminders.reminderType, '7-day')
          ))
          .limit(1);

        if (alreadySent.length === 0) {
          try {
            await send7DayReminder(record.email, record.name || 'there', completionPercentage);
            
            await db.insert(profileReminders).values({
              userId: record.userId,
              reminderType: '7-day',
              profilePercentage: completionPercentage,
            });

            results.sevenDay++;
          } catch (error: any) {
            results.errors.push(`7-day reminder failed for ${record.email}: ${error.message}`);
          }
        }
      }
    }
  } catch (error: any) {
    results.errors.push(`Service error: ${error.message}`);
  }

  return results;
}

/**
 * Send 3-day reminder email
 */
async function send3DayReminder(email: string, name: string, completionPercentage: number): Promise<void> {
  const subject = "Complete Your HotGigs Profile - Get Better Job Matches!";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .progress-bar { background: #e5e7eb; height: 24px; border-radius: 12px; overflow: hidden; margin: 20px 0; }
        .progress-fill { background: linear-gradient(90deg, #10b981 0%, #14b8a6 100%); height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; }
        .benefits { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .benefit-item { margin: 10px 0; padding-left: 25px; position: relative; }
        .benefit-item:before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🚀 Your Profile Needs You!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          
          <p>We noticed you started creating your HotGigs profile 3 days ago, but haven't finished yet. You're so close to unlocking amazing job opportunities!</p>
          
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${completionPercentage}%;">
              ${completionPercentage}% Complete
            </div>
          </div>
          
          <div class="benefits">
            <h3 style="margin-top: 0; color: #10b981;">Why Complete Your Profile?</h3>
            <div class="benefit-item">Get matched with jobs that fit your skills perfectly</div>
            <div class="benefit-item">Stand out to recruiters with a complete profile</div>
            <div class="benefit-item">Earn badges and unlock achievement rewards</div>
            <div class="benefit-item">Receive personalized job recommendations</div>
            <div class="benefit-item">Increase your visibility by up to 5x</div>
          </div>
          
          <p>It only takes 5 minutes to complete your profile and start receiving job matches!</p>
          
          <center>
            <a href="${process.env.VITE_FRONTEND_URL || 'https://hotgigs.com'}/candidate-dashboard" class="cta-button">
              Complete My Profile Now →
            </a>
          </center>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            <strong>Pro tip:</strong> Candidates with complete profiles get 3x more interview invitations!
          </p>
        </div>
        <div class="footer">
          <p>HotGigs - AI-Powered Recruitment Platform</p>
          <p style="font-size: 12px;">You're receiving this because you created a HotGigs account. <a href="#">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
    text: `Hi ${name},\n\nWe noticed you started creating your HotGigs profile 3 days ago. You're ${completionPercentage}% complete!\n\nComplete your profile to get better job matches and stand out to recruiters.\n\nComplete your profile: ${process.env.VITE_FRONTEND_URL || 'https://hotgigs.com'}/candidate-dashboard\n\nBest regards,\nThe HotGigs Team`,
  });
}

/**
 * Send 7-day reminder email
 */
async function send7DayReminder(email: string, name: string, completionPercentage: number): Promise<void> {
  const subject = "Don't Miss Out! Complete Your HotGigs Profile";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .urgency-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .stats { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .stat-item { display: inline-block; width: 48%; text-align: center; margin: 10px 0; }
        .stat-number { font-size: 32px; font-weight: bold; color: #10b981; }
        .stat-label { font-size: 14px; color: #6b7280; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">⏰ Your Dream Job is Waiting!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          
          <p>It's been a week since you started your HotGigs profile. We don't want you to miss out on amazing opportunities!</p>
          
          <div class="urgency-box">
            <strong>⚠️ Your profile is only ${completionPercentage}% complete</strong>
            <p style="margin: 10px 0 0 0;">Incomplete profiles are 80% less likely to be seen by recruiters.</p>
          </div>
          
          <div class="stats">
            <h3 style="margin-top: 0; text-align: center; color: #f59e0b;">What You're Missing:</h3>
            <div class="stat-item">
              <div class="stat-number">500+</div>
              <div class="stat-label">Active Jobs</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">3x</div>
              <div class="stat-label">More Interviews</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">5 min</div>
              <div class="stat-label">To Complete</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">100%</div>
              <div class="stat-label">Free Forever</div>
            </div>
          </div>
          
          <p><strong>Complete your profile today and:</strong></p>
          <ul>
            <li>Get instant job matches based on your skills</li>
            <li>Unlock exclusive recruiter access</li>
            <li>Earn achievement badges and points</li>
            <li>Join thousands of successful candidates</li>
          </ul>
          
          <center>
            <a href="${process.env.VITE_FRONTEND_URL || 'https://hotgigs.com'}/candidate-dashboard" class="cta-button">
              Complete My Profile - It's Free! →
            </a>
          </center>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            <em>This is our final reminder. Don't let your dream job slip away!</em>
          </p>
        </div>
        <div class="footer">
          <p>HotGigs - AI-Powered Recruitment Platform</p>
          <p style="font-size: 12px;">You're receiving this because you created a HotGigs account. <a href="#">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
    text: `Hi ${name},\n\nIt's been a week since you started your HotGigs profile. Your profile is only ${completionPercentage}% complete.\n\nIncomplete profiles are 80% less likely to be seen by recruiters. Complete your profile today to unlock job matches and recruiter access!\n\nComplete your profile: ${process.env.VITE_FRONTEND_URL || 'https://hotgigs.com'}/candidate-dashboard\n\nThis is our final reminder. Don't let your dream job slip away!\n\nBest regards,\nThe HotGigs Team`,
  });
}
