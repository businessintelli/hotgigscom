import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getProfileCompletionStats,
  getProfileCompletionCorrelation,
  getHistoricalAnalytics,
} from "./profileAnalyticsHelpers";

export const profileAnalyticsRouter = router({
  /**
   * Get current profile completion statistics
   * Only accessible to recruiters and admins
   */
  getCompletionStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'recruiter' && ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only recruiters and admins can access analytics',
      });
    }

    return await getProfileCompletionStats();
  }),

  /**
   * Get profile completion correlation with placement success
   * Only accessible to recruiters and admins
   */
  getCompletionCorrelation: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'recruiter' && ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only recruiters and admins can access analytics',
      });
    }

    return await getProfileCompletionCorrelation();
  }),

  /**
   * Get historical analytics data
   * Only accessible to recruiters and admins
   */
  getHistoricalData: protectedProcedure
    .input(z.object({
      days: z.number().min(7).max(365).default(30),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'recruiter' && ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only recruiters and admins can access analytics',
        });
      }

      return await getHistoricalAnalytics(input.days);
    }),
});
