import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { candidateSuccessPredictions, applications, interviews, jobs, candidates } from "../../drizzle/schema";
import { eq, and, gte } from "drizzle-orm";
import { sendEmail } from "../emailService";

/**
 * Auto-Scheduling Service
 * 
 * Automatically schedules interviews for high-scoring candidates
 * when their success prediction score exceeds the threshold.
 */

export interface AutoScheduleSettings {
  enabled: boolean;
  scoreThreshold: number; // Default: 85
  interviewType: "ai-interview" | "phone" | "video" | "in-person";
  defaultDuration: number; // minutes
  autoSendInvitation: boolean;
}

const DEFAULT_SETTINGS: AutoScheduleSettings = {
  enabled: true,
  scoreThreshold: 85,
  interviewType: "ai-interview",
  defaultDuration: 60,
  autoSendInvitation: true,
};

/**
 * Check if auto-scheduling should trigger for an application
 */
export async function shouldAutoSchedule(applicationId: number, settings: AutoScheduleSettings = DEFAULT_SETTINGS): Promise<boolean> {
  if (!settings.enabled) {
    return false;
  }

  const db = await getDb();
  
  // Get prediction for application
  const predictions = await db.select()
    .from(candidateSuccessPredictions)
    .where(eq(candidateSuccessPredictions.applicationId, applicationId))
    .limit(1);
  
  if (!predictions || predictions.length === 0) {
    return false;
  }

  const prediction = predictions[0];
  const score = prediction.predictionScore || 0;

  // Check if score meets threshold
  if (score < settings.scoreThreshold) {
    return false;
  }

  // Check if interview already scheduled
  const existingInterviews = await db.select()
    .from(interviews)
    .where(eq(interviews.applicationId, applicationId));
  
  if (existingInterviews && existingInterviews.length > 0) {
    console.log(`Interview already exists for application ${applicationId}, skipping auto-schedule`);
    return false;
  }

  return true;
}

/**
 * Generate personalized interview invitation email
 */
async function generateInvitationEmail(
  candidateName: string,
  jobTitle: string,
  companyName: string,
  successScore: number
): Promise<{ subject: string; body: string }> {
  const prompt = `Generate a professional and warm interview invitation email for a high-potential candidate.

**Context:**
- Candidate Name: ${candidateName}
- Job Title: ${jobTitle}
- Company: ${companyName}
- Success Prediction Score: ${successScore}/100 (Top candidate!)

**Requirements:**
- Professional yet friendly tone
- Express genuine excitement about their application
- Mention that they stood out among applicants
- Invite them to schedule an interview
- Include a call-to-action to book a time slot
- Keep it concise (under 200 words)

**Output JSON:**
{
  "subject": "Interview Invitation - [Job Title] at [Company]",
  "body": "Email body text here..."
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are an expert recruiter writing personalized interview invitations.' },
        { role: 'user', content: prompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'interview_invitation',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              subject: { type: 'string' },
              body: { type: 'string' }
            },
            required: ['subject', 'body'],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Failed to generate invitation email');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating invitation email:', error);
    // Fallback template
    return {
      subject: `Interview Invitation - ${jobTitle} at ${companyName}`,
      body: `Dear ${candidateName},\n\nThank you for your application for the ${jobTitle} position at ${companyName}. We were impressed by your qualifications and would like to invite you to interview for this role.\n\nYour application stood out among many excellent candidates, and we're excited to learn more about your experience and how you can contribute to our team.\n\nPlease click the link below to schedule your interview at a time that works best for you:\n\n[Calendar Link]\n\nWe look forward to speaking with you soon!\n\nBest regards,\nThe ${companyName} Recruiting Team`
    };
  }
}

/**
 * Auto-schedule interview for high-scoring application
 */
