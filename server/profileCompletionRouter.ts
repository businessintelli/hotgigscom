import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getDb } from "./db";
import { recruiters, candidates } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { calculateRecruiterCompletion, calculateCandidateCompletion } from "./profileCompletionHelpers";

export const profileCompletionRouter = router({
  /**
   * Get profile completion status for current user
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    
    // Check if user has recruiter or candidate profile
    const recruiter = await db.getRecruiterByUserId(user.id);
    const candidate = await db.getCandidateByUserId(user.id);
    
    if (recruiter) {
      const percentage = calculateRecruiterCompletion(recruiter);
      return {
        role: 'recruiter' as const,
        profileCompleted: recruiter.profileCompleted || false,
        currentStep: recruiter.profileCompletionStep || 0,
        totalSteps: 3, // company info, bio, preferences
        percentage,
      };
    }
    
    if (candidate) {
      const percentage = calculateCandidateCompletion(candidate);
      return {
        role: 'candidate' as const,
        profileCompleted: candidate.profileCompleted || false,
        currentStep: candidate.profileCompletionStep || 0,
        totalSteps: 4, // resume, skills, experience, preferences
        percentage,
      };
    }
    
    return {
      role: 'none' as const,
      profileCompleted: false,
      currentStep: 0,
      totalSteps: 0,
    };
  }),

  /**
   * Update recruiter profile completion step
   */
  updateRecruiterStep: protectedProcedure
    .input(z.object({
      step: z.number().min(0).max(3),
      data: z.object({
        companyName: z.string().optional(),
        phoneNumber: z.string().optional(),
        bio: z.string().optional(),
      }).optional(),
      markCompleted: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const recruiter = await db.getRecruiterByUserId(ctx.user.id);
      if (!recruiter) {
        throw new Error('Recruiter profile not found');
      }

      const dbInstance = await getDb();
      if (!dbInstance) throw new Error('Database not available');

      const updateData: any = {
        profileCompletionStep: input.step,
      };

      if (input.data) {
        if (input.data.companyName !== undefined) updateData.companyName = input.data.companyName;
        if (input.data.phoneNumber !== undefined) updateData.phoneNumber = input.data.phoneNumber;
        if (input.data.bio !== undefined) updateData.bio = input.data.bio;
      }

      if (input.markCompleted) {
        updateData.profileCompleted = true;
      }

      await dbInstance.update(recruiters)
        .set(updateData)
        .where(eq(recruiters.id, recruiter.id));

      return { success: true };
    }),

  /**
   * Update candidate profile completion step
   */
  updateCandidateStep: protectedProcedure
    .input(z.object({
      step: z.number().min(0).max(4),
      data: z.object({
        title: z.string().optional(),
        phoneNumber: z.string().optional(),
        location: z.string().optional(),
        bio: z.string().optional(),
        skills: z.string().optional(),
        experience: z.string().optional(),
        education: z.string().optional(),
        availability: z.string().optional(),
        expectedSalaryMin: z.number().optional(),
        expectedSalaryMax: z.number().optional(),
        willingToRelocate: z.boolean().optional(),
      }).optional(),
      markCompleted: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const candidate = await db.getCandidateByUserId(ctx.user.id);
      if (!candidate) {
        throw new Error('Candidate profile not found');
      }

      const dbInstance = await getDb();
      if (!dbInstance) throw new Error('Database not available');

      const updateData: any = {
        profileCompletionStep: input.step,
      };

      if (input.data) {
        Object.keys(input.data).forEach(key => {
          const value = (input.data as any)[key];
          if (value !== undefined) {
            updateData[key] = value;
          }
        });
      }

      if (input.markCompleted) {
        updateData.profileCompleted = true;
      }

      await dbInstance.update(candidates)
        .set(updateData)
        .where(eq(candidates.id, candidate.id));

      return { success: true };
    }),

  /**
   * Skip onboarding (mark as completed without filling all fields)
   */
  skipOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    const recruiter = await db.getRecruiterByUserId(ctx.user.id);
    const candidate = await db.getCandidateByUserId(ctx.user.id);

    const dbInstance = await getDb();
    if (!dbInstance) throw new Error('Database not available');

    if (recruiter) {
      await dbInstance.update(recruiters)
        .set({ profileCompleted: true })
        .where(eq(recruiters.id, recruiter.id));
      return { success: true, role: 'recruiter' };
    }

    if (candidate) {
      await dbInstance.update(candidates)
        .set({ profileCompleted: true })
        .where(eq(candidates.id, candidate.id));
      return { success: true, role: 'candidate' };
    }

    throw new Error('No profile found');
  }),
});
