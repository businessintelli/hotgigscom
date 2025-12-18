import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

/**
 * Middleware to ensure user is a company admin
 */
const companyAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'company_admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only company admins can access this resource',
    });
  }
  return next({ ctx });
});

export const companyAdminRouter = router({
  // ============================================
  // COMPANY SETTINGS
  // ============================================
  
  getSettings: companyAdminProcedure.query(async ({ ctx }) => {
    if (!ctx.user.companyId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User is not associated with a company',
      });
    }
    
    return await db.getCompanySettings(ctx.user.companyId);
  }),
  
  updateSettings: companyAdminProcedure
    .input(z.object({
      sendgridApiKey: z.string().optional(),
      resendApiKey: z.string().optional(),
      openaiApiKey: z.string().optional(),
      linkedinApiKey: z.string().optional(),
      fromEmail: z.string().email().optional(),
      fromName: z.string().optional(),
      replyToEmail: z.string().email().optional(),
      enableEmailNotifications: z.boolean().optional(),
      enableSmsNotifications: z.boolean().optional(),
      companyLogo: z.string().url().optional(),
      primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      additionalSettings: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is not associated with a company',
        });
      }
      
      await db.upsertCompanySettings({
        companyId: ctx.user.companyId,
        ...input,
      });
      
      // Log the activity
      await db.logUserActivity({
        userId: ctx.user.id,
        companyId: ctx.user.companyId,
        action: 'update_company_settings',
        resource: 'company_settings',
        details: { updatedFields: Object.keys(input) },
      });
      
      return { success: true };
    }),
  
  // ============================================
  // USER MANAGEMENT
  // ============================================
  
  getCompanyUsers: companyAdminProcedure.query(async ({ ctx }) => {
    if (!ctx.user.companyId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User is not associated with a company',
      });
    }
    
    return await db.getCompanyUsers(ctx.user.companyId);
  }),
  
  updateUserRole: companyAdminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(['admin', 'company_admin', 'recruiter', 'candidate']),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is not associated with a company',
        });
      }
      
      // Verify the user belongs to the same company
      const targetUser = await db.getUserById(input.userId);
      if (!targetUser || targetUser.companyId !== ctx.user.companyId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot modify users from other companies',
        });
      }
      
      await db.updateUserRole(input.userId, input.role);
      
      // Log the activity
      await db.logUserActivity({
        userId: ctx.user.id,
        companyId: ctx.user.companyId,
        action: 'update_user_role',
        resource: 'user',
        resourceId: input.userId,
        details: { newRole: input.role },
      });
      
      return { success: true };
    }),
  
  // ============================================
  // COMPANY STATISTICS & ANALYTICS
  // ============================================
  
  getCompanyStats: companyAdminProcedure.query(async ({ ctx }) => {
    if (!ctx.user.companyId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User is not associated with a company',
      });
    }
    
    return await db.getCompanyStats(ctx.user.companyId);
  }),
  
  getDashboardStats: companyAdminProcedure.query(async ({ ctx }) => {
    if (!ctx.user.companyId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User is not associated with a company',
      });
    }
    
    const stats = await db.getCompanyStats(ctx.user.companyId);
    const recentActivity = await db.getCompanyActivityLogs(ctx.user.companyId, 10);
    const recruiterPerformance = await db.getRecruiterPerformance(ctx.user.companyId);
    const topRecruiters = recruiterPerformance.slice(0, 5);
    
    // Calculate trends (mock data for now - should be calculated from historical data)
    const jobsTrend = 12;
    const applicationsTrend = 8;
    const recruitersTrend = 0;
    const interviewsTrend = 15;
    
    // Format recent activity with proper types and descriptions
    const formattedActivity = recentActivity.map(log => {
      let type = 'other';
      let title = log.action;
      let description = `by ${log.userName || 'Unknown User'}`;
      
      if (log.action.includes('hire') || log.action.includes('offer_accepted')) {
        type = 'hire';
        title = 'New hire completed';
      } else if (log.action.includes('interview')) {
        type = 'interview';
        title = 'Interview scheduled';
      } else if (log.action.includes('application')) {
        type = 'application';
        title = 'New application received';
      } else if (log.action.includes('reject')) {
        type = 'rejection';
        title = 'Application rejected';
      }
      
      return {
        id: log.id,
        type,
        title,
        description,
        time: new Date(log.createdAt).toLocaleString(),
      };
    });
    
    return {
      // Primary metrics
      totalJobs: stats.totalJobs || 0,
      activeJobs: stats.activeJobs || 0,
      closedJobs: (stats.totalJobs || 0) - (stats.activeJobs || 0),
      totalApplications: stats.totalApplications || 0,
      pendingApplications: stats.pendingApplications || 0,
      activeRecruiters: stats.activeRecruiters || 0,
      totalRecruiters: stats.totalRecruiters || 0,
      interviewsScheduled: stats.interviewsScheduled || 0,
      interviewsCompleted: stats.interviewsCompleted || 0,
      
      // Trends
      jobsTrend,
      applicationsTrend,
      recruitersTrend,
      interviewsTrend,
      
      // Secondary metrics
      placementRate: stats.placementRate || 0,
      avgTimeToHire: stats.avgTimeToHire || 0,
      linkedinCreditsRemaining: stats.linkedinCreditsRemaining || 0,
      linkedinCreditsUsed: stats.linkedinCreditsUsed || 0,
      activeCampaigns: stats.activeCampaigns || 0,
      campaignResponseRate: stats.campaignResponseRate || 0,
      
      // LinkedIn integration
      linkedinConnected: stats.linkedinConnected || false,
      linkedinAccountName: stats.linkedinAccountName || '',
      linkedinCampaignsActive: stats.linkedinCampaignsActive || 0,
      linkedinResponseRate: stats.linkedinResponseRate || 0,
      
      // Top performers
      topRecruiters: topRecruiters.map((r: any) => ({
        id: r.id,
        name: r.name,
        jobsAssigned: r.jobsAssigned || 0,
        placements: r.placements || 0,
        interviewsScheduled: r.interviewsScheduled || 0,
      })),
      
      // Recent activity
      recentActivity: formattedActivity,
    };
  }),
  
  getRecruiterPerformance: companyAdminProcedure.query(async ({ ctx }) => {
    if (!ctx.user.companyId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User is not associated with a company',
      });
    }
    
    return await db.getRecruiterPerformance(ctx.user.companyId);
  }),
  
  // ============================================
  // MASTER LISTS
  // ============================================
  
  getCompanyCandidates: companyAdminProcedure
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is not associated with a company',
        });
      }
      
      const candidates = await db.getCompanyCandidatesForMasterList(ctx.user.companyId, input.search, input.limit);
      return candidates;
    }),
  
  getCompanyJobs: companyAdminProcedure
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is not associated with a company',
        });
      }
      
      const jobs = await db.getCompanyJobsForMasterList(ctx.user.companyId, input.search, input.limit);
      return jobs;
    }),
  
  getCompanyAssociates: companyAdminProcedure
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is not associated with a company',
        });
      }
      
      const associates = await db.getCompanyAssociatesForMasterList(ctx.user.companyId, input.search, input.limit);
      return associates;
    }),
  
  inviteRecruiter: companyAdminProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is not associated with a company',
        });
      }
      
      // Create invitation record
      await db.createRecruiterInvitation({
        companyId: ctx.user.companyId,
        email: input.email,
        name: input.name,
        invitedBy: ctx.user.id,
      });
      
      // Log the activity
      await db.logUserActivity({
        userId: ctx.user.id,
        companyId: ctx.user.companyId,
        action: 'invite_recruiter',
        resource: 'user',
        details: { email: input.email, name: input.name },
      });
      
      return { success: true };
    }),
  
  // ============================================
  // MASTER LISTS (Legacy)
  // ============================================
  
  getAllCandidates: companyAdminProcedure
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().default(100),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is not associated with a company',
        });
      }
      
      const allCandidates = await db.getCompanyCandidates(ctx.user.companyId);
      
      // Apply search filter if provided
      let filtered = allCandidates;
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filtered = allCandidates.filter(item => 
          item.user.name?.toLowerCase().includes(searchLower) ||
          item.user.email?.toLowerCase().includes(searchLower) ||
          item.candidate.title?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply pagination
      const paginated = filtered.slice(input.offset, input.offset + input.limit);
      
      return {
        candidates: paginated,
        total: filtered.length,
      };
    }),
  
  getAllAssociates: companyAdminProcedure
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().default(100),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is not associated with a company',
        });
      }
      
      const allAssociates = await db.getCompanyAssociates(ctx.user.companyId);
      
      // Apply search filter if provided
      let filtered = allAssociates;
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filtered = allAssociates.filter(item => 
          item.associate.name?.toLowerCase().includes(searchLower) ||
          item.associate.email?.toLowerCase().includes(searchLower) ||
          item.recruiter.name?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply pagination
      const paginated = filtered.slice(input.offset, input.offset + input.limit);
      
      return {
        associates: paginated,
        total: filtered.length,
      };
    }),
  
  getAllJobs: companyAdminProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().default(100),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is not associated with a company',
        });
      }
      
      const allJobs = await db.getCompanyJobs(ctx.user.companyId);
      
      // Apply filters
      let filtered = allJobs;
      
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filtered = filtered.filter(item => 
          item.job.title?.toLowerCase().includes(searchLower) ||
          item.job.location?.toLowerCase().includes(searchLower) ||
          item.recruiter.name?.toLowerCase().includes(searchLower)
        );
      }
      
      if (input.status) {
        filtered = filtered.filter(item => item.job.status === input.status);
      }
      
      // Apply pagination
      const paginated = filtered.slice(input.offset, input.offset + input.limit);
      
      return {
        jobs: paginated,
        total: filtered.length,
      };
    }),
  
  // ============================================
  // CUSTOM REPORTS
  // ============================================
  
  createCustomReport: companyAdminProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      selectedFields: z.array(z.string()),
      filters: z.array(z.object({
        field: z.string(),
        operator: z.string(),
        value: z.string(),
      })).optional(),
      groupBy: z.string().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).default('asc'),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is not associated with a company',
        });
      }
      
      return await db.createCustomReport({
        companyId: ctx.user.companyId,
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        selectedFields: input.selectedFields,
        filters: input.filters || [],
        groupBy: input.groupBy,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
      });
    }),
  
  getCustomReports: companyAdminProcedure.query(async ({ ctx }) => {
    if (!ctx.user.companyId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User is not associated with a company',
      });
    }
    
    return await db.getCustomReportsByCompany(ctx.user.companyId);
  }),
  
  getCustomReportById: companyAdminProcedure
    .input(z.object({ reportId: z.number() }))
    .query(async ({ ctx, input }) => {
      const report = await db.getCustomReportById(input.reportId);
      
      if (!report || report.companyId !== ctx.user.companyId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Report not found',
        });
      }
      
      return report;
    }),
  
  updateCustomReport: companyAdminProcedure
    .input(z.object({
      reportId: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      selectedFields: z.array(z.string()).optional(),
      filters: z.array(z.object({
        field: z.string(),
        operator: z.string(),
        value: z.string(),
      })).optional(),
      groupBy: z.string().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const report = await db.getCustomReportById(input.reportId);
      
      if (!report || report.companyId !== ctx.user.companyId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Report not found',
        });
      }
      
      const { reportId, ...updates } = input;
      return await db.updateCustomReport(reportId, updates);
    }),
  
  deleteCustomReport: companyAdminProcedure
    .input(z.object({ reportId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const report = await db.getCustomReportById(input.reportId);
      
      if (!report || report.companyId !== ctx.user.companyId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Report not found',
        });
      }
      
      await db.deleteCustomReport(input.reportId);
      return { success: true };
    }),
  
  // ============================================
  // REPORT SCHEDULES
  // ============================================
  
  createReportSchedule: companyAdminProcedure
    .input(z.object({
      reportId: z.number().optional(),
      reportType: z.string(),
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      dayOfWeek: z.number().optional(),
      dayOfMonth: z.number().optional(),
      timeOfDay: z.string().default('09:00:00'),
      recipients: z.array(z.string().email()),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is not associated with a company',
        });
      }
      
      // Calculate next send time based on frequency
      const now = new Date();
      let nextSendAt = new Date();
      
      if (input.frequency === 'daily') {
        nextSendAt.setDate(now.getDate() + 1);
      } else if (input.frequency === 'weekly') {
        const daysUntilTarget = ((input.dayOfWeek || 0) - now.getDay() + 7) % 7;
        nextSendAt.setDate(now.getDate() + (daysUntilTarget || 7));
      } else if (input.frequency === 'monthly') {
        nextSendAt.setMonth(now.getMonth() + 1);
        nextSendAt.setDate(input.dayOfMonth || 1);
      }
      
      return await db.createReportSchedule({
        companyId: ctx.user.companyId,
        reportId: input.reportId,
        reportType: input.reportType,
        frequency: input.frequency,
        dayOfWeek: input.dayOfWeek,
        dayOfMonth: input.dayOfMonth,
        timeOfDay: input.timeOfDay,
        recipients: input.recipients,
        isActive: true,
        nextSendAt,
      });
    }),
  
  getReportSchedules: companyAdminProcedure.query(async ({ ctx }) => {
    if (!ctx.user.companyId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User is not associated with a company',
      });
    }
    
    return await db.getReportSchedulesByCompany(ctx.user.companyId);
  }),
  
  updateReportSchedule: companyAdminProcedure
    .input(z.object({
      scheduleId: z.number(),
      isActive: z.boolean().optional(),
      frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
      dayOfWeek: z.number().optional(),
      dayOfMonth: z.number().optional(),
      timeOfDay: z.string().optional(),
      recipients: z.array(z.string().email()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const schedule = await db.getReportScheduleById(input.scheduleId);
      
      if (!schedule || schedule.companyId !== ctx.user.companyId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Schedule not found',
        });
      }
      
      const { scheduleId, ...updates } = input;
      return await db.updateReportSchedule(scheduleId, updates);
    }),
  
  deleteReportSchedule: companyAdminProcedure
    .input(z.object({ scheduleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const schedule = await db.getReportScheduleById(input.scheduleId);
      
      if (!schedule || schedule.companyId !== ctx.user.companyId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Schedule not found',
        });
      }
      
      await db.deleteReportSchedule(input.scheduleId);
      return { success: true };
    }),
  
  getReportExecutions: companyAdminProcedure
    .input(z.object({ scheduleId: z.number() }))
    .query(async ({ ctx, input }) => {
      const schedule = await db.getReportScheduleById(input.scheduleId);
      
      if (!schedule || schedule.companyId !== ctx.user.companyId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Schedule not found',
        });
      }
      
      return await db.getReportExecutionsBySchedule(input.scheduleId);
    }),

  // ============================================
  // ACTIVITY LOGS
  // ============================================
  
  getActivityLogs: companyAdminProcedure
    .input(z.object({
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is not associated with a company',
        });
      }
      
      return await db.getCompanyActivityLogs(ctx.user.companyId, input.limit);
    }),
  
  // ============================================
  // AI ASSISTANT
  // ============================================
  
  aiAssistant: companyAdminProcedure
    .input(z.object({
      message: z.string(),
      conversationHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is not associated with a company',
        });
      }
      
      // Import LLM helper
      const { invokeLLM } = await import('../_core/llm');
      
      // Build context with company-wide data
      const companyUsers = await db.getCompanyUsers(ctx.user.companyId);
      const recruiters = companyUsers.filter(u => u.role === 'recruiter');
      
      // Get aggregate stats
      const stats = await db.getCompanyStats(ctx.user.companyId);
      
      // Build system prompt with company context
      const systemPrompt = `You are an AI assistant for a company admin managing recruitment operations.
      
Company Context:
- Total Recruiters: ${recruiters.length}
- Active Jobs: ${stats?.totalJobs || 0}
- Total Applications: ${stats?.totalApplications || 0}
- Total Candidates: ${stats?.totalCandidates || 0}

You have access to company-wide recruitment data. Help the admin with:
- Team performance analysis
- Resource optimization
- Hiring trends and insights
- Strategic recommendations
- Compliance monitoring

Provide data-driven, actionable insights based on the company's recruitment operations.`;
      
      // Build messages array
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...(input.conversationHistory || []).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: input.message },
      ];
      
      // Call LLM
      const response = await invokeLLM({ messages });
      
      return {
        response: response.choices[0].message.content || 'I apologize, but I could not generate a response.',
      };
    }),
  
  // ============================================
  // TEMPLATE SHARING MANAGEMENT
  // ============================================
  
  getPendingTemplateShares: companyAdminProcedure.query(async ({ ctx }) => {
    if (!ctx.user.companyId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User is not associated with a company',
      });
    }
    
    return await db.getPendingTemplateShares(ctx.user.companyId);
  }),
  
  approveTemplateShare: companyAdminProcedure
    .input(z.object({
      shareId: z.number(),
      reviewNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.approveTemplateShare(input.shareId, ctx.user.id, input.reviewNotes);
      
      // Log the activity
      await db.logUserActivity({
        userId: ctx.user.id,
        companyId: ctx.user.companyId!,
        action: 'approve_template_share',
        resource: 'template_shares',
        resourceId: input.shareId,
        details: { reviewNotes: input.reviewNotes },
      });
      
      return { success: true };
    }),
  
  rejectTemplateShare: companyAdminProcedure
    .input(z.object({
      shareId: z.number(),
      reviewNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.rejectTemplateShare(input.shareId, ctx.user.id, input.reviewNotes);
      
      // Log the activity
      await db.logUserActivity({
        userId: ctx.user.id,
        companyId: ctx.user.companyId!,
        action: 'reject_template_share',
        resource: 'template_shares',
        resourceId: input.shareId,
        details: { reviewNotes: input.reviewNotes },
      });
      
      return { success: true };
    }),
  
  // ============================================
  // COMPANY-WIDE DATA AGGREGATION
  // ============================================
  
  getCompanyJobs: companyAdminProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      search: z.string().optional(),
      status: z.string().optional(),
      employmentType: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is not associated with a company',
        });
      }
      
      return await db.getCompanyJobsPaginated(ctx.user.companyId, input);
    }),
  
  getCompanyApplicants: companyAdminProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      search: z.string().optional(),
      status: z.string().optional(),
      jobId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is not associated with a company',
        });
      }
      
      return await db.getCompanyApplicantsPaginated(ctx.user.companyId, input);
    }),
  
  getCompanyCandidates: companyAdminProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      search: z.string().optional(),
      skills: z.string().optional(),
      location: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is not associated with a company',
        });
      }
      
      return await db.getCompanyCandidatesPaginated(ctx.user.companyId, input);
    }),
  
  getCompanyAssociates: companyAdminProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      search: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is not associated with a company',
        });
      }
      
      return await db.getCompanyAssociatesPaginated(ctx.user.companyId, input);
    }),
});
