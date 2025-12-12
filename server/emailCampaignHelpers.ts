import { getDb } from "./db";
import {
  emailTemplates,
  emailCampaigns,
  campaignRecipients,
  followUpSequences,
  sequenceSteps,
  sequenceEnrollments,
  candidates,
  users,
} from "../drizzle/schema";
import { eq, and, or, inArray, sql } from "drizzle-orm";
import { sendEmail } from "./emailService";

/**
 * Create email template
 */
export async function createEmailTemplate(data: {
  name: string;
  subject: string;
  body: string;
  category?: string;
  userId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(emailTemplates).values(data);
  return result;
}

/**
 * Get all templates for a user
 */
export async function getEmailTemplatesByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(emailTemplates)
    .where(and(eq(emailTemplates.userId, userId), eq(emailTemplates.isActive, true)));
}

/**
 * Get template by ID
 */
export async function getEmailTemplateById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.id, id))
    .limit(1);

  return result[0];
}

/**
 * Update email template
 */
export async function updateEmailTemplate(
  id: number,
  data: {
    name?: string;
    subject?: string;
    body?: string;
    category?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(emailTemplates).set(data).where(eq(emailTemplates.id, id));
}

/**
 * Delete email template (soft delete)
 */
export async function deleteEmailTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(emailTemplates)
    .set({ isActive: false })
    .where(eq(emailTemplates.id, id));
}

/**
 * Personalize email content with candidate data
 */
export function personalizeEmail(
  template: string,
  candidate: any,
  user: any,
  customVars?: Record<string, string>
): string {
  let personalized = template;

  // Replace candidate variables
  personalized = personalized.replace(/\{\{name\}\}/g, user?.name || "there");
  personalized = personalized.replace(/\{\{firstName\}\}/g, user?.name?.split(" ")[0] || "there");
  personalized = personalized.replace(/\{\{email\}\}/g, user?.email || "");
  personalized = personalized.replace(/\{\{title\}\}/g, candidate?.title || "");
  personalized = personalized.replace(/\{\{location\}\}/g, candidate?.location || "");
  personalized = personalized.replace(
    /\{\{experience\}\}/g,
    candidate?.totalExperienceYears ? `${candidate.totalExperienceYears} years` : ""
  );

  // Replace custom variables
  if (customVars) {
    Object.entries(customVars).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      personalized = personalized.replace(regex, value);
    });
  }

  return personalized;
}

/**
 * Create email campaign
 */
export async function createEmailCampaign(data: {
  name: string;
  templateId?: number;
  subject: string;
  body: string;
  userId: number;
  scheduledAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(emailCampaigns).values({
    ...data,
    status: data.scheduledAt ? "scheduled" : "draft",
  });

  return result;
}

/**
 * Get campaigns by user
 */
export async function getCampaignsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
      campaign: emailCampaigns,
      template: emailTemplates,
    })
    .from(emailCampaigns)
    .leftJoin(emailTemplates, eq(emailCampaigns.templateId, emailTemplates.id))
    .where(eq(emailCampaigns.userId, userId));
}

/**
 * Get campaign by ID with recipients
 */
