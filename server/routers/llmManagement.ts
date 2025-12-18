/**
 * tRPC router for LLM Management (Alerts, Cost Tracking, Fallback)
 * Role-based access: Admin for system-wide, Company Admin for company-specific
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import * as costTracking from "../services/llmCostTracking";
import * as alertService from "../services/llmAlertService";
import * as fallbackService from "../services/llmFallback";

// Validation schemas
const alertTypeSchema = z.enum(["usage_threshold", "cost_threshold", "error_rate", "provider_failure"]);
const periodSchema = z.enum(["hourly", "daily", "weekly", "monthly"]);

const createAlertSchema = z.object({
  companyId: z.number().optional(),
  alertType: alertTypeSchema,
  threshold: z.number().positive(),
  period: periodSchema,
  emailRecipients: z.string().email().or(z.string().regex(/^[\w\s,.-]+@[\w.-]+\.\w{2,}(,\s*[\w\s,.-]+@[\w.-]+\.\w{2,})*$/)),
  enabled: z.boolean().optional(),
});

const updateAlertSchema = z.object({
  id: z.number(),
  threshold: z.number().positive().optional(),
  period: periodSchema.optional(),
  emailRecipients: z.string().optional(),
  enabled: z.boolean().optional(),
});

const costStatsSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  companyId: z.number().optional(),
});

const fallbackConfigSchema = z.object({
  priority: z.number().int().min(1).max(10),
  provider: z.enum(["manus", "gemini", "openai", "ollama"]),
  enabled: z.boolean(),
  maxRetries: z.number().int().min(1).max(10).optional(),
  retryDelayMs: z.number().int().min(100).max(10000).optional(),
});

// Admin-only middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only application admins can access system-wide LLM management",
    });
  }
  return next({ ctx });
});

// Company Admin middleware (can access own company data)
const companyAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Get user's company
  const db = await getDb();
  const recruiter = await db
    .select("*")
    .from("recruiters")
    .where("userId", ctx.user.id)
    .first();

  if (!recruiter || !recruiter.companyId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only company admins can access company-specific data",
    });
  }

  return next({
    ctx: {
      ...ctx,
      companyId: recruiter.companyId,
    },
  });
});

export const llmManagementRouter = router({
  // ========== USAGE ALERTS ==========
  
  /**
   * Create usage alert (Admin: system-wide, Company Admin: company-specific)
   */
  createAlert: protectedProcedure
    .input(createAlertSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      // Validate permissions
      if (input.companyId) {
        // Company-specific alert
        const recruiter = await db
          .select("*")
          .from("recruiters")
          .where("userId", ctx.user.id)
          .first();
        
        if (!recruiter || recruiter.companyId !== input.companyId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only create alerts for your own company",
          });
        }
      } else {
        // System-wide alert - admin only
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can create system-wide alerts",
          });
        }
      }
      
      const [alertId] = await db.insert({
        userId: ctx.user.id,
        companyId: input.companyId || null,
        alertType: input.alertType,
        threshold: input.threshold,
        period: input.period,
        emailRecipients: input.emailRecipients,
        enabled: input.enabled ?? true,
      }).into("llm_usage_alerts");
      
      return { success: true, alertId };
    }),

  /**
   * Get all alerts (Admin: all, Company Admin: company-specific)
   */
  getAlerts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    
    let query = db.select("*").from("llm_usage_alerts");
    
    // If not admin, filter by company
    if (ctx.user.role !== "admin") {
      const recruiter = await db
        .select("*")
        .from("recruiters")
        .where("userId", ctx.user.id)
        .first();
      
      if (recruiter?.companyId) {
        query = query.where("companyId", recruiter.companyId);
      }
    }
    
    return await query.orderBy("createdAt", "desc");
  }),

  /**
   * Update alert
   */
  updateAlert: protectedProcedure
    .input(updateAlertSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      // Check ownership
      const alert = await db
        .select("*")
        .from("llm_usage_alerts")
        .where("id", input.id)
        .first();
      
      if (!alert) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Alert not found" });
      }
      
      // Validate permissions
      if (alert.companyId) {
        const recruiter = await db
          .select("*")
          .from("recruiters")
          .where("userId", ctx.user.id)
          .first();
        
        if (!recruiter || recruiter.companyId !== alert.companyId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only update alerts for your own company",
          });
        }
      } else if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update system-wide alerts",
        });
      }
      
      const { id, ...updates } = input;
      await db
        .update(updates)
        .table("llm_usage_alerts")
        .where("id", id);
      
      return { success: true };
    }),

  /**
   * Delete alert
   */
  deleteAlert: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      // Check ownership
      const alert = await db
        .select("*")
        .from("llm_usage_alerts")
        .where("id", input.id)
        .first();
      
      if (!alert) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Alert not found" });
      }
      
      // Validate permissions
      if (alert.companyId) {
        const recruiter = await db
          .select("*")
          .from("recruiters")
          .where("userId", ctx.user.id)
          .first();
        
        if (!recruiter || recruiter.companyId !== alert.companyId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete alerts for your own company",
          });
        }
      } else if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete system-wide alerts",
        });
      }
      
      await db
        .delete()
        .from("llm_usage_alerts")
        .where("id", input.id);
      
      return { success: true };
    }),

  /**
   * Get alert history
   */
  getAlertHistory: protectedProcedure
    .input(z.object({
      limit: z.number().optional(),
      offset: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      
      let query = db
        .select({
          history: "llm_alert_history.*",
          alert: "llm_usage_alerts.*",
        })
        .from("llm_alert_history")
        .leftJoin("llm_usage_alerts", "llm_alert_history.alertId", "llm_usage_alerts.id")
        .orderBy("llm_alert_history.triggeredAt", "desc");
      
      // Filter by company if not admin
      if (ctx.user.role !== "admin") {
        const recruiter = await db
          .select("*")
          .from("recruiters")
          .where("userId", ctx.user.id)
          .first();
        
        if (recruiter?.companyId) {
          query = query.where("llm_usage_alerts.companyId", recruiter.companyId);
        }
      }
      
      if (input.limit) {
        query = query.limit(input.limit);
      }
      
      if (input.offset) {
        query = query.offset(input.offset);
      }
      
      return await query;
    }),

  // ========== COST TRACKING ==========
  
  /**
   * Get cost statistics
   */
  getCostStats: protectedProcedure
    .input(costStatsSchema)
    .query(async ({ input, ctx }) => {
      // If company ID provided, validate access
      if (input.companyId && ctx.user.role !== "admin") {
        const db = await getDb();
        const recruiter = await db
          .select("*")
          .from("recruiters")
          .where("userId", ctx.user.id)
          .first();
        
        if (!recruiter || recruiter.companyId !== input.companyId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view your own company's cost data",
          });
        }
      }
      
      return await costTracking.getCostStats(
        input.startDate,
        input.endDate,
        input.companyId
      );
    }),

  /**
   * Get total cost
   */
  getTotalCost: protectedProcedure
    .input(costStatsSchema)
    .query(async ({ input, ctx }) => {
      if (input.companyId && ctx.user.role !== "admin") {
        const db = await getDb();
        const recruiter = await db
          .select("*")
          .from("recruiters")
          .where("userId", ctx.user.id)
          .first();
        
        if (!recruiter || recruiter.companyId !== input.companyId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view your own company's cost data",
          });
        }
      }
      
      return await costTracking.getTotalCost(
        input.startDate,
        input.endDate,
        input.companyId
      );
    }),

  /**
   * Get cost by provider
   */
  getCostByProvider: protectedProcedure
    .input(costStatsSchema)
    .query(async ({ input, ctx }) => {
      if (input.companyId && ctx.user.role !== "admin") {
        const db = await getDb();
        const recruiter = await db
          .select("*")
          .from("recruiters")
          .where("userId", ctx.user.id)
          .first();
        
        if (!recruiter || recruiter.companyId !== input.companyId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view your own company's cost data",
          });
        }
      }
      
      return await costTracking.getCostByProvider(
        input.startDate,
        input.endDate,
        input.companyId
      );
    }),

  /**
   * Get cost by feature
   */
  getCostByFeature: protectedProcedure
    .input(costStatsSchema)
    .query(async ({ input, ctx }) => {
      if (input.companyId && ctx.user.role !== "admin") {
        const db = await getDb();
        const recruiter = await db
          .select("*")
          .from("recruiters")
          .where("userId", ctx.user.id)
          .first();
        
        if (!recruiter || recruiter.companyId !== input.companyId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view your own company's cost data",
          });
        }
      }
      
      return await costTracking.getCostByFeature(
        input.startDate,
        input.endDate,
        input.companyId
      );
    }),

  /**
   * Get daily cost trend
   */
  getDailyCostTrend: protectedProcedure
    .input(costStatsSchema)
    .query(async ({ input, ctx }) => {
      if (input.companyId && ctx.user.role !== "admin") {
        const db = await getDb();
        const recruiter = await db
          .select("*")
          .from("recruiters")
          .where("userId", ctx.user.id)
          .first();
        
        if (!recruiter || recruiter.companyId !== input.companyId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view your own company's cost data",
          });
        }
      }
      
      return await costTracking.getDailyCostTrend(
        input.startDate,
        input.endDate,
        input.companyId
      );
    }),

  /**
   * Project monthly cost
   */
  projectMonthlyCost: protectedProcedure
    .input(z.object({ companyId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      if (input.companyId && ctx.user.role !== "admin") {
        const db = await getDb();
        const recruiter = await db
          .select("*")
          .from("recruiters")
          .where("userId", ctx.user.id)
          .first();
        
        if (!recruiter || recruiter.companyId !== input.companyId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view your own company's cost projections",
          });
        }
      }
      
      return await costTracking.projectMonthlyCost(input.companyId);
    }),

  // ========== PROVIDER FALLBACK ==========
  
  /**
   * Get fallback chain configuration (Admin only)
   */
  getFallbackChain: adminProcedure.query(async () => {
    return await fallbackService.getFallbackChain();
  }),

  /**
   * Update fallback configuration (Admin only)
   */
  updateFallbackConfig: adminProcedure
    .input(fallbackConfigSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      // Check if config exists
      const existing = await db
        .select("*")
        .from("llm_fallback_config")
        .where("provider", input.provider)
        .first();
      
      if (existing) {
        await db
          .update(input)
          .table("llm_fallback_config")
          .where("provider", input.provider);
      } else {
        await db.insert({
          ...input,
          maxRetries: input.maxRetries || 3,
          retryDelayMs: input.retryDelayMs || 1000,
          healthCheckIntervalMs: 60000,
          isHealthy: true,
          failureCount: 0,
        }).into("llm_fallback_config");
      }
      
      return { success: true };
    }),

  /**
   * Get fallback statistics (Admin only)
   */
  getFallbackStats: adminProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ input }) => {
      return await fallbackService.getFallbackStats(input.startDate, input.endDate);
    }),

  /**
   * Get provider health status (Admin only)
   */
  getProviderHealth: adminProcedure.query(async () => {
    return await fallbackService.getProviderHealthStatus();
  }),

  /**
   * Trigger manual health check (Admin only)
   */
  triggerHealthCheck: adminProcedure.mutation(async () => {
    await fallbackService.performHealthChecks();
    return { success: true, message: "Health checks completed" };
  }),
});
