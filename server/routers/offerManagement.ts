import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";

/**
 * Offer Management Router
 * Handles job offer creation, tracking, negotiation, and acceptance workflows
 */
export const offerManagementRouter = router({
  /**
   * Create a new job offer
   */
  createOffer: protectedProcedure
    .input(z.object({
      applicationId: z.number(),
      jobId: z.number(),
      candidateId: z.number(),
      offerTitle: z.string(),
      // Compensation
      salaryType: z.enum(["annual", "hourly", "contract"]),
      baseSalary: z.number(),
      signOnBonus: z.number().optional(),
      performanceBonus: z.number().optional(),
      equityShares: z.number().optional(),
      equityValue: z.number().optional(),
      otherCompensation: z.string().optional(),
      // Benefits
      healthInsurance: z.boolean().optional(),
      dentalInsurance: z.boolean().optional(),
      visionInsurance: z.boolean().optional(),
      retirement401k: z.boolean().optional(),
      retirement401kMatch: z.string().optional(),
      paidTimeOff: z.number().optional(),
      sickLeave: z.number().optional(),
      parentalLeave: z.number().optional(),
      otherBenefits: z.string().optional(),
      // Work details
      startDate: z.string().optional(),
      workLocation: z.string(),
      workType: z.enum(["remote", "hybrid", "onsite"]),
      department: z.string().optional(),
      reportingTo: z.string().optional(),
      // Terms
      probationPeriod: z.number().optional(),
      noticePeriod: z.number().optional(),
      nonCompeteClause: z.boolean().optional(),
      nonCompeteDuration: z.number().optional(),
      relocationAssistance: z.boolean().optional(),
      relocationAmount: z.number().optional(),
      // Notes
      recruiterNotes: z.string().optional(),
      internalNotes: z.string().optional(),
      // Expiration
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get recruiter profile
      const recruiter = await db.getRecruiterByUserId(ctx.user.id);
      if (!recruiter) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only recruiters can create offers"
        });
      }

      // Calculate total compensation
      const totalCompensation = 
        input.baseSalary +
        (input.signOnBonus || 0) +
        (input.performanceBonus || 0) +
        (input.equityValue || 0);

      // Create offer
      const offerId = await db.createOffer({
        applicationId: input.applicationId,
        jobId: input.jobId,
        candidateId: input.candidateId,
        recruiterId: recruiter.id,
        offerTitle: input.offerTitle,
        salaryType: input.salaryType,
        baseSalary: input.baseSalary,
        signOnBonus: input.signOnBonus || 0,
        performanceBonus: input.performanceBonus || 0,
        equityShares: input.equityShares || 0,
        equityValue: input.equityValue || 0,
        otherCompensation: input.otherCompensation,
        totalCompensation,
        healthInsurance: input.healthInsurance || false,
        dentalInsurance: input.dentalInsurance || false,
        visionInsurance: input.visionInsurance || false,
        retirement401k: input.retirement401k || false,
        retirement401kMatch: input.retirement401kMatch,
        paidTimeOff: input.paidTimeOff,
        sickLeave: input.sickLeave,
        parentalLeave: input.parentalLeave,
        otherBenefits: input.otherBenefits,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        workLocation: input.workLocation,
        workType: input.workType,
        department: input.department,
        reportingTo: input.reportingTo,
        probationPeriod: input.probationPeriod,
        noticePeriod: input.noticePeriod,
        nonCompeteClause: input.nonCompeteClause || false,
        nonCompeteDuration: input.nonCompeteDuration,
        relocationAssistance: input.relocationAssistance || false,
        relocationAmount: input.relocationAmount,
        recruiterNotes: input.recruiterNotes,
        internalNotes: input.internalNotes,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        status: "draft",
      });

      // Update application status to "offered"
      await db.updateApplication(input.applicationId, {
        status: "offered"
      });

      return { success: true, offerId };
    }),

  /**
   * Get offer by ID
   */
  getOffer: protectedProcedure
    .input(z.object({
      offerId: z.number()
    }))
    .query(async ({ input, ctx }) => {
      const offer = await db.getOfferById(input.offerId);
      
      if (!offer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Offer not found"
        });
      }

      // Check authorization
      const recruiter = await db.getRecruiterByUserId(ctx.user.id);
      const candidate = await db.getCandidateByUserId(ctx.user.id);
      
      const isRecruiter = recruiter && offer.recruiterId === recruiter.id;
      const isCandidate = candidate && offer.candidateId === candidate.id;

      if (!isRecruiter && !isCandidate) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view this offer"
        });
      }

      // Mark as viewed if candidate is viewing for the first time
      if (isCandidate && offer.status === "sent" && !offer.viewedAt) {
        await db.updateOffer(input.offerId, {
          status: "viewed",
          viewedAt: new Date()
        });
      }

      return offer;
    }),

  /**
   * Get offers for recruiter with pagination
   */
  getRecruiterOffers: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      status: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const recruiter = await db.getRecruiterByUserId(ctx.user.id);
      if (!recruiter) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only recruiters can view offers"
        });
      }

      return await db.getOffersByRecruiter(recruiter.id, {
        page: input.page,
        pageSize: input.pageSize,
        status: input.status,
        search: input.search
      });
    }),

  /**
   * Get offers for candidate
   */
  getCandidateOffers: protectedProcedure
    .query(async ({ ctx }) => {
      const candidate = await db.getCandidateByUserId(ctx.user.id);
      if (!candidate) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only candidates can view their offers"
        });
      }

      return await db.getOffersByCandidate(candidate.id);
    }),

  /**
   * Send offer to candidate
   */
  sendOffer: protectedProcedure
    .input(z.object({
      offerId: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      const offer = await db.getOfferById(input.offerId);
      
      if (!offer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Offer not found"
        });
      }

      // Check authorization
      const recruiter = await db.getRecruiterByUserId(ctx.user.id);
      if (!recruiter || offer.recruiterId !== recruiter.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to send this offer"
        });
      }

      // Update offer status
      await db.updateOffer(input.offerId, {
        status: "sent",
        sentAt: new Date()
      });

      // TODO: Send email notification to candidate

      return { success: true };
    }),

  /**
   * Candidate accepts offer
   */
  acceptOffer: protectedProcedure
    .input(z.object({
      offerId: z.number(),
      message: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const offer = await db.getOfferById(input.offerId);
      
      if (!offer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Offer not found"
        });
      }

      // Check authorization
      const candidate = await db.getCandidateByUserId(ctx.user.id);
      if (!candidate || offer.candidateId !== candidate.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to accept this offer"
        });
      }

      // Update offer status
      await db.updateOffer(input.offerId, {
        status: "accepted",
        acceptedAt: new Date(),
        respondedAt: new Date(),
        candidateResponse: input.message
      });

      // TODO: Send notification to recruiter
      // TODO: Create onboarding checklist

      return { success: true };
    }),

  /**
   * Candidate rejects offer
   */
  rejectOffer: protectedProcedure
    .input(z.object({
      offerId: z.number(),
      reason: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const offer = await db.getOfferById(input.offerId);
      
      if (!offer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Offer not found"
        });
      }

      // Check authorization
      const candidate = await db.getCandidateByUserId(ctx.user.id);
      if (!candidate || offer.candidateId !== candidate.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to reject this offer"
        });
      }

      // Update offer status
      await db.updateOffer(input.offerId, {
        status: "rejected",
        rejectedAt: new Date(),
        respondedAt: new Date(),
        rejectionReason: input.reason
      });

      // TODO: Send notification to recruiter

      return { success: true };
    }),

  /**
   * Withdraw offer (recruiter)
   */
  withdrawOffer: protectedProcedure
    .input(z.object({
      offerId: z.number(),
      reason: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const offer = await db.getOfferById(input.offerId);
      
      if (!offer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Offer not found"
        });
      }

      // Check authorization
      const recruiter = await db.getRecruiterByUserId(ctx.user.id);
      if (!recruiter || offer.recruiterId !== recruiter.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to withdraw this offer"
        });
      }

      // Update offer status
      await db.updateOffer(input.offerId, {
        status: "withdrawn",
        withdrawnAt: new Date(),
        internalNotes: input.reason
      });

      // TODO: Send notification to candidate

      return { success: true };
    }),

  /**
   * Update offer (while in draft)
   */
  updateOffer: protectedProcedure
    .input(z.object({
      offerId: z.number(),
      updates: z.object({
        offerTitle: z.string().optional(),
        baseSalary: z.number().optional(),
        signOnBonus: z.number().optional(),
        performanceBonus: z.number().optional(),
        equityShares: z.number().optional(),
        equityValue: z.number().optional(),
        otherCompensation: z.string().optional(),
        healthInsurance: z.boolean().optional(),
        dentalInsurance: z.boolean().optional(),
        visionInsurance: z.boolean().optional(),
        retirement401k: z.boolean().optional(),
        retirement401kMatch: z.string().optional(),
        paidTimeOff: z.number().optional(),
        sickLeave: z.number().optional(),
        parentalLeave: z.number().optional(),
        otherBenefits: z.string().optional(),
        startDate: z.string().optional(),
        workLocation: z.string().optional(),
        workType: z.enum(["remote", "hybrid", "onsite"]).optional(),
        department: z.string().optional(),
        reportingTo: z.string().optional(),
        probationPeriod: z.number().optional(),
        noticePeriod: z.number().optional(),
        nonCompeteClause: z.boolean().optional(),
        nonCompeteDuration: z.number().optional(),
        relocationAssistance: z.boolean().optional(),
        relocationAmount: z.number().optional(),
        recruiterNotes: z.string().optional(),
        internalNotes: z.string().optional(),
        expiresAt: z.string().optional(),
      })
    }))
    .mutation(async ({ input, ctx }) => {
      const offer = await db.getOfferById(input.offerId);
      
      if (!offer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Offer not found"
        });
      }

      // Check authorization
      const recruiter = await db.getRecruiterByUserId(ctx.user.id);
      if (!recruiter || offer.recruiterId !== recruiter.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this offer"
        });
      }

      // Only allow updates if offer is in draft or negotiating status
      if (offer.status !== "draft" && offer.status !== "negotiating") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only update offers in draft or negotiating status"
        });
      }

      // Recalculate total compensation if any compensation fields changed
      let totalCompensation = offer.totalCompensation;
      if (input.updates.baseSalary !== undefined || 
          input.updates.signOnBonus !== undefined ||
          input.updates.performanceBonus !== undefined ||
          input.updates.equityValue !== undefined) {
        totalCompensation = 
          (input.updates.baseSalary ?? offer.baseSalary) +
          (input.updates.signOnBonus ?? offer.signOnBonus) +
          (input.updates.performanceBonus ?? offer.performanceBonus) +
          (input.updates.equityValue ?? offer.equityValue);
      }

      // Prepare update object
      const updateData: any = {
        ...input.updates,
        totalCompensation
      };

      // Convert date strings to Date objects
      if (input.updates.startDate) {
        updateData.startDate = new Date(input.updates.startDate);
      }
      if (input.updates.expiresAt) {
        updateData.expiresAt = new Date(input.updates.expiresAt);
      }

      await db.updateOffer(input.offerId, updateData);

      return { success: true };
    }),

  /**
   * Start negotiation
   */
  startNegotiation: protectedProcedure
    .input(z.object({
      offerId: z.number(),
      message: z.string(),
      proposedSalary: z.number().optional(),
      proposedSignOnBonus: z.number().optional(),
      proposedStartDate: z.string().optional(),
      proposedWorkType: z.string().optional(),
      proposedPTO: z.number().optional(),
      otherRequests: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const offer = await db.getOfferById(input.offerId);
      
      if (!offer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Offer not found"
        });
      }

      // Check authorization (candidate initiating negotiation)
      const candidate = await db.getCandidateByUserId(ctx.user.id);
      if (!candidate || offer.candidateId !== candidate.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to negotiate this offer"
        });
      }

      // Create negotiation entry
      const proposedChanges = {
        salary: input.proposedSalary,
        signOnBonus: input.proposedSignOnBonus,
        startDate: input.proposedStartDate,
        workType: input.proposedWorkType,
        pto: input.proposedPTO,
        other: input.otherRequests
      };

      await db.createOfferNegotiation({
        offerId: input.offerId,
        initiatedBy: "candidate",
        userId: ctx.user.id,
        message: input.message,
        proposedChanges: JSON.stringify(proposedChanges),
        proposedSalary: input.proposedSalary,
        proposedSignOnBonus: input.proposedSignOnBonus,
        proposedStartDate: input.proposedStartDate ? new Date(input.proposedStartDate) : undefined,
        proposedWorkType: input.proposedWorkType,
        proposedPTO: input.proposedPTO,
        otherRequests: input.otherRequests,
        status: "pending"
      });

      // Update offer status to negotiating
      await db.updateOffer(input.offerId, {
        status: "negotiating"
      });

      // TODO: Send notification to recruiter

      return { success: true };
    }),

  /**
   * Respond to negotiation
   */
  respondToNegotiation: protectedProcedure
    .input(z.object({
      negotiationId: z.number(),
      status: z.enum(["accepted", "rejected", "countered"]),
      message: z.string(),
      // Counter-offer fields
      proposedSalary: z.number().optional(),
      proposedSignOnBonus: z.number().optional(),
      proposedStartDate: z.string().optional(),
      proposedWorkType: z.string().optional(),
      proposedPTO: z.number().optional(),
      otherRequests: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Update negotiation status
      await db.updateOfferNegotiation(input.negotiationId, {
        status: input.status,
        respondedAt: new Date(),
        responseMessage: input.message
      });

      // If countered, create new negotiation entry
      if (input.status === "countered") {
        // Get the original negotiation to find the offer
        const negotiations = await db.getOfferNegotiations(input.negotiationId);
        if (negotiations.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Negotiation not found"
          });
        }

        const proposedChanges = {
          salary: input.proposedSalary,
          signOnBonus: input.proposedSignOnBonus,
          startDate: input.proposedStartDate,
          workType: input.proposedWorkType,
          pto: input.proposedPTO,
          other: input.otherRequests
        };

        // Determine who is responding (recruiter or candidate)
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        const initiatedBy = recruiter ? "recruiter" : "candidate";

        await db.createOfferNegotiation({
          offerId: negotiations[0].offerId!,
          initiatedBy: initiatedBy as "recruiter" | "candidate",
          userId: ctx.user.id,
          message: input.message,
          proposedChanges: JSON.stringify(proposedChanges),
          proposedSalary: input.proposedSalary,
          proposedSignOnBonus: input.proposedSignOnBonus,
          proposedStartDate: input.proposedStartDate ? new Date(input.proposedStartDate) : undefined,
          proposedWorkType: input.proposedWorkType,
          proposedPTO: input.proposedPTO,
          otherRequests: input.otherRequests,
          status: "pending"
        });
      }

      // TODO: Send notification to other party

      return { success: true };
    }),

  /**
   * Get negotiation history for an offer
   */
  getOfferNegotiations: protectedProcedure
    .input(z.object({
      offerId: z.number()
    }))
    .query(async ({ input, ctx }) => {
      const offer = await db.getOfferById(input.offerId);
      
      if (!offer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Offer not found"
        });
      }

      // Check authorization
      const recruiter = await db.getRecruiterByUserId(ctx.user.id);
      const candidate = await db.getCandidateByUserId(ctx.user.id);
      
      const isRecruiter = recruiter && offer.recruiterId === recruiter.id;
      const isCandidate = candidate && offer.candidateId === candidate.id;

      if (!isRecruiter && !isCandidate) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view negotiations"
        });
      }

      return await db.getOfferNegotiations(input.offerId);
    }),

  /**
   * Get offer statistics for recruiter
   */
  getOfferStats: protectedProcedure
    .query(async ({ ctx }) => {
      const recruiter = await db.getRecruiterByUserId(ctx.user.id);
      if (!recruiter) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only recruiters can view offer statistics"
        });
      }

      return await db.getOfferStatsByRecruiter(recruiter.id);
    }),

  /**
   * Get offer templates
   */
  getOfferTemplates: protectedProcedure
    .query(async ({ ctx }) => {
      const recruiter = await db.getRecruiterByUserId(ctx.user.id);
      if (!recruiter) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only recruiters can view offer templates"
        });
      }

      return await db.getOfferTemplatesByRecruiter(recruiter.id);
    }),

  /**
   * Create offer template
   */
  createOfferTemplate: protectedProcedure
    .input(z.object({
      templateName: z.string(),
      jobTitle: z.string(),
      department: z.string().optional(),
      salaryType: z.enum(["annual", "hourly", "contract"]),
      minSalary: z.number(),
      maxSalary: z.number(),
      typicalSignOnBonus: z.number().optional(),
      typicalPerformanceBonus: z.number().optional(),
      benefits: z.string().optional(),
      workType: z.enum(["remote", "hybrid", "onsite"]),
      probationPeriod: z.number().optional(),
      noticePeriod: z.number().optional(),
      offerLetterTemplate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const recruiter = await db.getRecruiterByUserId(ctx.user.id);
      if (!recruiter) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only recruiters can create offer templates"
        });
      }

      const templateId = await db.createOfferTemplate({
        recruiterId: recruiter.id,
        templateName: input.templateName,
        jobTitle: input.jobTitle,
        department: input.department,
        salaryType: input.salaryType,
        minSalary: input.minSalary,
        maxSalary: input.maxSalary,
        typicalSignOnBonus: input.typicalSignOnBonus || 0,
        typicalPerformanceBonus: input.typicalPerformanceBonus || 0,
        benefits: input.benefits,
        workType: input.workType,
        probationPeriod: input.probationPeriod,
        noticePeriod: input.noticePeriod,
        offerLetterTemplate: input.offerLetterTemplate,
        isActive: true,
        usageCount: 0
      });

      return { success: true, templateId };
    }),

  /**
   * Use offer template to create offer
   */
  createOfferFromTemplate: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      applicationId: z.number(),
      jobId: z.number(),
      candidateId: z.number(),
      baseSalary: z.number(),
      startDate: z.string().optional(),
      workLocation: z.string(),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const recruiter = await db.getRecruiterByUserId(ctx.user.id);
      if (!recruiter) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only recruiters can create offers"
        });
      }

      // Get template
      const template = await db.getOfferTemplateById(input.templateId);
      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found"
        });
      }

      // Create offer from template
      const totalCompensation = 
        input.baseSalary +
        (template.typicalSignOnBonus || 0) +
        (template.typicalPerformanceBonus || 0);

      const offerId = await db.createOffer({
        applicationId: input.applicationId,
        jobId: input.jobId,
        candidateId: input.candidateId,
        recruiterId: recruiter.id,
        offerTitle: template.jobTitle,
        salaryType: template.salaryType,
        baseSalary: input.baseSalary,
        signOnBonus: template.typicalSignOnBonus || 0,
        performanceBonus: template.typicalPerformanceBonus || 0,
        totalCompensation,
        workLocation: input.workLocation,
        workType: template.workType,
        department: template.department,
        probationPeriod: template.probationPeriod,
        noticePeriod: template.noticePeriod,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        status: "draft",
      });

      // Increment template usage
      await db.incrementOfferTemplateUsage(input.templateId);

      return { success: true, offerId };
    }),
});
