import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getUserGamificationData, markBadgesAsViewed, checkAndAwardBadges } from "./gamificationHelpers";
import { calculateCandidateCompletion } from "./profileCompletionHelpers";
import { getCandidateByUserId } from "./db";

export const gamificationRouter = router({
  /**
   * Get user's gamification data (badges and points)
   */
  getGamificationData: protectedProcedure.query(async ({ ctx }) => {
    return await getUserGamificationData(ctx.user.id);
  }),

  /**
   * Mark all badges as viewed
   */
  markBadgesViewed: protectedProcedure.mutation(async ({ ctx }) => {
    await markBadgesAsViewed(ctx.user.id);
    return { success: true };
  }),

  /**
   * Check profile completion and award badges
   * Called after profile updates
   */
  checkProfileAndAwardBadges: protectedProcedure.mutation(async ({ ctx }) => {
    // Only for candidates
    if (ctx.user.role !== 'candidate') {
      return { awarded: [] };
    }

    const candidate = await getCandidateByUserId(ctx.user.id);
    if (!candidate) {
      return { awarded: [] };
    }

    const completionPercentage = calculateCandidateCompletion(candidate);
    const awarded = await checkAndAwardBadges(ctx.user.id, completionPercentage);

    return { awarded, completionPercentage };
  }),
});
