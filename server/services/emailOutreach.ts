import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { emailCampaigns, campaignRecipients, sourcedCandidates } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../emailService";

/**
 * AI-Powered Email Outreach Service
 * 
 * Automatically generates personalized emails to candidates with intelligent
 * follow-up sequences and engagement tracking.
 */

export interface EmailPersonalizationContext {
  candidateName: string;
  candidateTitle?: string;
  candidateCompany?: string;
  candidateSkills?: string[];
  jobTitle?: string;
  jobDescription?: string;
  companyName?: string;
  recruiterName?: string;
}

/**
 * Generate personalized email content using AI
 */
export async function generatePersonalizedEmail(
  template: string,
  context: EmailPersonalizationContext
): Promise<{ subject: string; body: string }> {
  const prompt = `You are an expert recruiter writing a personalized outreach email to a candidate.

**Candidate Information:**
- Name: ${context.candidateName}
- Current Title: ${context.candidateTitle || 'N/A'}
- Current Company: ${context.candidateCompany || 'N/A'}
- Skills: ${context.candidateSkills?.join(', ') || 'N/A'}

**Job Opportunity:**
- Title: ${context.jobTitle || 'N/A'}
- Company: ${context.companyName || 'N/A'}

**Email Template:**
${template}

**Instructions:**
1. Personalize the template with the candidate's specific background
2. Highlight relevant skills that match the job
3. Make it conversational and authentic, not salesy
4. Keep it concise (under 200 words)
5. Include a clear call-to-action
6. Generate both subject line and body

**Output Format:**
Return JSON with "subject" and "body" fields.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are an expert recruiter writing personalized outreach emails.' },
        { role: 'user', content: prompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'personalized_email',
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
      throw new Error('Failed to generate email');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating personalized email:', error);
    throw error;
  }
}

/**
 * Replace template variables with actual values
 */
export function replaceTemplateVariables(
  template: string,
  context: EmailPersonalizationContext
): string {
  return template
    .replace(/\{\{name\}\}/g, context.candidateName)
    .replace(/\{\{firstName\}\}/g, context.candidateName.split(' ')[0])
    .replace(/\{\{title\}\}/g, context.candidateTitle || '')
    .replace(/\{\{company\}\}/g, context.candidateCompany || '')
    .replace(/\{\{jobTitle\}\}/g, context.jobTitle || '')
    .replace(/\{\{companyName\}\}/g, context.companyName || '')
    .replace(/\{\{recruiterName\}\}/g, context.recruiterName || '');
}

/**
 * Send outreach email to a sourced candidate
 */
export async function sendOutreachEmail(
  sourcedCandidateId: number,
  campaignId: number,
  useAiPersonalization: boolean = true
): Promise<void> {
  const db = getDb();

  // Get sourced candidate
  const sourcedCandidate = await db.select()
    .from(sourcedCandidates)
    .where(eq(sourcedCandidates.id, sourcedCandidateId))
    .limit(1);

  if (!sourcedCandidate || sourcedCandidate.length === 0) {
    throw new Error('Sourced candidate not found');
  }

  const candidate = sourcedCandidate[0];

  if (!candidate.email) {
    throw new Error('Candidate email not found');
  }

  // Get campaign details
  const campaign = await db.select()
    .from(emailCampaigns)
    .where(eq(emailCampaigns.id, campaignId))
    .limit(1);

  if (!campaign || campaign.length === 0) {
    throw new Error('Email campaign not found');
  }

  const campaignData = campaign[0];

  // Parse enriched data
  let enrichedData: any = {};
  if (candidate.enrichedData) {
    try {
      enrichedData = JSON.parse(candidate.enrichedData);
    } catch (e) {
      console.error('Failed to parse enriched data:', e);
    }
  }

  // Build personalization context
  const context: EmailPersonalizationContext = {
    candidateName: candidate.fullName || 'there',
    candidateTitle: candidate.currentTitle,
    candidateCompany: candidate.currentCompany,
    candidateSkills: enrichedData.technicalSkills || [],
    jobTitle: campaignData.subject, // Using subject as job title for now
    companyName: 'Our Company', // TODO: Get from campaign/job
    recruiterName: 'Recruiting Team', // TODO: Get from user
  };

  let subject: string;
  let body: string;

  if (useAiPersonalization && campaignData.useAiPersonalization) {
    // Generate fully personalized email with AI
    const generated = await generatePersonalizedEmail(campaignData.body, context);
    subject = generated.subject;
    body = generated.body;
  } else {
    // Simple template variable replacement
    subject = replaceTemplateVariables(campaignData.subject, context);
    body = replaceTemplateVariables(campaignData.body, context);
  }

  // Send email
  try {
    await sendEmail({
      to: candidate.email,
      subject,
      html: body,
      from: 'recruiting@hotgigs.com', // TODO: Configure
    });

    // Track in campaign_recipients
    await db.insert(campaignRecipients).values({
      campaignId,
      candidateId: candidate.candidateId || 0, // Link to candidate if available
      email: candidate.email,
      personalizedSubject: subject,
      personalizedBody: body,
      status: 'sent',
      sentAt: new Date(),
    });

    // Mark sourced candidate as contacted
    await db.update(sourcedCandidates)
      .set({ contacted: true })
      .where(eq(sourcedCandidates.id, sourcedCandidateId));

  } catch (error) {
    console.error('Error sending outreach email:', error);
    throw error;
  }
}

/**
 * Send follow-up email based on engagement
 */
export async function sendFollowUpEmail(
  recipientId: number,
  followUpTemplate: string
): Promise<void> {
  const db = getDb();

  // Get recipient details
  const recipient = await db.select()
    .from(campaignRecipients)
    .where(eq(campaignRecipients.id, recipientId))
    .limit(1);

  if (!recipient || recipient.length === 0) {
    throw new Error('Recipient not found');
  }

  const recipientData = recipient[0];

  // Check if already replied (don't send follow-up)
  if (recipientData.status === 'replied') {
    console.log('Recipient already replied, skipping follow-up');
    return;
  }

  // Build context from previous email
  const context: EmailPersonalizationContext = {
    candidateName: recipientData.email.split('@')[0], // Fallback
    // TODO: Get more context from candidate record
  };

  const followUpContent = replaceTemplateVariables(followUpTemplate, context);

  try {
    await sendEmail({
      to: recipientData.email,
      subject: `Re: ${recipientData.personalizedSubject}`,
      html: followUpContent,
      from: 'recruiting@hotgigs.com',
    });

    // Update status
    await db.update(campaignRecipients)
      .set({ status: 'sent' }) // Reset to sent for follow-up tracking
      .where(eq(campaignRecipients.id, recipientId));

  } catch (error) {
    console.error('Error sending follow-up email:', error);
    throw error;
  }
}

/**
 * Process email campaign - send to all sourced candidates
 */
export async function processCampaign(campaignId: number): Promise<void> {
  const db = getDb();

  // Get campaign
  const campaign = await db.select()
    .from(emailCampaigns)
    .where(eq(emailCampaigns.id, campaignId))
    .limit(1);

  if (!campaign || campaign.length === 0) {
    throw new Error('Campaign not found');
  }

  const campaignData = campaign[0];

  // Get sourced candidates from linked sourcing campaign
  if (!campaignData.sourcingCampaignId) {
    throw new Error('No sourcing campaign linked');
  }

  const candidates = await db.select()
    .from(sourcedCandidates)
    .where(eq(sourcedCandidates.campaignId, campaignData.sourcingCampaignId));

  let sentCount = 0;
  let errorCount = 0;

  // Send emails to all candidates
  for (const candidate of candidates) {
    // Skip if already contacted
    if (candidate.contacted) {
      continue;
    }

    // Skip if no email
    if (!candidate.email) {
      continue;
    }

    try {
      await sendOutreachEmail(candidate.id, campaignId, campaignData.useAiPersonalization);
      sentCount++;
      
      // Add delay to avoid rate limiting (100ms between emails)
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to send email to candidate ${candidate.id}:`, error);
      errorCount++;
    }
  }

  // Update campaign statistics
  await db.update(emailCampaigns)
    .set({
      status: 'sent',
      sentAt: new Date(),
      sentCount,
      totalRecipients: candidates.length,
    })
    .where(eq(emailCampaigns.id, campaignId));

  console.log(`Campaign ${campaignId} completed: ${sentCount} sent, ${errorCount} errors`);
}

/**
 * Schedule follow-ups for non-responders
 */
export async function scheduleFollowUps(campaignId: number, daysAfter: number = 3): Promise<void> {
  const db = getDb();

  // Get recipients who haven't replied
  const recipients = await db.select()
    .from(campaignRecipients)
    .where(eq(campaignRecipients.campaignId, campaignId));

  const nonResponders = recipients.filter(r => 
    r.status !== 'replied' && 
    r.sentAt && 
    new Date().getTime() - new Date(r.sentAt).getTime() >= daysAfter * 24 * 60 * 60 * 1000
  );

  const followUpTemplate = `Hi {{firstName}},

I wanted to follow up on my previous email about the {{jobTitle}} opportunity. 

I think your background in {{title}} would be a great fit for this role. Would you be open to a quick 15-minute call to discuss?

Looking forward to hearing from you!

Best regards,
{{recruiterName}}`;

  for (const recipient of nonResponders) {
    try {
      await sendFollowUpEmail(recipient.id, followUpTemplate);
    } catch (error) {
      console.error(`Failed to send follow-up to recipient ${recipient.id}:`, error);
    }
  }

  console.log(`Scheduled ${nonResponders.length} follow-ups for campaign ${campaignId}`);
}