export async function autoScheduleInterview(
  applicationId: number,
  recruiterId: number,
  settings: AutoScheduleSettings = DEFAULT_SETTINGS
): Promise<{ success: boolean; interviewId?: number; message: string }> {
  const db = await getDb();

  try {
    // Check if should auto-schedule
    const shouldSchedule = await shouldAutoSchedule(applicationId, settings);
    if (!shouldSchedule) {
      return {
        success: false,
        message: 'Auto-scheduling criteria not met'
      };
    }

    // Get application details
    const appData = await db.select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);
    
    if (!appData || appData.length === 0) {
      return {
        success: false,
        message: 'Application not found'
      };
    }

    const application = appData[0];

    // Get job details
    const jobData = await db.select()
      .from(jobs)
      .where(eq(jobs.id, application.jobId))
      .limit(1);
    
    const job = jobData[0];

    // Get candidate details
    const candidateData = await db.select()
      .from(candidates)
      .where(eq(candidates.id, application.candidateId))
      .limit(1);
    
    const candidate = candidateData[0];

    // Get prediction score
    const predictions = await db.select()
      .from(candidateSuccessPredictions)
      .where(eq(candidateSuccessPredictions.applicationId, applicationId))
      .limit(1);
    
    const prediction = predictions[0];
    const successScore = prediction?.predictionScore || 0;

    // Create interview record
    const interviewDate = new Date();
    interviewDate.setDate(interviewDate.getDate() + 3); // Schedule 3 days from now
    interviewDate.setHours(14, 0, 0, 0); // 2 PM default time

    const result = await db.insert(interviews).values({
      applicationId,
      jobId: application.jobId,
      candidateId: application.candidateId,
      recruiterId,
      scheduledAt: interviewDate,
      duration: settings.defaultDuration,
      type: settings.interviewType,
      status: 'scheduled',
      notes: `Auto-scheduled for high-scoring candidate (Success Score: ${successScore}/100)`,
      createdAt: new Date(),
    });

    const interviewId = result.insertId;

    // Send invitation email if enabled
    if (settings.autoSendInvitation && candidate?.email) {
      const candidateName = candidate.fullName || candidate.firstName || 'Candidate';
      const jobTitle = job?.title || 'Position';
      const companyName = job?.company || 'Our Company';

      const { subject, body } = await generateInvitationEmail(
        candidateName,
        jobTitle,
        companyName,
        successScore
      );

      await sendEmail({
        to: candidate.email,
        subject,
        html: body.replace(/\n/g, '<br>'),
        text: body,
      });

      console.log(`Auto-scheduled interview ${interviewId} and sent invitation to ${candidate.email}`);
    }

    return {
      success: true,
      interviewId,
      message: `Interview auto-scheduled for ${candidate?.fullName || 'candidate'} (Score: ${successScore}/100)`
    };
  } catch (error) {
    console.error('Error auto-scheduling interview:', error);
    return {
      success: false,
      message: `Failed to auto-schedule: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Process all pending high-scoring applications for auto-scheduling
 */
export async function processPendingAutoSchedules(
  recruiterId: number,
  settings: AutoScheduleSettings = DEFAULT_SETTINGS
): Promise<{ scheduled: number; skipped: number; failed: number }> {
  const db = await getDb();

  let scheduled = 0;
  let skipped = 0;
  let failed = 0;

  try {
    // Get all applications with high scores that don't have interviews
    const highScorePredictions = await db.select()
      .from(candidateSuccessPredictions)
      .where(gte(candidateSuccessPredictions.predictionScore, settings.scoreThreshold));

    for (const prediction of highScorePredictions) {
      if (!prediction.applicationId) continue;

      const result = await autoScheduleInterview(prediction.applicationId, recruiterId, settings);
      
      if (result.success) {
        scheduled++;
      } else if (result.message.includes('criteria not met') || result.message.includes('already exists')) {
        skipped++;
      } else {
        failed++;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Auto-scheduling complete: ${scheduled} scheduled, ${skipped} skipped, ${failed} failed`);
  } catch (error) {
    console.error('Error processing auto-schedules:', error);
  }

  return { scheduled, skipped, failed };
}