export async function getCampaignById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const campaign = await db
    .select()
    .from(emailCampaigns)
    .where(eq(emailCampaigns.id, id))
    .limit(1);

  if (campaign.length === 0) return null;

  const recipients = await db
    .select({
      recipient: campaignRecipients,
      candidate: candidates,
      user: users,
    })
    .from(campaignRecipients)
    .leftJoin(candidates, eq(campaignRecipients.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(eq(campaignRecipients.campaignId, id));

  return {
    ...campaign[0],
    recipients,
  };
}

/**
 * Add recipients to campaign
 */
export async function addCampaignRecipients(
  campaignId: number,
  candidateIds: number[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get candidate emails
  const candidateData = await db
    .select({
      candidate: candidates,
      user: users,
    })
    .from(candidates)
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(inArray(candidates.id, candidateIds));

  // Create recipient records
  const recipients = candidateData.map((data: any) => ({
    campaignId,
    candidateId: data.candidate.id,
    email: data.user?.email || "",
    trackingId: generateTrackingId(),
  }));

  if (recipients.length > 0) {
    await db.insert(campaignRecipients).values(recipients);

    // Update campaign total recipients
    await db
      .update(emailCampaigns)
      .set({ totalRecipients: sql`${emailCampaigns.totalRecipients} + ${recipients.length}` })
      .where(eq(emailCampaigns.id, campaignId));
  }

  return recipients.length;
}

/**
 * Send campaign emails
 */
export async function sendCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get campaign details
  const campaign = await getCampaignById(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  // Update campaign status
  await db
    .update(emailCampaigns)
    .set({ status: "sending", sentAt: new Date() })
    .where(eq(emailCampaigns.id, campaignId));

  // Get pending recipients
  const recipients = await db
    .select({
      recipient: campaignRecipients,
      candidate: candidates,
      user: users,
    })
    .from(campaignRecipients)
    .leftJoin(candidates, eq(campaignRecipients.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(
      and(
        eq(campaignRecipients.campaignId, campaignId),
        eq(campaignRecipients.status, "pending")
      )
    );

  let sentCount = 0;
  let bouncedCount = 0;

  // Send emails
  for (const { recipient, candidate, user } of recipients) {
    try {
      // Personalize content
      const personalizedSubject = personalizeEmail(campaign.subject, candidate, user);
      const personalizedBody = personalizeEmail(campaign.body, candidate, user);

      // Send email
      await sendEmail({
        to: recipient.email,
        subject: personalizedSubject,
        html: addTrackingPixel(personalizedBody, recipient.trackingId || ""),
      });

      // Update recipient status
      await db
        .update(campaignRecipients)
        .set({
          status: "sent",
          sentAt: new Date(),
          personalizedSubject,
          personalizedBody,
        })
        .where(eq(campaignRecipients.id, recipient.id));

      sentCount++;
    } catch (error) {
      console.error(`Failed to send email to ${recipient.email}:`, error);
      
      // Mark as bounced
      await db
        .update(campaignRecipients)
        .set({
          status: "bounced",
          bouncedAt: new Date(),
        })
        .where(eq(campaignRecipients.id, recipient.id));

      bouncedCount++;
    }
  }

  // Update campaign stats
  await db
    .update(emailCampaigns)
    .set({
      status: "sent",
      sentCount: sql`${emailCampaigns.sentCount} + ${sentCount}`,
      bouncedCount: sql`${emailCampaigns.bouncedCount} + ${bouncedCount}`,
    })
    .where(eq(emailCampaigns.id, campaignId));

  return { sentCount, bouncedCount };
}

/**
 * Track email open
 */
export async function trackEmailOpen(trackingId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const recipient = await db
    .select()
    .from(campaignRecipients)
    .where(eq(campaignRecipients.trackingId, trackingId))
    .limit(1);

  if (recipient.length === 0) return;

  const rec = recipient[0];

  // Only track first open
  if (!rec.openedAt) {
    await db
      .update(campaignRecipients)
      .set({
        status: "opened",
        openedAt: new Date(),
      })
      .where(eq(campaignRecipients.id, rec.id));

    // Update campaign stats
    await db
      .update(emailCampaigns)
      .set({
        openedCount: sql`${emailCampaigns.openedCount} + 1`,
      })
      .where(eq(emailCampaigns.id, rec.campaignId));
  }
}

/**
 * Track email click
 */
export async function trackEmailClick(trackingId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const recipient = await db
    .select()
    .from(campaignRecipients)
    .where(eq(campaignRecipients.trackingId, trackingId))
    .limit(1);

  if (recipient.length === 0) return;

  const rec = recipient[0];

  // Only track first click
  if (!rec.clickedAt) {
    await db
      .update(campaignRecipients)
      .set({
        status: "clicked",
        clickedAt: new Date(),
      })
      .where(eq(campaignRecipients.id, rec.id));

    // Update campaign stats
    await db
      .update(emailCampaigns)
      .set({
        clickedCount: sql`${emailCampaigns.clickedCount} + 1`,
      })
      .where(eq(emailCampaigns.id, rec.campaignId));
  }
}

/**
 * Create follow-up sequence
 */
export async function createFollowUpSequence(data: {
  name: string;
  description?: string;
  userId: number;
  steps: Array<{
    stepNumber: number;
    delayDays: number;
    subject: string;
    body: string;
    condition?: string;
    templateId?: number;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create sequence
  const sequenceResult = await db.insert(followUpSequences).values({
    name: data.name,
    description: data.description,
    userId: data.userId,
  });

  const sequenceId = Number(sequenceResult[0].insertId);

  // Create steps
  if (data.steps.length > 0) {
    await db.insert(sequenceSteps).values(
      data.steps.map((step) => ({
        ...step,
        sequenceId,
      }))
    );
  }

  return sequenceId;
}

/**
 * Get sequences by user
 */
export async function getSequencesByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const sequences = await db
    .select()
    .from(followUpSequences)
    .where(eq(followUpSequences.userId, userId));

  // Get steps for each sequence
  const sequencesWithSteps = await Promise.all(
    sequences.map(async (sequence: any) => {
      const steps = await db
        .select()
        .from(sequenceSteps)
        .where(eq(sequenceSteps.sequenceId, sequence.id));

      return { ...sequence, steps };
    })
  );

  return sequencesWithSteps;
}

/**
 * Enroll candidates in sequence
 */
export async function enrollCandidatesInSequence(
  sequenceId: number,
  candidateIds: number[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get sequence first step
  const steps = await db
    .select()
    .from(sequenceSteps)
    .where(eq(sequenceSteps.sequenceId, sequenceId));

  if (steps.length === 0) throw new Error("Sequence has no steps");

  const firstStep = steps.sort((a: any, b: any) => a.stepNumber - b.stepNumber)[0];
  const nextStepAt = new Date();
  nextStepAt.setDate(nextStepAt.getDate() + firstStep.delayDays);

  // Create enrollments
  const enrollments = candidateIds.map((candidateId) => ({
    sequenceId,
    candidateId,
    currentStep: 0,
    nextStepAt,
  }));

  await db.insert(sequenceEnrollments).values(enrollments);

  return enrollments.length;
}

/**
 * Process sequence enrollments (called by cron job)
 */
export async function processSequenceEnrollments() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get enrollments due for next step
  const dueEnrollments = await db
    .select({
      enrollment: sequenceEnrollments,
      sequence: followUpSequences,
      candidate: candidates,
      user: users,
    })
    .from(sequenceEnrollments)
    .leftJoin(followUpSequences, eq(sequenceEnrollments.sequenceId, followUpSequences.id))
    .leftJoin(candidates, eq(sequenceEnrollments.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(
      and(
        eq(sequenceEnrollments.status, "active"),
        sql`${sequenceEnrollments.nextStepAt} <= NOW()`
      )
    );

  for (const { enrollment, sequence, candidate, user } of dueEnrollments) {
    try {
      // Get next step
      const steps = await db
        .select()
        .from(sequenceSteps)
        .where(eq(sequenceSteps.sequenceId, enrollment.sequenceId));

      const nextStep = steps.find((s: any) => s.stepNumber === (enrollment.currentStep || 0) + 1);

      if (!nextStep) {
        // Sequence completed
        await db
          .update(sequenceEnrollments)
          .set({
            status: "completed",
            completedAt: new Date(),
          })
          .where(eq(sequenceEnrollments.id, enrollment.id));
        continue;
      }

      // Check condition
      if (nextStep.condition && nextStep.condition !== "always") {
        // TODO: Implement condition checking (e.g., check if previous email was opened)
        // For now, skip if condition is not 'always'
        continue;
      }

      // Send email
      const personalizedSubject = personalizeEmail(nextStep.subject, candidate, user);
      const personalizedBody = personalizeEmail(nextStep.body, candidate, user);

      await sendEmail({
        to: user?.email || "",
        subject: personalizedSubject,
        html: personalizedBody,
      });

      // Update enrollment
      const nextStepAt = new Date();
      const followingStep = steps.find((s: any) => s.stepNumber === nextStep.stepNumber + 1);
      if (followingStep) {
        nextStepAt.setDate(nextStepAt.getDate() + followingStep.delayDays);
      }

      await db
        .update(sequenceEnrollments)
        .set({
          currentStep: nextStep.stepNumber,
          nextStepAt: followingStep ? nextStepAt : null,
        })
        .where(eq(sequenceEnrollments.id, enrollment.id));
    } catch (error) {
      console.error(`Failed to process enrollment ${enrollment.id}:`, error);
    }
  }
}

/**
 * Generate unique tracking ID
 */
function generateTrackingId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Add tracking pixel and unsubscribe link to email HTML
 */
function addTrackingPixel(html: string, trackingId: string): string {
  const appUrl = process.env.VITE_APP_URL || "http://localhost:3000";
  const trackingPixel = `<img src="${appUrl}/api/track/open/${trackingId}" width="1" height="1" style="display:none;" />`;
  const unsubscribeLink = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #666;">
      <p>If you no longer wish to receive these emails, you can <a href="${appUrl}/unsubscribe/${trackingId}" style="color: #666; text-decoration: underline;">unsubscribe here</a>.</p>
    </div>
  `;
  return html + trackingPixel + unsubscribeLink;
}

/**
 * Get recipient by tracking ID
 */
export async function getRecipientByTrackingId(trackingId: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const [recipient] = await db
    .select()
    .from(campaignRecipients)
    .where(eq(campaignRecipients.trackingId, trackingId))
    .limit(1);
  
  return recipient;
}
