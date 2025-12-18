import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { testSlackWebhook } from "../services/slackNotifications";
import { testTeamsWebhook } from "../services/teamsNotifications";
import { TRPCError } from "@trpc/server";

/**
 * Integration Settings Router
 * 
 * Handles Slack and Microsoft Teams webhook configuration
 */

export const integrationSettingsRouter = router({
  // Get all integrations for a company
  getCompanyIntegrations: protectedProcedure
    .input(z.object({
      companyId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      // Check if user has access to this company
      if (ctx.user.role !== 'admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const integrations = await db.getIntegrationSettingsByCompany(input.companyId);
      return integrations;
    }),

  // Get all integrations for a user (application admin)
  getUserIntegrations: protectedProcedure
    .query(async ({ ctx }) => {
      const integrations = await db.getIntegrationSettingsByUser(ctx.user.id);
      return integrations;
    }),

  // Create new integration
  createIntegration: protectedProcedure
    .input(z.object({
      companyId: z.number().optional(),
      integrationType: z.enum(['slack', 'teams']),
      webhookUrl: z.string().url(),
      channelName: z.string().optional(),
      enabled: z.boolean().optional(),
      notificationTypes: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate access
      if (input.companyId) {
        // Company-level integration
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'company_admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }

        if (ctx.user.role === 'company_admin' && ctx.user.companyId !== input.companyId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
      }

      const integration = await db.createIntegrationSetting({
        companyId: input.companyId,
        userId: input.companyId ? undefined : ctx.user.id,
        integrationType: input.integrationType,
        webhookUrl: input.webhookUrl,
        channelName: input.channelName,
        enabled: input.enabled,
        notificationTypes: input.notificationTypes,
        createdBy: ctx.user.id,
      });

      return integration;
    }),

  // Update integration
  updateIntegration: protectedProcedure
    .input(z.object({
      id: z.number(),
      webhookUrl: z.string().url().optional(),
      channelName: z.string().optional(),
      enabled: z.boolean().optional(),
      notificationTypes: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get existing integration to check ownership
      const existing = await db.getIntegrationSettingById(input.id);
      
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not found' });
      }

      const existingData = existing as any;

      // Check if user has access
      if (existingData.companyId) {
        if (ctx.user.role !== 'admin' && ctx.user.companyId !== existingData.companyId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
      } else if (existingData.userId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      await db.updateIntegrationSetting(input.id, {
        webhookUrl: input.webhookUrl,
        channelName: input.channelName,
        enabled: input.enabled,
        notificationTypes: input.notificationTypes,
      });

      return { success: true };
    }),

  // Delete integration
  deleteIntegration: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get existing integration to check ownership
      const existing = await db.getIntegrationSettingById(input.id);
      
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not found' });
      }

      const existingData = existing as any;

      // Check if user has access
      if (existingData.companyId) {
        if (ctx.user.role !== 'admin' && ctx.user.companyId !== existingData.companyId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
      } else if (existingData.userId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      await db.deleteIntegrationSetting(input.id);

      return { success: true };
    }),

  // Test integration webhook
  testIntegration: protectedProcedure
    .input(z.object({
      integrationType: z.enum(['slack', 'teams']),
      webhookUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      let success = false;

      if (input.integrationType === 'slack') {
        success = await testSlackWebhook(input.webhookUrl);
      } else if (input.integrationType === 'teams') {
        success = await testTeamsWebhook(input.webhookUrl);
      }

      if (!success) {
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to send test notification. Please check your webhook URL.' 
        });
      }

      return { success: true };
    }),

  // Get delivery logs for an integration
  getDeliveryLogs: protectedProcedure
    .input(z.object({
      integrationId: z.number(),
      limit: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Get integration to check ownership
      const integration = await db.getIntegrationSettingById(input.integrationId);
      
      if (!integration) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not found' });
      }

      const integrationData = integration as any;

      // Check if user has access
      if (integrationData.companyId) {
        if (ctx.user.role !== 'admin' && ctx.user.companyId !== integrationData.companyId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
      } else if (integrationData.userId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const logs = await db.getNotificationDeliveryLogs(input.integrationId, input.limit);
      return logs;
    }),

  // Get all integrations (admin only)
  getAllIntegrations: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      // Get all integrations from database
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not initialized");

      const result = await dbInstance.execute(`
        SELECT 
          i.*,
          c.name as companyName,
          u.name as userName
        FROM integration_settings i
        LEFT JOIN companies c ON i.companyId = c.id
        LEFT JOIN users u ON i.userId = u.id
        ORDER BY i.createdAt DESC
      ` as any);

      return result || [];
    }),
});
