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
    const recentActivity = await db.getCompanyActivityLogs(ctx.user.companyId, 5);
    
    return {
      ...stats,
      recentActivity: recentActivity.map(log => ({
        action: log.action,
        user: log.userName || 'Unknown User',
        time: new Date(log.createdAt).toLocaleString(),
      })),
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
});
