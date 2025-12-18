import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { 
  getBudgetStatus, 
  canUseAIFeatures, 
  trackSpending,
  enableBudgetOverride,
  disableBudgetOverride,
  pauseAIFeatures
} from "../services/budgetEnforcement";
import { TRPCError } from "@trpc/server";

/**
 * Budget Management Router
 * 
 * Handles company budget configuration, monitoring, and enforcement
 */

export const budgetManagementRouter = router({
  // Get budget status for a company
  getBudgetStatus: protectedProcedure
    .input(z.object({
      companyId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      // Check if user has access to this company
      if (ctx.user.role !== 'admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const status = await getBudgetStatus(input.companyId);
      
      if (!status) {
        // No budget configured, return default
        return {
          companyId: input.companyId,
          monthlyLimit: 500,
          currentSpending: 0,
          percentageUsed: 0,
          isPaused: false,
          isOverBudget: false,
          gracePeriodRemaining: null,
          overrideEnabled: false,
        };
      }

      return status;
    }),

  // Get all company budgets (admin only)
  getAllBudgets: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const budgets = await db.getAllCompanyBudgets();
      return budgets;
    }),

  // Create or update company budget
  configureBudget: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      monthlyLimit: z.number().min(0),
      alertThreshold: z.number().min(0).max(100).optional(),
      gracePeriodHours: z.number().min(0).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if user has access to this company
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'company_admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      if (ctx.user.role === 'company_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      // Check if budget exists
      const existing = await db.getCompanyBudget(input.companyId);

      if (existing) {
        // Update existing budget
        await db.updateCompanyBudget(input.companyId, {
          monthlyLimit: input.monthlyLimit,
          alertThreshold: input.alertThreshold,
          gracePeriodHours: input.gracePeriodHours,
        });
      } else {
        // Create new budget
        await db.createCompanyBudget({
          companyId: input.companyId,
          monthlyLimit: input.monthlyLimit,
          alertThreshold: input.alertThreshold,
          gracePeriodHours: input.gracePeriodHours,
        });
      }

      return { success: true };
    }),

  // Enable budget override (admin only)
  enableOverride: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      await enableBudgetOverride(input.companyId, ctx.user.id, input.reason);

      return { success: true };
    }),

  // Disable budget override (admin only)
  disableOverride: protectedProcedure
    .input(z.object({
      companyId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      await disableBudgetOverride(input.companyId);

      return { success: true };
    }),

  // Manually pause AI features (admin only)
  pauseAIFeatures: protectedProcedure
    .input(z.object({
      companyId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      await pauseAIFeatures(input.companyId);

      return { success: true };
    }),

  // Check if company can use AI features
  canUseAIFeatures: protectedProcedure
    .input(z.object({
      companyId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      // Check if user has access to this company
      if (ctx.user.role !== 'admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const canUse = await canUseAIFeatures(input.companyId);

      return { canUse };
    }),

  // Reset monthly spending (admin only, typically run via cron)
  resetMonthlySpending: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const { resetMonthlySpending } = await import("../services/budgetEnforcement");
      await resetMonthlySpending();

      return { success: true };
    }),

  // Initialize default budgets for all companies without budgets
  initializeDefaultBudgets: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const companies = await db.getAllCompanies();
      let initialized = 0;

      for (const company of companies) {
        const existing = await db.getCompanyBudget(company.id);
        
        if (!existing) {
          await db.createCompanyBudget({
            companyId: company.id,
            monthlyLimit: 500, // Default $500/month
            alertThreshold: 80, // Alert at 80%
            gracePeriodHours: 24, // 24 hour grace period
          });
          initialized++;
        }
      }

      return { success: true, initialized };
    }),
});
