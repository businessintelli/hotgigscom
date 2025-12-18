import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { validateToken, markTokenAsUsed, getTokenDetails } from "./panelTokenService";

export const panelPublicRouter = router({
  // Validate a token and get interview details
  validateToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const validation = await validateToken(input.token);
      
      if (!validation.valid) {
        return {
          valid: false,
          expired: validation.expired || false,
          used: validation.used || false,
          details: null,
        };
      }

      const details = await getTokenDetails(input.token);
      
      return {
        valid: true,
        expired: false,
        used: false,
        actionType: validation.token?.actionType,
        details: details ? {
          panelistName: details.panelist?.name || "Panel Member",
          panelistEmail: details.panelist?.email,
          interviewDate: details.interview?.scheduledAt,
          interviewDuration: details.interview?.duration,
          interviewType: details.interview?.type,
          meetingLink: details.interview?.meetingLink,
          location: details.interview?.location,
          jobTitle: details.job?.title,
          companyName: details.job?.companyName,
          candidateName: details.candidate?.fullName,
        } : null,
      };
    }),

  // Accept interview invitation
  acceptInvitation: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const validation = await validateToken(input.token);
      
      if (!validation.valid) {
        return {
          success: false,
          error: validation.expired ? "Token has expired" : validation.used ? "Token has already been used" : "Invalid token",
        };
      }

      if (validation.token?.actionType !== "accept") {
        return { success: false, error: "Invalid token type" };
      }

      const { interviewPanelists } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const database = await db.getDb();
      if (!database) return { success: false, error: "Database unavailable" };

      // Update panelist status
      await database
        .update(interviewPanelists)
        .set({ status: "accepted" })
        .where(eq(interviewPanelists.id, validation.token.panelistId));

      // Mark token as used
      await markTokenAsUsed(validation.token.id);

      return { success: true };
    }),

  // Decline interview invitation
  declineInvitation: publicProcedure
    .input(z.object({ 
      token: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const validation = await validateToken(input.token);
      
      if (!validation.valid) {
        return {
          success: false,
          error: validation.expired ? "Token has expired" : validation.used ? "Token has already been used" : "Invalid token",
        };
      }

      if (validation.token?.actionType !== "decline") {
        return { success: false, error: "Invalid token type" };
      }

      const { interviewPanelists } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const database = await db.getDb();
      if (!database) return { success: false, error: "Database unavailable" };

      // Update panelist status
      await database
        .update(interviewPanelists)
        .set({ 
          status: "declined",
          // Store decline reason in notes or a new field if needed
        })
        .where(eq(interviewPanelists.id, validation.token.panelistId));

      // Mark token as used
      await markTokenAsUsed(validation.token.id);

      return { success: true };
    }),

  // Request reschedule
  requestReschedule: publicProcedure
    .input(z.object({
      token: z.string(),
      preferredDates: z.array(z.string()).optional(),
      message: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const validation = await validateToken(input.token);
      
      if (!validation.valid) {
        return {
          success: false,
          error: validation.expired ? "Token has expired" : validation.used ? "Token has already been used" : "Invalid token",
        };
      }

      if (validation.token?.actionType !== "reschedule") {
        return { success: false, error: "Invalid token type" };
      }

      const { interviewPanelists } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const database = await db.getDb();
      if (!database) return { success: false, error: "Database unavailable" };

      // Update panelist status - use declined for reschedule requests
      // The reschedule request details are sent to recruiter via notification
      await database
        .update(interviewPanelists)
        .set({ status: "declined", respondedAt: new Date() })
        .where(eq(interviewPanelists.id, validation.token.panelistId));

      // TODO: Send notification to recruiter about reschedule request
      // Include preferredDates and message

      // Mark token as used
      await markTokenAsUsed(validation.token.id);

      return { success: true };
    }),

  // Submit feedback (without login)
  submitFeedback: publicProcedure
    .input(z.object({
      token: z.string(),
      technicalScore: z.number().min(1).max(5),
      communicationScore: z.number().min(1).max(5),
      problemSolvingScore: z.number().min(1).max(5),
      cultureFitScore: z.number().min(1).max(5),
      overallScore: z.number().min(1).max(5),
      strengths: z.string().optional(),
      weaknesses: z.string().optional(),
      notes: z.string().optional(),
      recommendation: z.enum(["strong_hire", "hire", "no_hire", "strong_no_hire"]),
    }))
    .mutation(async ({ input }) => {
      const validation = await validateToken(input.token);
      
      if (!validation.valid) {
        return {
          success: false,
          error: validation.expired ? "Token has expired" : validation.used ? "Token has already been used" : "Invalid token",
        };
      }

      if (validation.token?.actionType !== "feedback") {
        return { success: false, error: "Invalid token type" };
      }

      const { panelistFeedback, interviewPanelists } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const database = await db.getDb();
      if (!database) return { success: false, error: "Database unavailable" };

      // Get panelist to find userId
      const [panelist] = await database
        .select()
        .from(interviewPanelists)
        .where(eq(interviewPanelists.id, validation.token.panelistId));
      
      // Insert feedback
      await database.insert(panelistFeedback).values({
        interviewId: validation.token.interviewId,
        panelistId: validation.token.panelistId,
        userId: panelist?.userId || 0,
        technicalSkills: input.technicalScore,
        communicationSkills: input.communicationScore,
        problemSolving: input.problemSolvingScore,
        cultureFit: input.cultureFitScore,
        overallRating: input.overallScore,
        strengths: input.strengths || null,
        weaknesses: input.weaknesses || null,
        notes: input.notes || null,
        recommendation: input.recommendation,
      });

      // Update panelist status to attended
      await database
        .update(interviewPanelists)
        .set({ status: "attended" })
        .where(eq(interviewPanelists.id, validation.token.panelistId));

      // Mark token as used
      await markTokenAsUsed(validation.token.id);

      return { success: true };
    }),
});
