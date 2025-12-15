import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { processInterviewReminders, getUpcomingInterviewsForCandidate } from "../interviewReminderService";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
  
  /**
   * Process pending interview reminders
   * This endpoint should be called periodically (e.g., every 15 minutes)
   */
  processInterviewReminders: adminProcedure
    .mutation(async () => {
      const results = await processInterviewReminders();
      return {
        success: true,
        sent24h: results.sent24h,
        sent1h: results.sent1h,
        errors: results.errors,
      };
    }),
});
