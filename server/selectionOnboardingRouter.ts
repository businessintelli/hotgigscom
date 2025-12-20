import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { sendEmail } from "./emailService";
import { notifyOwner } from "./_core/notification";

/**
 * Selection & Onboarding Router
 * Handles candidate selection/rejection decisions and onboarding workflows
 */
export const selectionOnboardingRouter = router({
  // ===========================
  // Selection/Rejection Workflow
  // ===========================

  // Make selection decision (automatic or manual)
  makeDecision: protectedProcedure
    .input(z.object({
      applicationId: z.number(),
      candidateId: z.number(),
      jobId: z.number(),
      analysisId: z.number().optional(),
      decision: z.enum(['selected', 'rejected', 'pending-review', 'waitlisted']),
      decisionType: z.enum(['automatic', 'manual', 'hybrid']),
      selectionReason: z.string().optional(),
      rejectionReason: z.string().optional(),
      rejectionCategory: z.string().optional(),
      internalNotes: z.string().optional(),
      scoreThreshold: z.number().optional(),
      autoSelectionEnabled: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get recruiter ID from context
      const recruiter = await db.getRecruiterByUserId(ctx.user.id);
      if (!recruiter) {
        throw new Error("Recruiter profile not found");
      }

      // Create selection record
      const selectionId = await db.createCandidateSelection({
        applicationId: input.applicationId,
        candidateId: input.candidateId,
        jobId: input.jobId,
        analysisId: input.analysisId,
        decision: input.decision,
        decisionType: input.decisionType,
        decisionMaker: input.decisionType === 'automatic' ? null : recruiter.id,
        selectionReason: input.selectionReason,
        rejectionReason: input.rejectionReason,
        rejectionCategory: input.rejectionCategory,
        internalNotes: input.internalNotes,
        scoreThreshold: input.scoreThreshold,
        autoSelectionEnabled: input.autoSelectionEnabled,
        candidateNotified: false,
      });

      // Update application status
      if (input.decision === 'selected') {
        await db.updateApplication(input.applicationId, {
          status: 'offer-extended',
        });
      } else if (input.decision === 'rejected') {
        await db.updateApplication(input.applicationId, {
          status: 'rejected',
        });
      }

      return { selectionId, success: true };
    }),

  // Send notification to candidate about decision
  notifyCandidate: protectedProcedure
    .input(z.object({
      selectionId: z.number(),
      notificationMethod: z.enum(['email', 'sms', 'both']).default('email'),
    }))
    .mutation(async ({ input }) => {
      const selection = await db.getCandidateSelectionByApplicationId(0); // We'll need to get by selection ID
      if (!selection) {
        throw new Error("Selection not found");
      }

      // Get candidate and job details
      const candidate = await db.getCandidateById(selection.candidateId);
      const job = await db.getJobById(selection.jobId);
      const user = candidate ? await db.getUserById(candidate.userId) : null;

      if (!candidate || !job || !user || !user.email) {
        throw new Error("Required data not found");
      }

      // Prepare email based on decision
      let subject: string;
      let htmlContent: string;

      if (selection.decision === 'selected') {
        subject = `Congratulations! You've been selected for ${job.title}`;
        htmlContent = `
          <h2>Great News!</h2>
          <p>Dear ${candidate.firstName || 'Candidate'},</p>
          <p>We are pleased to inform you that you have been selected for the position of <strong>${job.title}</strong>.</p>
          ${selection.selectionReason ? `<p><strong>Reason:</strong> ${selection.selectionReason}</p>` : ''}
          <p>Our team will reach out to you shortly with next steps for onboarding.</p>
          <p>Congratulations on your success!</p>
          <p>Best regards,<br>The Recruitment Team</p>
        `;
      } else if (selection.decision === 'rejected') {
        subject = `Update on your application for ${job.title}`;
        htmlContent = `
          <h2>Application Update</h2>
          <p>Dear ${candidate.firstName || 'Candidate'},</p>
          <p>Thank you for your interest in the position of <strong>${job.title}</strong> and for taking the time to interview with us.</p>
          <p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
          ${selection.rejectionReason ? `<p><strong>Feedback:</strong> ${selection.rejectionReason}</p>` : ''}
          <p>We appreciate your interest in our company and encourage you to apply for future opportunities that match your skills and experience.</p>
          <p>Best wishes in your job search.</p>
          <p>Best regards,<br>The Recruitment Team</p>
        `;
      } else if (selection.decision === 'waitlisted') {
        subject = `Your application for ${job.title} - Waitlist Status`;
        htmlContent = `
          <h2>Application Update</h2>
          <p>Dear ${candidate.firstName || 'Candidate'},</p>
          <p>Thank you for your interest in the position of <strong>${job.title}</strong>.</p>
          <p>We were impressed with your qualifications and interview performance. While we are not able to extend an offer at this time, we would like to keep you on our waitlist for this position.</p>
          <p>We will reach out to you if an opportunity becomes available.</p>
          <p>Thank you for your patience and continued interest.</p>
          <p>Best regards,<br>The Recruitment Team</p>
        `;
      } else {
        subject = `Your application for ${job.title} - Under Review`;
        htmlContent = `
          <h2>Application Update</h2>
          <p>Dear ${candidate.firstName || 'Candidate'},</p>
          <p>Your application for the position of <strong>${job.title}</strong> is currently under review by our team.</p>
          <p>We will update you on the status of your application soon.</p>
          <p>Thank you for your patience.</p>
          <p>Best regards,<br>The Recruitment Team</p>
        `;
      }

      // Send email
      if (input.notificationMethod === 'email' || input.notificationMethod === 'both') {
        await sendEmail({
          to: user.email,
          subject,
          html: htmlContent,
        });
      }

      // Update selection record
      await db.updateCandidateSelection(input.selectionId, {
        candidateNotified: true,
        notifiedAt: new Date(),
        notificationMethod: input.notificationMethod,
      });

      return { success: true };
    }),

  // Get selection by application ID
  getSelectionByApplication: protectedProcedure
    .input(z.object({
      applicationId: z.number(),
    }))
    .query(async ({ input }) => {
      const selection = await db.getCandidateSelectionByApplicationId(input.applicationId);
      return selection;
    }),

  // Get all selections for a job
  getSelectionsByJob: protectedProcedure
    .input(z.object({
      jobId: z.number(),
    }))
    .query(async ({ input }) => {
      const selections = await db.getCandidateSelectionsByJobId(input.jobId);
      return selections;
    }),

  // Automatic selection based on analysis scores
  autoSelectCandidates: protectedProcedure
    .input(z.object({
      jobId: z.number(),
      scoreThreshold: z.number().default(70),
      maxSelections: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get all applications for the job with completed analysis
      const applications = await db.getApplicationsByJob(input.jobId);
      const selectedCount = 0;
      const results: any[] = [];

      for (const application of applications) {
        // Check if already has a selection decision
        const existingSelection = await db.getCandidateSelectionByApplicationId(application.id);
        if (existingSelection) {
          continue;
        }

        // Get analysis
        const analysis = await db.getInterviewAnalysisByApplicationId(application.id);
        if (!analysis) {
          continue;
        }

        // Check if meets threshold
        if (analysis.overallScore >= input.scoreThreshold) {
          // Auto-select
          const selectionId = await db.createCandidateSelection({
            applicationId: application.id,
            candidateId: application.candidateId,
            jobId: input.jobId,
            analysisId: analysis.id,
            decision: 'selected',
            decisionType: 'automatic',
            decisionMaker: null,
            selectionReason: `Automatically selected based on interview score of ${analysis.overallScore}`,
            scoreThreshold: input.scoreThreshold,
            autoSelectionEnabled: true,
            candidateNotified: false,
          });

          // Update application status
          await db.updateApplication(application.id, {
            status: 'offer-extended',
          });

          results.push({
            applicationId: application.id,
            candidateId: application.candidateId,
            selectionId,
            score: analysis.overallScore,
          });

          if (input.maxSelections && results.length >= input.maxSelections) {
            break;
          }
        }
      }

      return { selectedCount: results.length, selections: results };
    }),

  // ===========================
  // Onboarding Workflow
  // ===========================

  // Create onboarding checklist for selected candidate
  createOnboardingChecklist: protectedProcedure
    .input(z.object({
      selectionId: z.number(),
      candidateId: z.number(),
      jobId: z.number(),
      startDate: z.string().optional(),
      targetCompletionDate: z.string().optional(),
      tasks: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        taskType: z.enum(['document-upload', 'form-completion', 'training-video', 'system-setup', 'meeting', 'other']),
        priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        dueDate: z.string().optional(),
        estimatedDuration: z.number().optional(),
        orderIndex: z.number(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get recruiter ID
      const recruiter = await db.getRecruiterByUserId(ctx.user.id);
      if (!recruiter) {
        throw new Error("Recruiter profile not found");
      }

      // Create checklist
      const checklistId = await db.createOnboardingChecklist({
        candidateId: input.candidateId,
        jobId: input.jobId,
        selectionId: input.selectionId,
        recruiterId: recruiter.id,
        status: 'not-started',
        startDate: input.startDate ? new Date(input.startDate) : null,
        targetCompletionDate: input.targetCompletionDate ? new Date(input.targetCompletionDate) : null,
        totalTasks: input.tasks.length,
        completedTasks: 0,
        progressPercentage: 0,
      });

      // Create checklist items
      const items = input.tasks.map(task => ({
        checklistId,
        title: task.title,
        description: task.description,
        category: task.category,
        taskType: task.taskType,
        priority: task.priority,
        orderIndex: task.orderIndex,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        estimatedDuration: task.estimatedDuration,
        status: 'pending' as const,
      }));

      await db.createOnboardingChecklistItems(items);

      // Send welcome email to candidate
      const candidate = await db.getCandidateById(input.candidateId);
      const user = candidate ? await db.getUserById(candidate.userId) : null;
      const job = await db.getJobById(input.jobId);

      if (user && user.email && job) {
        await sendEmail({
          to: user.email,
          subject: `Welcome to ${job.company || 'the team'}! Your Onboarding Checklist`,
          html: `
            <h2>Welcome Aboard!</h2>
            <p>Dear ${candidate?.firstName || 'New Team Member'},</p>
            <p>We're excited to have you join us for the position of <strong>${job.title}</strong>!</p>
            <p>To help you get started, we've prepared an onboarding checklist with ${input.tasks.length} tasks.</p>
            <p>Please log in to your account to view and complete your onboarding tasks.</p>
            <p>If you have any questions, please don't hesitate to reach out.</p>
            <p>Welcome to the team!</p>
            <p>Best regards,<br>The Recruitment Team</p>
          `,
        });
      }

      // Notify owner about new onboarding
      await notifyOwner({
        title: "New Candidate Onboarding Started",
        content: `Onboarding checklist created for ${candidate?.firstName} ${candidate?.lastName} for position: ${job?.title}`,
      });

      return { checklistId, success: true };
    }),

  // Get onboarding checklist for candidate
  getOnboardingChecklist: protectedProcedure
    .input(z.object({
      candidateId: z.number().optional(),
      selectionId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      let checklist;
      
      if (input.selectionId) {
        checklist = await db.getOnboardingChecklistBySelectionId(input.selectionId);
      } else if (input.candidateId) {
        checklist = await db.getOnboardingChecklistByCandidateId(input.candidateId);
      } else {
        throw new Error("Either candidateId or selectionId must be provided");
      }

      if (!checklist) {
        return null;
      }

      const items = await db.getOnboardingChecklistItemsByChecklistId(checklist.id);

      return {
        checklist,
        items,
      };
    }),

  // Update checklist item status
  updateChecklistItem: protectedProcedure
    .input(z.object({
      itemId: z.number(),
      status: z.enum(['pending', 'in-progress', 'completed', 'blocked', 'skipped']),
      completionNotes: z.string().optional(),
      documentUrl: z.string().optional(),
      documentName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const updateData: any = {
        status: input.status,
        completionNotes: input.completionNotes,
        documentUrl: input.documentUrl,
        documentName: input.documentName,
      };

      if (input.status === 'completed') {
        updateData.completedAt = new Date();
        updateData.completedBy = 'candidate';
      }

      await db.updateOnboardingChecklistItem(input.itemId, updateData);

      // Get the item to find its checklist
      const items = await db.getOnboardingChecklistItemsByChecklistId(0); // We'd need a better way to get this
      // For now, we'll just update the item and recalculate progress separately

      return { success: true };
    }),

  // Update onboarding checklist progress
  updateChecklistProgress: protectedProcedure
    .input(z.object({
      checklistId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const items = await db.getOnboardingChecklistItemsByChecklistId(input.checklistId);
      const completedItems = items.filter(item => item.status === 'completed');
      const progressPercentage = items.length > 0 
        ? Math.round((completedItems.length / items.length) * 100)
        : 0;

      const allCompleted = completedItems.length === items.length && items.length > 0;

      await db.updateOnboardingChecklist(input.checklistId, {
        completedTasks: completedItems.length,
        progressPercentage,
        status: allCompleted ? 'completed' : 'in-progress',
        actualCompletionDate: allCompleted ? new Date() : null,
      });

      return { 
        completedTasks: completedItems.length, 
        totalTasks: items.length,
        progressPercentage,
        status: allCompleted ? 'completed' : 'in-progress',
      };
    }),

  // Get all onboarding checklists for recruiter
  getRecruiterOnboardingChecklists: protectedProcedure
    .query(async ({ ctx }) => {
      const recruiter = await db.getRecruiterByUserId(ctx.user.id);
      if (!recruiter) {
        throw new Error("Recruiter profile not found");
      }

      const checklists = await db.getOnboardingChecklistsByRecruiterId(recruiter.id);
      return checklists;
    }),

  // Create default onboarding template tasks
  getDefaultOnboardingTasks: protectedProcedure
    .query(async () => {
      return [
        {
          title: "Complete Personal Information Form",
          description: "Fill out your personal details, emergency contacts, and banking information",
          category: "documentation",
          taskType: "form-completion" as const,
          priority: "high" as const,
          orderIndex: 0,
          estimatedDuration: 15,
        },
        {
          title: "Upload Identification Documents",
          description: "Upload copies of your ID, passport, or driver's license",
          category: "documentation",
          taskType: "document-upload" as const,
          priority: "high" as const,
          orderIndex: 1,
          estimatedDuration: 10,
        },
        {
          title: "Sign Employment Contract",
          description: "Review and sign your employment agreement",
          category: "documentation",
          taskType: "document-upload" as const,
          priority: "critical" as const,
          orderIndex: 2,
          estimatedDuration: 20,
        },
        {
          title: "Complete Tax Forms",
          description: "Fill out required tax withholding forms",
          category: "documentation",
          taskType: "form-completion" as const,
          priority: "high" as const,
          orderIndex: 3,
          estimatedDuration: 15,
        },
        {
          title: "Set Up Company Email",
          description: "Activate your company email account and set up your profile",
          category: "system-access",
          taskType: "system-setup" as const,
          priority: "high" as const,
          orderIndex: 4,
          estimatedDuration: 10,
        },
        {
          title: "Complete Security Training",
          description: "Watch security awareness training video and complete quiz",
          category: "training",
          taskType: "training-video" as const,
          priority: "medium" as const,
          orderIndex: 5,
          estimatedDuration: 30,
        },
        {
          title: "Schedule Welcome Meeting",
          description: "Meet with your manager and team members",
          category: "meetings",
          taskType: "meeting" as const,
          priority: "medium" as const,
          orderIndex: 6,
          estimatedDuration: 60,
        },
        {
          title: "Complete Company Orientation",
          description: "Learn about company culture, policies, and procedures",
          category: "training",
          taskType: "training-video" as const,
          priority: "medium" as const,
          orderIndex: 7,
          estimatedDuration: 45,
        },
      ];
    }),
});
