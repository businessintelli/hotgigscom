import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { parseResume, calculateMatchScore, generateInterviewQuestions, analyzeResume } from "./aiHelpers";
import { transcribeAudio } from "./_core/voiceTranscription";
import { generateFraudDetectionReport, generateInterviewEvaluationReport } from "./reportGenerator";
import { executeCode } from "./codeExecutor";
import { z } from "zod";
import * as db from "./db";
import { hashPassword, comparePassword, generateSessionToken, isValidEmail, isValidPassword, generateVerificationToken, generateTokenExpiry } from "./auth";
import * as authService from "./authService";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { sendVerificationEmail, sendPasswordResetEmail } from "./authEmails";
import { getDb } from "./db";
import { codingChallenges, codingSubmissions, candidates, emailUnsubscribes, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

import { storagePut } from "./storage";
import { extractResumeText, parseResumeWithAI } from "./resumeParser";
import { sendInterviewInvitation, sendApplicationStatusUpdate } from "./emailNotifications";
import { rankCandidatesForJob, getTopCandidatesForJob, compareCandidates } from './resumeRanking';
import { exportCandidatesToExcel, exportCandidatesToCSV } from './resumeExport';
import * as notificationHelpers from './notificationHelpers';
import * as candidateSearchHelpers from './candidateSearchHelpers';
import * as emailCampaignHelpers from './emailCampaignHelpers';
import * as analyticsHelpers from './analyticsHelpers';
import { resumeProfileRouter } from './resumeProfileRouter';
import { onboardingRouter } from './onboardingRouter';
import { profileCompletionRouter } from './profileCompletionRouter';
import { createVideoMeeting } from './videoMeetingService';

// Helper to generate random suffix for file keys
function randomSuffix() {
  return Math.random().toString(36).substring(2, 15);
}

export const appRouter = router({
  system: systemRouter,
  resumeProfile: resumeProfileRouter,
  onboarding: onboardingRouter,
  profileCompletion: profileCompletionRouter,
  
  user: router({
    createRecruiterProfile: protectedProcedure.mutation(async ({ ctx }) => {
      console.log("[Profile] Creating recruiter profile for user", ctx.user.id);
      const existingRecruiter = await db.getRecruiterByUserId(ctx.user.id);
      if (existingRecruiter) {
        console.log("[Profile] Recruiter profile already exists", existingRecruiter.id);
        throw new Error("Recruiter profile already exists");
      }
      console.log("[Profile] Inserting recruiter into database");
      await db.createRecruiter({
        userId: ctx.user.id,
        companyName: null,
        phoneNumber: null,
        bio: null,
      });
      console.log("[Profile] Recruiter profile created successfully");
      return { success: true };
    }),
    
    createCandidateProfile: protectedProcedure.mutation(async ({ ctx }) => {
      console.log("[Profile] Creating candidate profile for user", ctx.user.id);
      const existingCandidate = await db.getCandidateByUserId(ctx.user.id);
      if (existingCandidate) {
        console.log("[Profile] Candidate profile already exists", existingCandidate.id);
        throw new Error("Candidate profile already exists");
      }
      console.log("[Profile] Inserting candidate into database");
      await db.createCandidate({
        userId: ctx.user.id,
        title: null,
        phoneNumber: null,
        location: null,
        bio: null,
        skills: null,
        experience: null,
        education: null,
      });
      console.log("[Profile] Candidate profile created successfully");
      return { success: true };
    }),
    
    // Get notification preferences
    getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
      const { notificationPreferences } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");
      
      const [prefs] = await database
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, ctx.user.id));
      
      // Return defaults if no preferences exist
      if (!prefs) {
        return {
          statusUpdatesEnabled: true,
          statusUpdatesFrequency: "immediate" as const,
          interviewRemindersEnabled: true,
          interviewReminder24h: true,
          interviewReminder1h: true,
          jobRecommendationsEnabled: true,
          jobRecommendationsFrequency: "weekly" as const,
          marketingEmailsEnabled: false,
          weeklyDigestEnabled: true,
          messageNotificationsEnabled: true,
        };
      }
      
      return prefs;
    }),
    
    // Update notification preferences
    updateNotificationPreferences: protectedProcedure
      .input(z.object({
        statusUpdatesEnabled: z.boolean().optional(),
        statusUpdatesFrequency: z.enum(["immediate", "daily", "weekly"]).optional(),
        interviewRemindersEnabled: z.boolean().optional(),
        interviewReminder24h: z.boolean().optional(),
        interviewReminder1h: z.boolean().optional(),
        jobRecommendationsEnabled: z.boolean().optional(),
        jobRecommendationsFrequency: z.enum(["immediate", "daily", "weekly"]).optional(),
        marketingEmailsEnabled: z.boolean().optional(),
        weeklyDigestEnabled: z.boolean().optional(),
        messageNotificationsEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { notificationPreferences } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        // Check if preferences exist
        const [existing] = await database
          .select()
          .from(notificationPreferences)
          .where(eq(notificationPreferences.userId, ctx.user.id));
        
        if (existing) {
          // Update existing preferences
          await database
            .update(notificationPreferences)
            .set(input)
            .where(eq(notificationPreferences.userId, ctx.user.id));
        } else {
          // Create new preferences
          await database
            .insert(notificationPreferences)
            .values({
              userId: ctx.user.id,
              ...input,
            });
        }
        
        return { success: true };
      }),
  }),
  
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      console.log('[auth.me] Called, user:', ctx.user ? 'EXISTS' : 'NULL');
      if (!ctx.user) return null;
      
      // Try to extract session metadata from Authorization header or cookie
      const authHeader = ctx.req.headers.authorization;
      let sessionToken: string | undefined;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        sessionToken = authHeader.substring(7);
        console.log('[auth.me] Using token from Authorization header');
      } else {
        sessionToken = ctx.req.cookies?.[COOKIE_NAME];
        console.log('[auth.me] Using token from cookie');
      }
      
      let sessionExpiry: Date | null = null;
      let rememberMe = false;
      
      if (sessionToken) {
        try {
          const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
          console.log('[auth.me] Session data parsed successfully');
          if (sessionData.expiry) {
            sessionExpiry = new Date(sessionData.expiry);
          }
          if (sessionData.rememberMe !== undefined) {
            rememberMe = sessionData.rememberMe;
          }
        } catch (e) {
          console.error('[auth.me] Error parsing session data:', e);
        }
      }
      
      const result = {
        ...ctx.user,
        sessionExpiry,
        rememberMe,
        emailVerified: ctx.user.emailVerified ?? false,
      };
      console.log('[auth.me] Returning user:', result.email, 'role:', result.role, 'emailVerified:', result.emailVerified);
      return result;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    
    clearSession: publicProcedure.mutation(({ ctx }) => {
      // Clear session cookie completely
      ctx.res.clearCookie(COOKIE_NAME, { path: '/' });
      return { success: true } as const;
    }),
    
    extendSession: protectedProcedure.mutation(({ ctx }) => {
      // Extend session by 30 days
      const maxAge = 30 * 24 * 60 * 60 * 1000;
      const expiry = new Date(Date.now() + maxAge);
      const sessionData = JSON.stringify({ 
        userId: ctx.user.id, 
        email: ctx.user.email,
        expiry: expiry.toISOString(),
        rememberMe: true
      });
      const encodedSession = Buffer.from(sessionData).toString('base64');
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, encodedSession, { ...cookieOptions, maxAge });
      return { success: true, newExpiry: expiry } as const;
    }),
    
    signup: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
        role: z.enum(['recruiter', 'candidate']),
      }))
      .mutation(async ({ input, ctx }) => {
        // Use new auth service for cleaner, more reliable signup
        const baseUrl = `${ctx.req.protocol}://${ctx.req.get('host')}`;
        const result = await authService.signUp(input, baseUrl);
        
        // Create session token with role information
        const token = authService.encodeSession({
          userId: result.user.id,
          email: result.user.email,
          role: input.role,
          expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          rememberMe: false,
        });
        
        // Also set cookie as fallback
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        return { ...result, token }; // Return token for localStorage storage
      }),
      
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
        rememberMe: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Use new auth service for cleaner, more reliable login
        const result = await authService.signIn(input);
        
        // Encode session as token for localStorage-based auth
        const token = authService.encodeSession(result.sessionData);
        
        // Also set cookie as fallback for environments that support it
        const maxAge = input.rememberMe ? (30 * 24 * 60 * 60 * 1000) : (24 * 60 * 60 * 1000);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge });
        
        return { 
          success: true, 
          user: result.user,
          role: result.user.role,
          token // Return token for localStorage storage
        };
      }),
      
    requestPasswordReset: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Find user
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          // Don't reveal if email exists or not
          return { success: true, message: 'If an account exists with this email, you will receive a password reset link.' };
        }
        
        // Generate reset token
        const resetToken = generateVerificationToken();
        const resetTokenExpiry = generateTokenExpiry(1); // 1 hour
        
        // Update user with reset token
        await db.upsertUser({
          openId: user.openId,
          name: user.name,
          email: user.email,
          passwordHash: user.passwordHash,
          loginMethod: user.loginMethod,
          lastSignedIn: user.lastSignedIn,
          passwordResetToken: resetToken,
          passwordResetTokenExpiry: resetTokenExpiry,
        });
        
        // Send reset email
        const baseUrl = `${ctx.req.protocol}://${ctx.req.get('host')}`;
        await sendPasswordResetEmail(user.email!, user.name || 'User', resetToken, baseUrl);
        
        return { success: true, message: 'If an account exists with this email, you will receive a password reset link.' };
      }),
      
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        // Validate password
        if (!isValidPassword(input.newPassword)) {
          throw new Error('Password must be at least 6 characters and contain both letters and numbers');
        }
        
        // Find user by reset token
        const dbInstance = await getDb();
        if (!dbInstance) throw new Error('Database not available');
        
        const userResults = await dbInstance.select().from(users).where(eq(users.passwordResetToken, input.token)).limit(1);
        const user = userResults.length > 0 ? userResults[0] : null;
        
        if (!user || !user.passwordResetTokenExpiry) {
          throw new Error('Invalid or expired reset token');
        }
        
        // Check if token is expired
        if (new Date() > user.passwordResetTokenExpiry) {
          throw new Error('Reset token has expired');
        }
        
        // Hash new password
        const passwordHash = await hashPassword(input.newPassword);
        
        // Update password and clear reset token
        await db.upsertUser({
          openId: user.openId,
          name: user.name,
          email: user.email,
          passwordHash,
          loginMethod: user.loginMethod,
          lastSignedIn: user.lastSignedIn,
          passwordResetToken: null,
          passwordResetTokenExpiry: null,
        });
        
        return { success: true, message: 'Password reset successful. You can now sign in with your new password.' };
      }),
      
    verifyEmail: publicProcedure
      .input(z.object({
        token: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Find user by verification token
        const dbInstance = await getDb();
        if (!dbInstance) throw new Error('Database not available');
        
        const userResults = await dbInstance.select().from(users).where(eq(users.verificationToken, input.token)).limit(1);
        const user = userResults.length > 0 ? userResults[0] : null;
        
        if (!user || !user.verificationTokenExpiry) {
          throw new Error('Invalid or expired verification token');
        }
        
        // Check if token is expired
        if (new Date() > user.verificationTokenExpiry) {
          throw new Error('Verification token has expired');
        }
        
        // Mark email as verified and clear token
        await dbInstance.update(users)
          .set({
            emailVerified: true,
            verificationToken: null,
            verificationTokenExpiry: null,
          })
          .where(eq(users.id, user.id));
        
        return { success: true, message: 'Email verified successfully!' };
      }),
      
    resendVerification: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Find user
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new Error('User not found');
        }
        
        if (user.emailVerified) {
          throw new Error('Email is already verified');
        }
        
        // Generate new verification token
        const verificationToken = generateVerificationToken();
        const verificationTokenExpiry = generateTokenExpiry(24); // 24 hours
        
        // Update user with new token
        await db.upsertUser({
          openId: user.openId,
          name: user.name,
          email: user.email,
          passwordHash: user.passwordHash,
          loginMethod: user.loginMethod,
          lastSignedIn: user.lastSignedIn,
          verificationToken,
          verificationTokenExpiry,
        });
        
        // Send verification email
        const baseUrl = `${ctx.req.protocol}://${ctx.req.get('host')}`;
        await sendVerificationEmail(user.email!, user.name || 'User', verificationToken, baseUrl);
        
        return { success: true, message: 'Verification email sent!' };
      }),

  }),

  recruiter: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return await db.getRecruiterByUserId(ctx.user.id);
    }),
    
    createProfile: protectedProcedure
      .input(z.object({
        companyName: z.string().optional(),
        phoneNumber: z.string().optional(),
        bio: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createRecruiter({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
    
    updateProfile: protectedProcedure
      .input(z.object({
        id: z.number(),
        companyName: z.string().optional(),
        phoneNumber: z.string().optional(),
        bio: z.string().optional(),
        emailDigestFrequency: z.enum(['never', 'daily', 'weekly']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateRecruiter(id, data);
        return { success: true };
      }),
    
    updateDigestPreferences: protectedProcedure
      .input(z.object({
        frequency: z.enum(['never', 'daily', 'weekly']),
      }))
      .mutation(async ({ ctx, input }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) throw new Error('Recruiter profile not found');
        
        await db.updateRecruiter(recruiter.id, {
          emailDigestFrequency: input.frequency,
        });
        
        return { success: true };
      }),
    
    getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
      const stats = await db.getDashboardStats(ctx.user.id);
      const recentJobs = await db.getJobsByRecruiter(ctx.user.id);
      
      return {
        stats: stats || { activeJobs: 0, totalApplications: 0, aiMatches: 0, submittedToClients: 0 },
        recentJobs: recentJobs.slice(0, 5),
      };
    }),
    
    getJobs: protectedProcedure.query(async ({ ctx }) => {
      return await db.getJobsByRecruiter(ctx.user.id);
    }),
    
    getSubmissions: protectedProcedure.query(async ({ ctx }) => {
      // For now, return empty array since submissions tracking is not yet implemented in DB
      // This will be populated when submission tracking feature is added
      return [];
    }),
    
    searchCandidates: protectedProcedure
      .input(z.object({
        keyword: z.string().optional(),
        location: z.string().optional(),
        experienceLevel: z.string().optional(),
        skills: z.array(z.string()).optional(),
      }))
      .query(async ({ input }) => {
        return await db.searchCandidates(input);
      }),
    
    saveSearch: protectedProcedure
      .input(z.object({
        name: z.string(),
        keyword: z.string().optional(),
        location: z.string().optional(),
        experienceLevel: z.string().optional(),
        skills: z.array(z.string()).optional(),
        emailAlerts: z.boolean().optional(),
        alertFrequency: z.enum(["immediate", "daily", "weekly"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { name, emailAlerts, alertFrequency, ...searchCriteria } = input;
        await db.createSavedSearch({
          userId: ctx.user.id,
          name,
          searchType: "candidate",
          keyword: searchCriteria.keyword || null,
          location: searchCriteria.location || null,
          experienceLevel: searchCriteria.experienceLevel || null,
          skills: searchCriteria.skills ? JSON.stringify(searchCriteria.skills) : null,
          emailAlerts: emailAlerts || false,
          alertFrequency: alertFrequency || "daily",
        });
        return { success: true };
      }),
    
    getSavedSearches: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSavedSearchesByUser(ctx.user.id);
    }),
    
    deleteSavedSearch: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSavedSearch(input.id);
        return { success: true };
      }),
    
    updateSavedSearch: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        emailAlerts: z.boolean().optional(),
        alertFrequency: z.enum(["immediate", "daily", "weekly"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSavedSearch(id, data);
        return { success: true };
      }),
    
    getAnalytics: protectedProcedure
      .input(z.object({ days: z.number().optional().default(30) }))
      .query(async ({ ctx, input }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) throw new Error("Recruiter profile not found");
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);
        
        // Get all jobs by recruiter
        const allJobs = await db.getJobsByRecruiter(ctx.user.id);
        const jobsInPeriod = allJobs.filter(job => new Date(job.createdAt) >= cutoffDate);
        const activeJobs = allJobs.filter(job => job.status === "active");
        
        // Get all applications for recruiter's jobs
        const allApplications: any[] = [];
        for (const job of allJobs) {
          const apps = await db.getApplicationsByJob(job.id);
          allApplications.push(...apps);
        }
        const applicationsInPeriod = allApplications.filter(app => new Date(app.submittedAt) >= cutoffDate);
        
        // Calculate metrics
        const totalJobs = jobsInPeriod.length;
        const totalApplications = applicationsInPeriod.length;
        const avgApplicationsPerJob = totalJobs > 0 ? totalApplications / totalJobs : 0;
        
        // Application status distribution
        const applicationsByStatus = applicationsInPeriod.reduce((acc: any, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {});
        
        // Conversion rate (placeholder - would need view tracking)
        const conversionRate = 15.5; // Placeholder
        
        // Interview metrics
        const allInterviews = await db.getInterviewsByRecruiterId(recruiter.id);
        const interviewsInPeriod = allInterviews.filter(i => new Date(i.interview.scheduledAt) >= cutoffDate);
        const completedInterviews = interviewsInPeriod.filter(i => i.interview.status === "completed").length;
        const scheduledInterviews = interviewsInPeriod.filter(i => i.interview.status === "scheduled").length;
        const totalInterviews = interviewsInPeriod.length;
        const interviewCompletionRate = totalInterviews > 0 ? (completedInterviews / totalInterviews) * 100 : 0;
        
        // Time to hire (placeholder calculation)
        const hiredApplications = applicationsInPeriod.filter(app => app.status === "offered");
        let avgTimeToHire = 0;
        let fastestHire = 0;
        let slowestHire = 0;
        
        if (hiredApplications.length > 0) {
          const hireTimes = hiredApplications.map(app => {
            const submitted = new Date(app.submittedAt);
            const now = new Date();
            return Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
          });
          avgTimeToHire = hireTimes.reduce((a, b) => a + b, 0) / hireTimes.length;
          fastestHire = Math.min(...hireTimes);
          slowestHire = Math.max(...hireTimes);
        }
        
        // Top performing jobs
        const jobApplicationCounts = allJobs.map(job => ({
          id: job.id,
          title: job.title,
          location: job.location,
          applicationCount: allApplications.filter(app => app.jobId === job.id).length,
        }));
        const topJobs = jobApplicationCounts
          .sort((a, b) => b.applicationCount - a.applicationCount)
          .slice(0, 5);
        
        // Candidate sources (placeholder)
        const candidateSources = [
          { source: "direct", count: Math.floor(totalApplications * 0.4) },
          { source: "job board", count: Math.floor(totalApplications * 0.3) },
          { source: "referral", count: Math.floor(totalApplications * 0.2) },
          { source: "social media", count: Math.floor(totalApplications * 0.1) },
        ];
        
        return {
          totalJobs,
          activeJobs: activeJobs.length,
          totalApplications,
          avgApplicationsPerJob,
          conversionRate,
          applicationsByStatus,
          totalInterviews,
          completedInterviews,
          scheduledInterviews,
          interviewCompletionRate,
          avgTimeToHire,
          fastestHire,
          slowestHire,
          topJobs,
          candidateSources,
        };
      }),
  }),

  candidate: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return await db.getCandidateByUserId(ctx.user.id);
    }),
    
    createProfile: protectedProcedure
      .input(z.object({
        title: z.string().optional(),
        phoneNumber: z.string().optional(),
        location: z.string().optional(),
        bio: z.string().optional(),
        skills: z.string().optional(),
        experience: z.string().optional(),
        education: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createCandidate({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
    
    updateProfile: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        phoneNumber: z.string().optional(),
        location: z.string().optional(),
        bio: z.string().optional(),
        skills: z.string().optional(),
        experience: z.string().optional(),
        education: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCandidate(id, data);
        return { success: true };
      }),
    
    uploadResume: protectedProcedure
      .input(z.object({
        candidateId: z.number(),
        fileData: z.string(), // base64 encoded file
        fileName: z.string(),
        autoFill: z.boolean().optional(), // Whether to auto-fill profile from resume
      }))
      .mutation(async ({ input }) => {
        const { candidateId, fileData, fileName, autoFill = true } = input;
        
        // Extract base64 data and mime type
        const matches = fileData.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
          throw new Error('Invalid file data format');
        }
        
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Upload to S3
        const fileKey = `resumes/${candidateId}-${fileName}-${randomSuffix()}`;
        const { url } = await storagePut(fileKey, buffer, mimeType);
        
        // Parse resume if autoFill is enabled
        let parsedData = null;
        if (autoFill) {
          try {
            // Extract text from PDF/DOCX
            const resumeText = await extractResumeText(buffer, mimeType);
            
            // Parse with AI (new advanced parser)
            parsedData = await parseResumeWithAI(resumeText);
            
            // Update candidate profile with parsed data
            await db.updateCandidate(candidateId, {
              resumeUrl: url,
              resumeFilename: fileName,
              resumeUploadedAt: new Date(),
              // Personal info
              ...(parsedData.personalInfo.phone && { phoneNumber: parsedData.personalInfo.phone }),
              ...(parsedData.personalInfo.location && { location: parsedData.personalInfo.location }),
              ...(parsedData.personalInfo.linkedin && { linkedinUrl: parsedData.personalInfo.linkedin }),
              ...(parsedData.personalInfo.github && { githubUrl: parsedData.personalInfo.github }),
              // Basic fields
              ...(parsedData.summary && { bio: parsedData.summary }),
              skills: JSON.stringify(parsedData.skills),
              experience: JSON.stringify(parsedData.experience),
              education: JSON.stringify(parsedData.education),
              // Advanced fields
              certifications: JSON.stringify(parsedData.certifications),
              languages: JSON.stringify(parsedData.languages),
              projects: JSON.stringify(parsedData.projects),
              parsedResumeData: JSON.stringify(parsedData),
              // Metadata
              totalExperienceYears: parsedData.metadata.totalExperienceYears,
              seniorityLevel: parsedData.metadata.seniorityLevel,
              primaryDomain: parsedData.metadata.primaryDomain,
              skillCategories: JSON.stringify(parsedData.metadata.skillCategories),
            });
          } catch (error) {
            console.error('Resume parsing failed:', error);
            // Still save the resume URL even if parsing fails
            await db.updateCandidate(candidateId, {
              resumeUrl: url,
              resumeFilename: fileName,
              resumeUploadedAt: new Date(),
            });
          }
        } else {
          // Just update resume URL without parsing
          await db.updateCandidate(candidateId, {
            resumeUrl: url,
            resumeFilename: fileName,
            resumeUploadedAt: new Date(),
          });
        }
        
        return { success: true, url, parsedData };
      }),
    
    getByUserId: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCandidateByUserId(input.userId);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        fullName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        location: z.string().optional(),
        skills: z.string().optional(),
        experienceYears: z.number().optional(),
        bio: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCandidate(id, data);
        return { success: true };
      }),
    
    getStats: protectedProcedure
      .input(z.object({ candidateId: z.number() }))
      .query(async ({ input }) => {
        const applications = await db.getApplicationsByCandidate(input.candidateId);
        return {
          totalApplications: applications.length,
          interviews: applications.filter((app: any) => app.status === 'interview').length,
          profileViews: 0, // TODO: Implement profile views tracking
          resumeScore: 85, // TODO: Implement AI resume scoring
        };
      }),
    
    parseResume: protectedProcedure
      .input(z.object({ resumeText: z.string() }))
      .mutation(async ({ input }) => {
        return await parseResume(input.resumeText);
      }),
    
    analyzeResume: protectedProcedure
      .input(z.object({ resumeText: z.string() }))
      .mutation(async ({ input }) => {
        return await analyzeResume(input.resumeText);
      }),
    
    getRecommendedJobs: protectedProcedure
      .input(z.object({ 
        candidateId: z.number(),
        limit: z.number().optional().default(10)
      }))
      .query(async ({ input }) => {
        const { getMatchingJobsForCandidate } = await import('./jobMatching');
        return await getMatchingJobsForCandidate(input.candidateId, input.limit);
      }),
    
    getSkillBasedJobs: protectedProcedure
      .input(z.object({ 
        candidateId: z.number(),
        limit: z.number().optional().default(10)
      }))
      .query(async ({ input }) => {
        const { getSkillBasedJobs } = await import('./skillBasedMatching');
        return await getSkillBasedJobs(input.candidateId, input.limit);
      }),
    
    saveJob: protectedProcedure
      .input(z.object({ candidateId: z.number(), jobId: z.number() }))
      .mutation(async ({ input }) => {
        await db.saveJob(input.candidateId, input.jobId);
        return { success: true };
      }),
    
    unsaveJob: protectedProcedure
      .input(z.object({ candidateId: z.number(), jobId: z.number() }))
      .mutation(async ({ input }) => {
        await db.unsaveJob(input.candidateId, input.jobId);
        return { success: true };
      }),
    
    getSavedJobs: protectedProcedure
      .input(z.object({ candidateId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSavedJobs(input.candidateId);
      }),
    
    isJobSaved: protectedProcedure
      .input(z.object({ candidateId: z.number(), jobId: z.number() }))
      .query(async ({ input }) => {
        return await db.isJobSaved(input.candidateId, input.jobId);
      }),

    // Bulk resume upload
    bulkUploadResumes: protectedProcedure
      .input(z.object({
        zipFileData: z.string(), // base64 encoded ZIP file
        jobId: z.number().optional(), // Optional: rank against this job
        autoCreateProfiles: z.boolean().optional().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const { zipFileData, jobId, autoCreateProfiles } = input;
        
        // Extract base64 data
        const matches = zipFileData.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
          throw new Error('Invalid file data format');
        }
        
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Import bulk upload service
        const { processBulkResumeUpload, validateBulkUploadZip } = await import('./bulkResumeUpload');
        
        // Validate ZIP file
        const validation = validateBulkUploadZip(buffer);
        if (!validation.valid) {
          throw new Error(validation.error || 'Invalid ZIP file');
        }
        
        // Process bulk upload
        const result = await processBulkResumeUpload(buffer, {
          userId: ctx.user.id,
          jobId,
          autoCreateProfiles,
        });
        
        return result;
      }),
  }),

  customer: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllCustomers();
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        industry: z.string().optional(),
        website: z.string().optional(),
        description: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        address: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createCustomer({
          ...input,
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        industry: z.string().optional(),
        website: z.string().optional(),
        description: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        address: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCustomer(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCustomer(input.id);
        return { success: true };
      }),
    
    getContacts: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ input }) => {
        return await db.getContactsByCustomer(input.customerId);
      }),
    
    createContact: protectedProcedure
      .input(z.object({
        customerId: z.number(),
        name: z.string(),
        title: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        isPrimary: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createCustomerContact(input);
        return { success: true };
      }),
  }),

  job: router({
    list: publicProcedure.query(async () => {
      return await db.getPublicJobs();
    }),
    
    search: publicProcedure
      .input(z.object({
        keyword: z.string().optional(),
        location: z.string().optional(),
        employmentType: z.enum(["full-time", "part-time", "contract", "temporary", "internship", "all"]).optional(),
        salaryMin: z.number().optional(),
        salaryMax: z.number().optional(),
        experienceLevel: z.enum(["entry", "mid", "senior", "lead", "all"]).optional(),
        remoteOption: z.enum(["remote", "hybrid", "onsite", "all"]).optional(),
        skills: z.array(z.string()).optional(),
      }))
      .query(async ({ input }) => {
        return await db.searchJobs(input);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getJobById(input.id);
      }),
    
    getMyJobs: protectedProcedure.query(async ({ ctx }) => {
      return await db.getJobsByRecruiter(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        requirements: z.string().optional(),
        responsibilities: z.string().optional(),
        location: z.string().optional(),
        employmentType: z.enum(["full-time", "part-time", "contract", "temporary", "internship"]).optional(),
        salaryMin: z.number().optional(),
        salaryMax: z.number().optional(),
        salaryCurrency: z.string().optional(),
        customerId: z.number().optional(),
        contactId: z.number().optional(),
        applicationDeadline: z.date().optional(),
        status: z.enum(["draft", "active", "closed", "filled"]).optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createJob({
          ...input,
          postedBy: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        requirements: z.string().optional(),
        responsibilities: z.string().optional(),
        location: z.string().optional(),
        employmentType: z.enum(["full-time", "part-time", "contract", "temporary", "internship"]).optional(),
        salaryMin: z.number().optional(),
        salaryMax: z.number().optional(),
        customerId: z.number().optional(),
        contactId: z.number().optional(),
        applicationDeadline: z.date().optional(),
        status: z.enum(["draft", "active", "closed", "filled"]).optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateJob(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteJob(input.id);
        return { success: true };
      }),
  }),

  application: router({
    submit: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        candidateId: z.number(),
        coverLetter: z.string().optional(),
        resumeUrl: z.string().optional(),
        resumeFilename: z.string().optional(),
        resumeProfileId: z.number().optional(),
        videoIntroductionId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createApplication(input);
        
        // Create notification for recruiter about new application
        try {
          const job = await db.getJobById(input.jobId);
          const candidate = await db.getCandidateById(input.candidateId);
          if (job && candidate) {
            const recruiter = await db.getRecruiterByUserId(job.postedBy);
            if (recruiter) {
              await notificationHelpers.createNotification({
                userId: job.postedBy,
                type: 'application',
                title: 'New Application Received',
                message: `${candidate.fullName || 'A candidate'} has applied for ${job.title}`,
                isRead: false,
                relatedEntityType: 'application',
                relatedEntityId: input.jobId,
                actionUrl: `/recruiter/applications?jobId=${input.jobId}`,
              });
            }
          }
        } catch (error) {
          console.error('Failed to create notification:', error);
        }
        
        return { success: true };
      }),
    
    getByJob: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        return await db.getApplicationsByJob(input.jobId);
      }),
    
    getByCandidate: protectedProcedure
      .input(z.object({ candidateId: z.number() }))
      .query(async ({ input }) => {
        return await db.getApplicationsByCandidate(input.candidateId);
      }),
    
    getCandidateApplications: protectedProcedure
      .input(z.object({ candidateId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCandidateApplicationsWithDetails(input.candidateId);
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["submitted", "reviewing", "shortlisted", "interviewing", "offered", "rejected", "withdrawn"]),
        notes: z.string().optional(),
        feedback: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, feedback, ...data } = input;
        
        // Get old status before update
        const application = await db.getApplicationById(id);
        const oldStatus = application?.status || "pending";
        
        await db.updateApplication(id, data);
        
        // Send enhanced email notification and in-app notification to candidate
        try {
          const { sendApplicationStatusNotification, getStatusNotificationMessage } = await import('./applicationStatusNotifier');
          
          // Send enhanced email with personalized content
          await sendApplicationStatusNotification({
            applicationId: id,
            oldStatus,
            newStatus: input.status,
            feedback,
          });
          
          // Get application details for in-app notification
          const candidate = application ? await db.getCandidateById(application.candidateId) : null;
          const job = application ? await db.getJobById(application.jobId) : null;
          
          if (candidate && job) {
            // Create enhanced in-app notification
            const { title, message } = getStatusNotificationMessage(input.status, job.title);
            await notificationHelpers.createNotification({
              userId: candidate.userId,
              type: 'status_change',
              title,
              message,
              isRead: false,
              relatedEntityType: 'application',
              relatedEntityId: id,
              actionUrl: '/candidate-dashboard',
            });
          }
        } catch (error) {
          console.error("Failed to send application status notification:", error);
        }
        
        return { success: true };
      }),
    
    calculateMatch: protectedProcedure
      .input(z.object({
        candidateId: z.number(),
        jobId: z.number(),
      }))
      .mutation(async ({ input }) => {
        // Get candidate and job details
        const candidate = await db.getCandidateById(input.candidateId);
        const job = await db.getJobById(input.jobId);
        
        if (!candidate || !job) {
          throw new Error("Candidate or job not found");
        }
        
        // Extract skills and experience
        const candidateSkills = candidate.skills ? candidate.skills.split(',').map((s: string) => s.trim()) : [];
        const candidateExperience = candidate.experienceYears || 0;
        
        // Calculate match score using AI
        const matchResult = await calculateMatchScore(
          candidateSkills,
          candidateExperience,
          job.requirements || job.description,
          job.title
        );
        
        return matchResult;
      }),
    
    list: protectedProcedure
      .query(async () => {
        return await db.getAllApplications();
      }),
    
    bulkUpdateStatus: protectedProcedure
      .input(z.object({
        applicationIds: z.array(z.number()),
        status: z.enum(["submitted", "reviewing", "shortlisted", "interviewing", "offered", "rejected", "withdrawn"]),
      }))
      .mutation(async ({ input }) => {
        for (const id of input.applicationIds) {
          await db.updateApplication(id, { status: input.status });
        }
        return { success: true };
      }),
    
    getMatchedCandidates: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        // Get all applications for this job
        const applications = await db.getApplicationsByJob(input.jobId);
        const job = await db.getJobById(input.jobId);
        
        if (!job) {
          throw new Error("Job not found");
        }
        
        // Calculate match scores for each candidate
        const matchedCandidates = await Promise.all(
          applications.map(async (app: any) => {
            const candidate = await db.getCandidateById(app.candidateId);
            if (!candidate) return null;
            
            const candidateSkills = candidate.skills ? candidate.skills.split(',').map((s: string) => s.trim()) : [];
            const candidateExperience = candidate.experienceYears || 0;
            
            try {
              const matchResult = await calculateMatchScore(
                candidateSkills,
                candidateExperience,
                job.requirements || job.description,
                job.title
              );
              
              return {
                ...app,
                candidate,
                matchScore: matchResult.overallScore,
                skillsScore: matchResult.skillsScore,
                experienceScore: matchResult.experienceScore,
                matchingSkills: matchResult.matchingSkills,
                missingSkills: matchResult.missingSkills,
                recommendation: matchResult.recommendation,
              };
            } catch (error) {
              // If AI fails, return basic info with 0 score
              return {
                ...app,
                candidate,
                matchScore: 0,
                skillsScore: 0,
                experienceScore: 0,
                matchingSkills: [],
                missingSkills: [],
                recommendation: 'review',
              };
            }
          })
        );
        
        // Filter out nulls and sort by match score
        return matchedCandidates
          .filter((c: any) => c !== null)
          .sort((a: any, b: any) => b.matchScore - a.matchScore);
      }),
    
    generateInterviewQuestions: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        candidateId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const candidate = await db.getCandidateById(input.candidateId);
        const job = await db.getJobById(input.jobId);
        
        if (!candidate || !job) {
          throw new Error("Candidate or job not found");
        }
        
        const candidateSkills = candidate.skills ? candidate.skills.split(',').map((s: string) => s.trim()) : [];
        
        const questions = await generateInterviewQuestions(
          job.title,
          job.requirements || job.description,
          candidateSkills
        );
        
        return { questions };
      }),
    
    // Feedback endpoints
    createFeedback: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        rating: z.number().min(1).max(5).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) {
          throw new Error("Recruiter profile not found");
        }
        
        await db.createApplicationFeedback({
          applicationId: input.applicationId,
          recruiterId: recruiter.id,
          rating: input.rating,
          notes: input.notes,
        });
        
        // Create notification for other recruiters
        try {
          const application = await db.getApplicationById(input.applicationId);
          if (application) {
            const job = await db.getJobById(application.jobId);
            const candidate = await db.getCandidateById(application.candidateId);
            
            if (job && candidate) {
              const jobOwnerRecruiter = await db.getRecruiterByUserId(job.postedBy);
              
              // Notify job owner if they're not the one who added feedback
              if (jobOwnerRecruiter && jobOwnerRecruiter.id !== recruiter.id) {
                await notificationHelpers.createNotification({
                  userId: job.postedBy,
                  type: 'application_feedback',
                  title: 'New Feedback on Application',
                  message: `${recruiter.companyName} added feedback for ${candidate.fullName}'s application to ${job.title}`,
                  relatedEntityType: 'application',
                  relatedEntityId: input.applicationId,
                  actionUrl: `/recruiter/applications`,
                });
              }
            }
          }
        } catch (error) {
          console.error('[Feedback] Failed to create notification:', error);
          // Don't fail the feedback creation if notification fails
        }
        
        return { success: true };
      }),
    
    getFeedback: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input }) => {
        return await db.getApplicationFeedback(input.applicationId);
      }),
    
    updateFeedback: protectedProcedure
      .input(z.object({
        id: z.number(),
        rating: z.number().min(1).max(5).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateApplicationFeedback(id, data);
        return { success: true };
      }),
    
    deleteFeedback: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteApplicationFeedback(input.id);
        return { success: true };
      }),
  }),
  
  interview: router({
    // Create interview
    create: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        candidateId: z.number(),
        jobId: z.number(),
        scheduledAt: z.string(),
        duration: z.number().default(60),
        type: z.enum(["phone", "video", "in-person", "ai-interview"]).default("video"),
        meetingLink: z.string().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) throw new Error("Recruiter profile not found");
        
        // Create video meeting if interview type is video
        let videoMeetingDetails = null;
        if (input.type === 'video') {
          try {
            const job = await db.getJobById(input.jobId);
            videoMeetingDetails = await createVideoMeeting({
              topic: `Interview for ${job?.title || 'Position'}`,
              startTime: new Date(input.scheduledAt),
              duration: input.duration || 60,
              agenda: input.notes || 'Interview discussion',
            });
          } catch (error) {
            console.error('Failed to create video meeting:', error);
            // Continue without video meeting if creation fails
          }
        }
        
        const interview = await db.createInterview({
          ...input,
          recruiterId: recruiter.id,
          scheduledAt: new Date(input.scheduledAt),
          videoMeetingId: videoMeetingDetails?.meetingId,
          videoJoinUrl: videoMeetingDetails?.joinUrl,
          videoStartUrl: videoMeetingDetails?.startUrl,
          videoPassword: videoMeetingDetails?.password,
          videoProvider: videoMeetingDetails?.provider || 'none',
        });
        
        // Send email notification and in-app notification to candidate
        try {
          const candidate = await db.getCandidateById(input.candidateId);
          const job = await db.getJobById(input.jobId);
          if (candidate && job) {
            const user = await db.getUserById(candidate.userId);
            if (user?.email) {
              // Send email
              await sendInterviewInvitation({
                candidateEmail: user.email,
                candidateName: user.name || "Candidate",
                jobTitle: job.title,
                companyName: job.companyName || "Company",
                interviewDate: new Date(input.scheduledAt),
                interviewType: input.type || "AI Interview",
                duration: input.duration || 60,
                notes: input.notes,
              });
              
              // Create in-app notification
              await notificationHelpers.createNotification({
                userId: candidate.userId,
                type: 'interview',
                title: 'Interview Scheduled',
                message: `You have been scheduled for a ${input.type} interview for ${job.title}`,
                isRead: false,
                relatedEntityType: 'interview',
                actionUrl: '/my-applications',
              });
            }
          }
        } catch (error) {
          console.error("Failed to send interview invitation email:", error);
        }
        
        return { success: true };
      }),
    
    // Get interviews for recruiter
    listByRecruiter: protectedProcedure.query(async ({ ctx }) => {
      const recruiter = await db.getRecruiterByUserId(ctx.user.id);
      if (!recruiter) return [];
      return await db.getInterviewsByRecruiterId(recruiter.id);
    }),
    
    // Get interviews for candidate
    listByCandidate: protectedProcedure.query(async ({ ctx }) => {
      const candidate = await db.getCandidateByUserId(ctx.user.id);
      if (!candidate) return [];
      return await db.getInterviewsByCandidateId(candidate.id);
    }),
    
    // Get upcoming interviews for candidate (for dashboard widget)
    getUpcoming: protectedProcedure.query(async ({ ctx }) => {
      const candidate = await db.getCandidateByUserId(ctx.user.id);
      if (!candidate) return [];
      
      const allInterviews = await db.getInterviewsByCandidateId(candidate.id);
      const now = new Date();
      
      // Filter to only scheduled interviews in the future
      const upcomingInterviews = allInterviews
        .filter(interview => {
          const scheduledAt = new Date(interview.interview.scheduledAt);
          return interview.interview.status === 'scheduled' && scheduledAt > now;
        })
        .sort((a, b) => {
          return new Date(a.interview.scheduledAt).getTime() - new Date(b.interview.scheduledAt).getTime();
        })
        .slice(0, 3) // Get next 3 upcoming interviews
        .map(interview => {
          const scheduledAt = new Date(interview.interview.scheduledAt);
          const msUntilInterview = scheduledAt.getTime() - now.getTime();
          const hoursUntil = Math.floor(msUntilInterview / (1000 * 60 * 60));
          const minutesUntil = Math.floor((msUntilInterview % (1000 * 60 * 60)) / (1000 * 60));
          const daysUntil = Math.floor(hoursUntil / 24);
          
          return {
            id: interview.interview.id,
            scheduledAt: interview.interview.scheduledAt,
            duration: interview.interview.duration,
            type: interview.interview.type,
            status: interview.interview.status,
            meetingLink: interview.interview.meetingLink || interview.interview.videoJoinUrl,
            location: interview.interview.location,
            jobTitle: interview.job?.title || 'Position',
            companyName: interview.job?.companyName || 'Company',
            countdown: {
              days: daysUntil,
              hours: hoursUntil % 24,
              minutes: minutesUntil,
              totalHours: hoursUntil,
              isToday: daysUntil === 0,
              isTomorrow: daysUntil === 1,
              isWithinHour: hoursUntil < 1,
            },
          };
        });
      
      return upcomingInterviews;
    }),
    
    // Get interview by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getInterviewById(input.id);
      }),
    
    // Reschedule interview
    reschedule: protectedProcedure
      .input(z.object({
        id: z.number(),
        scheduledAt: z.string(),
        duration: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, scheduledAt, duration } = input;
        await db.updateInterview(id, {
          scheduledAt: new Date(scheduledAt),
          ...(duration && { duration }),
        });
        return { success: true };
      }),
    
    // Update interview
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        scheduledAt: z.string().optional(),
        duration: z.number().optional(),
        type: z.enum(["phone", "video", "in-person", "ai-interview"]).optional(),
        status: z.enum(["scheduled", "in-progress", "completed", "cancelled", "no-show"]).optional(),
        meetingLink: z.string().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
        recordingUrl: z.string().optional(),
        aiEvaluationScore: z.number().optional(),
        aiEvaluationReport: z.string().optional(),
        interviewerNotes: z.string().optional(),
        candidateFeedback: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateInterview(id, {
          ...updates,
          scheduledAt: updates.scheduledAt ? new Date(updates.scheduledAt) : undefined,
        });
        return { success: true };
      }),
    
    // Delete/cancel interview
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteInterview(input.id);
        return { success: true };
      }),
    
    // AI Interview - Generate questions
    generateQuestions: protectedProcedure
      .input(z.object({
        interviewId: z.number(),
        jobId: z.number(),
        candidateId: z.number(),
        questionCount: z.number().default(5),
      }))
      .mutation(async ({ input }) => {
        const { generateStructuredInterviewQuestions } = await import("./aiHelpers");
        
        // Get job details
        const job = await db.getJobById(input.jobId);
        if (!job) throw new Error("Job not found");
        
        // Get candidate details
        const candidate = await db.getCandidateById(input.candidateId);
        if (!candidate) throw new Error("Candidate not found");
        
        // Generate questions
        const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills : [];
        const questions = await generateStructuredInterviewQuestions(
          job.title,
          job.requirements || "",
          candidateSkills,
          input.questionCount
        );
        
        // Save questions to database
        for (let i = 0; i < questions.length; i++) {
          await db.createInterviewQuestion({
            interviewId: input.interviewId,
            questionText: questions[i].questionText,
            questionType: questions[i].questionType as any,
            orderIndex: i,
            expectedDuration: questions[i].expectedDuration,
          });
        }
        
        return { success: true, questions };
      }),
    
    // AI Interview - Get questions
    getQuestions: protectedProcedure
      .input(z.object({ interviewId: z.number() }))
      .query(async ({ input }) => {
        return await db.getInterviewQuestions(input.interviewId);
      }),
    
    // AI Interview - Submit response
    submitResponse: protectedProcedure
      .input(z.object({
        interviewId: z.number(),
        questionId: z.number(),
        audioFile: z.instanceof(Buffer).optional(),
        videoFile: z.instanceof(Buffer).optional(),
        audioUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        duration: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const candidate = await db.getCandidateByUserId(ctx.user.id);
        if (!candidate) throw new Error("Candidate profile not found");
        
        // Upload files to S3 if provided
        let audioUrl = input.audioUrl;
        let videoUrl = input.videoUrl;
        
        if (input.audioFile) {
          const audioKey = `interviews/${input.interviewId}/audio-${randomSuffix()}.webm`;
          const result = await storagePut(audioKey, input.audioFile, "audio/webm");
          audioUrl = result.url;
        }
        
        if (input.videoFile) {
          const videoKey = `interviews/${input.interviewId}/video-${randomSuffix()}.webm`;
          const result = await storagePut(videoKey, input.videoFile, "video/webm");
          videoUrl = result.url;
        }
        
        // Create response record
        const result = await db.createInterviewResponse({
          interviewId: input.interviewId,
          questionId: input.questionId,
          candidateId: candidate.id,
          audioUrl,
          videoUrl,
          duration: input.duration,
        });
        
        // Auto-transcribe audio if available
        if (audioUrl) {
          try {
            const transcriptionResult = await transcribeAudio({ audioUrl });
            
            if ('text' in transcriptionResult) {
              // Update response with transcription
              await db.updateInterviewResponse(result.id, {
                transcription: transcriptionResult.text,
              });
              
              // Auto-evaluate the response
              const question = await db.getInterviewQuestionById(input.questionId);
              const interview = await db.getInterviewById(input.interviewId);
              
              if (question && interview) {
                const job = await db.getJobById(interview.interview.jobId);
                if (job) {
                  const { evaluateInterviewResponse } = await import("./aiHelpers");
                  const evaluation = await evaluateInterviewResponse(
                    question.questionText,
                    question.questionType,
                    transcriptionResult.text,
                    job.requirements || job.description
                  );
                  
                  // Update response with evaluation
                  await db.updateInterviewResponse(result.id, {
                    aiScore: evaluation.score,
                    aiEvaluation: evaluation.evaluation,
                    strengths: evaluation.strengths,
                    weaknesses: evaluation.weaknesses,
                    recommendations: evaluation.recommendations,
                  });
                }
              }
            }
          } catch (error) {
            console.error("Auto-transcription failed:", error);
            // Continue without transcription - can be done manually later
          }
        }
        
        return { success: true, responseId: result.id };
      }),
    
    // AI Interview - Evaluate response
    evaluateResponse: protectedProcedure
      .input(z.object({
        responseId: z.number(),
        transcription: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { evaluateInterviewResponse } = await import("./aiHelpers");
        
        // Get response and question
        const data = await db.getInterviewResponseWithQuestion(input.responseId);
        if (!data || !data.question) throw new Error("Response or question not found");
        
        // Get interview and job details
        const interview = await db.getInterviewById(data.response.interviewId);
        if (!interview) throw new Error("Interview not found");
        
        const job = await db.getJobById(interview.interview.jobId);
        if (!job) throw new Error("Job not found");
        
        // Evaluate response
        const evaluation = await evaluateInterviewResponse(
          data.question.questionText,
          data.question.questionType,
          input.transcription,
          job.requirements || ""
        );
        
        // Update response with evaluation
        await db.updateInterviewResponse(input.responseId, {
          transcription: input.transcription,
          aiScore: evaluation.score,
          aiEvaluation: evaluation.evaluation,
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          recommendations: evaluation.recommendations,
        });
        
        return { success: true, evaluation };
      }),
    
    // AI Interview - Get full interview with questions and responses
    getFullInterview: protectedProcedure
      .input(z.object({ interviewId: z.number() }))
      .query(async ({ input }) => {
        return await db.getInterviewWithQuestionsAndResponses(input.interviewId);
      }),
    
    // Get interview with responses for playback
    getWithResponses: protectedProcedure
      .input(z.object({ interviewId: z.number() }))
      .query(async ({ input }) => {
        const interview = await db.getInterviewById(input.interviewId);
        if (!interview) throw new Error("Interview not found");
        
        const questions = await db.getInterviewQuestions(input.interviewId);
        const responses = await db.getInterviewResponses(input.interviewId);
        
        // Get candidate and job details
        const candidate = await db.getCandidateById(interview.interview.candidateId);
        const job = await db.getJobById(interview.interview.jobId);
        
        return {
          interview: {
            ...interview,
            candidateName: candidate?.title || `${candidate?.userId}`,
            jobTitle: job?.title || "Unknown Position",
          },
          questions,
          responses,
        };
      }),
    
    // Submit interview feedback from candidate
    submitFeedback: protectedProcedure
      .input(z.object({
        interviewId: z.number(),
        overallRating: z.number().min(1).max(5),
        interviewerRating: z.number().min(1).max(5).optional(),
        processRating: z.number().min(1).max(5).optional(),
        communicationRating: z.number().min(1).max(5).optional(),
        positiveAspects: z.string().optional(),
        areasForImprovement: z.string().optional(),
        additionalComments: z.string().optional(),
        wouldRecommend: z.boolean().optional(),
        isAnonymous: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const { interviewFeedback } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        const candidate = await db.getCandidateByUserId(ctx.user.id);
        if (!candidate) throw new Error("Candidate profile not found");
        
        // Check if feedback already exists
        const [existing] = await database
          .select()
          .from(interviewFeedback)
          .where(and(
            eq(interviewFeedback.interviewId, input.interviewId),
            eq(interviewFeedback.candidateId, candidate.id)
          ));
        
        if (existing) {
          throw new Error("Feedback already submitted for this interview");
        }
        
        // Insert feedback
        await database.insert(interviewFeedback).values({
          interviewId: input.interviewId,
          candidateId: candidate.id,
          overallRating: input.overallRating,
          interviewerRating: input.interviewerRating,
          processRating: input.processRating,
          communicationRating: input.communicationRating,
          positiveAspects: input.positiveAspects,
          areasForImprovement: input.areasForImprovement,
          additionalComments: input.additionalComments,
          wouldRecommend: input.wouldRecommend,
          isAnonymous: input.isAnonymous,
        });
        
        return { success: true };
      }),
    
    // Get feedback for an interview (for recruiters)
    getFeedback: protectedProcedure
      .input(z.object({ interviewId: z.number() }))
      .query(async ({ input }) => {
        const { interviewFeedback } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const database = await db.getDb();
        if (!database) return null;
        
        const [feedback] = await database
          .select()
          .from(interviewFeedback)
          .where(eq(interviewFeedback.interviewId, input.interviewId));
        
        return feedback || null;
      }),
    
    // Check if candidate has submitted feedback
    hasFeedback: protectedProcedure
      .input(z.object({ interviewId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { interviewFeedback } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const database = await db.getDb();
        if (!database) return false;
        
        const candidate = await db.getCandidateByUserId(ctx.user.id);
        if (!candidate) return false;
        
        const [existing] = await database
          .select()
          .from(interviewFeedback)
          .where(and(
            eq(interviewFeedback.interviewId, input.interviewId),
            eq(interviewFeedback.candidateId, candidate.id)
          ));
        
        return !!existing;
      }),
    
    // Get completed interviews awaiting feedback
    getAwaitingFeedback: protectedProcedure.query(async ({ ctx }) => {
      const { interviewFeedback, interviews, jobs } = await import("../drizzle/schema");
      const { eq, and, notInArray, sql } = await import("drizzle-orm");
      const database = await db.getDb();
      if (!database) return [];
      
      const candidate = await db.getCandidateByUserId(ctx.user.id);
      if (!candidate) return [];
      
      // Get IDs of interviews that already have feedback
      const feedbackInterviewIds = await database
        .select({ interviewId: interviewFeedback.interviewId })
        .from(interviewFeedback)
        .where(eq(interviewFeedback.candidateId, candidate.id));
      
      const excludeIds = feedbackInterviewIds.map(f => f.interviewId);
      
      // Get completed interviews without feedback
      const completedInterviews = await database
        .select({
          id: interviews.id,
          scheduledAt: interviews.scheduledAt,
          type: interviews.type,
          jobId: interviews.jobId,
          jobTitle: jobs.title,
          companyName: jobs.companyName,
        })
        .from(interviews)
        .leftJoin(jobs, eq(interviews.jobId, jobs.id))
        .where(and(
          eq(interviews.candidateId, candidate.id),
          eq(interviews.status, 'completed'),
          excludeIds.length > 0 ? notInArray(interviews.id, excludeIds) : sql`1=1`
        ))
        .limit(5);
      
      return completedInterviews;
    }),
    
    // Fraud Detection - Log event
    logFraudEvent: protectedProcedure
      .input(z.object({
        interviewId: z.number(),
        candidateId: z.number(),
        eventType: z.enum([
          "no_face_detected",
          "multiple_faces_detected",
          "tab_switch",
          "window_blur",
          "audio_anomaly",
          "suspicious_behavior"
        ]),
        severity: z.enum(["low", "medium", "high"]).optional(),
        description: z.string().optional(),
        metadata: z.string().optional(),
        questionId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const eventId = await db.createFraudDetectionEvent(input);
        return { success: true, eventId };
      }),
    
    // Fraud Detection - Get events for interview
    getFraudEvents: protectedProcedure
      .input(z.object({ interviewId: z.number() }))
      .query(async ({ input }) => {
        return await db.getFraudEventsByInterview(input.interviewId);
      }),
    
    // Fraud Detection - Calculate fraud score
    getFraudScore: protectedProcedure
      .input(z.object({ interviewId: z.number() }))
      .query(async ({ input }) => {
        return await db.calculateFraudScore(input.interviewId);
      }),
    
    // Report Generation - Fraud detection report
    generateFraudReport: protectedProcedure
      .input(z.object({ interviewId: z.number() }))
      .mutation(async ({ input }) => {
        const html = await generateFraudDetectionReport(input.interviewId);
        return { html };
      }),
    
    // Report Generation - Interview evaluation report
    generateEvaluationReport: protectedProcedure
      .input(z.object({ interviewId: z.number() }))
      .mutation(async ({ input }) => {
        const html = await generateInterviewEvaluationReport(input.interviewId);
        return { html };
      }),
  }),
  
  coding: router({
    // List all challenges
    listChallenges: protectedProcedure
      .query(async () => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        const challenges = await database
          .select()
          .from(codingChallenges)
          .orderBy(codingChallenges.createdAt);
        
        return challenges;
      }),
    
    // Create new challenge
    createChallenge: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        language: z.enum(["python", "javascript", "java", "cpp"]),
        difficulty: z.enum(["easy", "medium", "hard"]),
        starterCode: z.string().optional(),
        testCases: z.string(),
        timeLimit: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        await database.insert(codingChallenges).values({
          title: input.title,
          description: input.description,
          language: input.language,
          difficulty: input.difficulty,
          starterCode: input.starterCode,
          testCases: input.testCases,
          timeLimit: input.timeLimit,
          createdBy: ctx.user.id,
        });
        
        return { success: true };
      }),
    
    // Delete challenge
    deleteChallenge: protectedProcedure
      .input(z.object({ challengeId: z.number() }))
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        const { eq } = await import("drizzle-orm");
        await database
          .delete(codingChallenges)
          .where(eq(codingChallenges.id, input.challengeId));
        
        return { success: true };
      }),
    
    // Get coding challenge
    getChallenge: protectedProcedure
      .input(z.object({ challengeId: z.number() }))
      .query(async ({ input }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        const { eq } = await import("drizzle-orm");
        const challenges = await database
          .select()
          .from(codingChallenges)
          .where(eq(codingChallenges.id, input.challengeId))
          .limit(1);
        
        return challenges[0] || null;
      }),
    
    // Submit code for evaluation
    submitCode: protectedProcedure
      .input(z.object({
        challengeId: z.number(),
        code: z.string(),
        language: z.enum(["python", "javascript", "java", "cpp"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        const { eq } = await import("drizzle-orm");
        
        // Get challenge details
        const challenges = await database
          .select()
          .from(codingChallenges)
          .where(eq(codingChallenges.id, input.challengeId))
          .limit(1);
        
        const challenge = challenges[0];
        if (!challenge) throw new Error("Challenge not found");
        
        // Parse test cases
        const testCases = challenge.testCases ? JSON.parse(challenge.testCases) : [];
        
        // Execute code
        const result = await executeCode(input.code, input.language, testCases);
        
        // Get candidate ID
        const candidate = await database
          .select()
          .from(candidates)
          .where(eq(candidates.userId, ctx.user.id))
          .limit(1);
        
        const candidateId = candidate[0]?.id;
        if (!candidateId) throw new Error("Candidate not found");
        
        // Save submission
        await database.insert(codingSubmissions).values({
          challengeId: input.challengeId,
          candidateId,
          code: input.code,
          language: input.language,
          status: result.status,
          testResults: JSON.stringify(result.testResults),
          executionTime: result.executionTime,
          score: result.score,
        });
        
        return result;
      }),
  }),
  
  // Admin router for platform administration
  admin: router({
    // Get platform statistics
    getPlatformStats: protectedProcedure.query(async ({ ctx }) => {
      // Check if user is admin
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");
      
      const { count, sql } = await import("drizzle-orm");
      const { users, jobs, applications, interviews, recruiters, candidates } = await import("../drizzle/schema");
      
      // Get total counts
      const [totalUsersResult] = await database.select({ count: count() }).from(users);
      const [activeJobsResult] = await database.select({ count: count() }).from(jobs).where(sql`${jobs.status} = 'open'`);
      const [totalApplicationsResult] = await database.select({ count: count() }).from(applications);
      const [totalInterviewsResult] = await database.select({ count: count() }).from(interviews);
      
      // Get user distribution
      const [recruiterCountResult] = await database.select({ count: count() }).from(recruiters);
      const [candidateCountResult] = await database.select({ count: count() }).from(candidates);
      const [adminCountResult] = await database.select({ count: count() }).from(users).where(sql`${users.role} = 'admin'`);
      
      // Get application stats by status
      const [pendingResult] = await database.select({ count: count() }).from(applications).where(sql`${applications.status} = 'pending'`);
      const [reviewedResult] = await database.select({ count: count() }).from(applications).where(sql`${applications.status} = 'reviewed'`);
      const [acceptedResult] = await database.select({ count: count() }).from(applications).where(sql`${applications.status} = 'accepted'`);
      
      // Get interview stats by status
      const [scheduledResult] = await database.select({ count: count() }).from(interviews).where(sql`${interviews.status} = 'scheduled'`);
      const [completedResult] = await database.select({ count: count() }).from(interviews).where(sql`${interviews.status} = 'completed'`);
      const [cancelledResult] = await database.select({ count: count() }).from(interviews).where(sql`${interviews.status} = 'cancelled'`);
      
      return {
        totalUsers: totalUsersResult.count,
        activeJobs: activeJobsResult.count,
        totalApplications: totalApplicationsResult.count,
        totalInterviews: totalInterviewsResult.count,
        recruiterCount: recruiterCountResult.count,
        candidateCount: candidateCountResult.count,
        adminCount: adminCountResult.count,
        pendingApplications: pendingResult.count,
        reviewedApplications: reviewedResult.count,
        acceptedApplications: acceptedResult.count,
        scheduledInterviews: scheduledResult.count,
        completedInterviews: completedResult.count,
        cancelledInterviews: cancelledResult.count,
        // Mock growth percentages (would calculate from historical data)
        userGrowth: 12,
        jobGrowth: 8,
        applicationGrowth: 15,
        interviewGrowth: 10,
      };
    }),
    
    // Get recent activity
    getRecentActivity: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        const { desc, sql } = await import("drizzle-orm");
        const { users, jobs, applications, interviews } = await import("../drizzle/schema");
        
        // Get recent users
        const recentUsers = await database.select({
          type: sql`'user_signup'`,
          description: sql`CONCAT('New user registered: ', ${users.name})`,
          timestamp: users.createdAt,
        }).from(users).orderBy(desc(users.createdAt)).limit(input.limit);
        
        return recentUsers;
      }),
    
    // Get system health
    getSystemHealth: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      
      const database = await db.getDb();
      const { sql } = await import("drizzle-orm");
      const startTime = Date.now();
      
      if (!database) {
        return {
          healthy: false,
          message: 'Database connection failed',
          database: {
            connected: false,
            responseTime: 0,
          },
        };
      }
      
      // Test database connection
      try {
        await database.execute(sql`SELECT 1`);
        const responseTime = Date.now() - startTime;
        
        return {
          healthy: true,
          message: 'All systems operational',
          database: {
            connected: true,
            responseTime,
          },
        };
      } catch (error) {
        return {
          healthy: false,
          message: 'Database query failed',
          database: {
            connected: false,
            responseTime: 0,
          },
        };
      }
    }),
    
    // Get system metrics
    getSystemMetrics: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      
      // Mock metrics (in production, these would come from actual monitoring)
      return {
        uptime: process.uptime(),
        memoryUsage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
        cpuUsage: Math.round(Math.random() * 30 + 10), // Mock CPU usage
        activeConnections: Math.floor(Math.random() * 50 + 10),
        requestRate: Math.floor(Math.random() * 100 + 50),
        errorRate: Math.round(Math.random() * 2), // Low error rate
        avgResponseTime: Math.floor(Math.random() * 100 + 50),
      };
    }),
    
    // Get error logs
    getErrorLogs: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        // Mock error logs (in production, these would come from a logging system)
        return [];
      }),
    
    // Get analytics data
    getAnalytics: protectedProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        const { count, sql } = await import("drizzle-orm");
        const { users, jobs, applications, interviews } = await import("../drizzle/schema");
        
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);
        
        // Get current period counts
        const [userCount] = await database.select({ count: count() }).from(users)
          .where(sql`${users.createdAt} >= ${startDate}`);
        const [jobCount] = await database.select({ count: count() }).from(jobs)
          .where(sql`${jobs.createdAt} >= ${startDate}`);
        const [appCount] = await database.select({ count: count() }).from(applications)
          .where(sql`${applications.submittedAt} >= ${startDate}`);
        const [interviewCount] = await database.select({ count: count() }).from(interviews)
          .where(sql`${interviews.createdAt} >= ${startDate}`);
        
        // Get previous period for comparison
        const prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - input.days);
        const [prevUserCount] = await database.select({ count: count() }).from(users)
          .where(sql`${users.createdAt} >= ${prevStartDate} AND ${users.createdAt} < ${startDate}`);
        
        // Calculate growth percentages
        const userGrowthPercent = prevUserCount.count > 0 
          ? Math.round(((userCount.count - prevUserCount.count) / prevUserCount.count) * 100)
          : 100;
        
        // Get user distribution
        const [candidateCount] = await database.select({ count: count() }).from(users)
          .where(sql`${users.role} = 'candidate'`);
        const [recruiterCount] = await database.select({ count: count() }).from(users)
          .where(sql`${users.role} = 'recruiter'`);
        const [adminCount] = await database.select({ count: count() }).from(users)
          .where(sql`${users.role} = 'admin'`);
        const [totalUsers] = await database.select({ count: count() }).from(users);
        
        // Get conversion metrics
        const [scheduledInterviews] = await database.select({ count: count() }).from(interviews)
          .where(sql`${interviews.status} = 'scheduled'`);
        const [completedInterviews] = await database.select({ count: count() }).from(interviews)
          .where(sql`${interviews.status} = 'completed'`);
        
        return {
          userGrowth: {
            total: userCount.count,
            change: userGrowthPercent,
          },
          jobPostings: {
            total: jobCount.count,
            change: 15, // Mock
          },
          applications: {
            total: appCount.count,
            change: 20, // Mock
          },
          interviews: {
            total: interviewCount.count,
            change: 10, // Mock
          },
          conversionRates: {
            applicationRate: 25, // Mock
            jobViews: 1000, // Mock
            applications: appCount.count,
            interviewCompletionRate: scheduledInterviews.count > 0 
              ? Math.round((completedInterviews.count / scheduledInterviews.count) * 100)
              : 0,
            scheduledInterviews: scheduledInterviews.count,
            completedInterviews: completedInterviews.count,
          },
          timeToHire: {
            average: 14, // Mock
            fastest: 7, // Mock
            slowest: 30, // Mock
          },
          userDistribution: {
            total: totalUsers.count,
            candidates: candidateCount.count,
            recruiters: recruiterCount.count,
            admins: adminCount.count,
          },
          topJobs: [
            { title: 'Senior Software Engineer', applications: 45, conversionRate: 30 },
            { title: 'Product Manager', applications: 38, conversionRate: 25 },
            { title: 'UX Designer', applications: 32, conversionRate: 28 },
            { title: 'Data Scientist', applications: 29, conversionRate: 22 },
            { title: 'DevOps Engineer', applications: 25, conversionRate: 20 },
          ],
          trends: {
            dailySignups: Math.floor(userCount.count / input.days),
            dailyJobPosts: Math.floor(jobCount.count / input.days),
            dailyApplications: Math.floor(appCount.count / input.days),
            dailyInterviews: Math.floor(interviewCount.count / input.days),
          },
        };
      }),
    
    // Get all users
    getAllUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");
      
      const { desc, sql } = await import("drizzle-orm");
      const { users } = await import("../drizzle/schema");
      
      const allUsers = await database
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          active: sql`CASE WHEN ${users.lastSignedIn} IS NOT NULL THEN 1 ELSE 0 END`,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt));
      
      return allUsers;
    }),
    
    // Update user role
    updateUserRole: protectedProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin", "recruiter", "candidate"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        const { eq } = await import("drizzle-orm");
        const { users } = await import("../drizzle/schema");
        
        await database
          .update(users)
          .set({ role: input.role })
          .where(eq(users.id, input.userId));
        
        return { success: true };
      }),
    
    // Toggle user active status
    toggleUserStatus: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        const { eq, sql } = await import("drizzle-orm");
        const { users } = await import("../drizzle/schema");
        
        // Get current status
        const [user] = await database
          .select({ lastSignedIn: users.lastSignedIn })
          .from(users)
          .where(eq(users.id, input.userId));
        
        const isActive = user?.lastSignedIn !== null;
        
        // Toggle status by setting/clearing lastSignedIn
        if (isActive) {
          await database
            .update(users)
            .set({ lastSignedIn: sql`NULL` })
            .where(eq(users.id, input.userId));
        } else {
          await database
            .update(users)
            .set({ lastSignedIn: new Date() })
            .where(eq(users.id, input.userId));
        }
        
        return { success: true, active: !isActive };
      }),

    // Email provider configuration
    getEmailProvider: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        const { getCurrentEmailProvider } = await import('./emailService');
        const { ENV } = await import('./_core/env');
        const provider = await getCurrentEmailProvider();
        
        return {
          provider,
          availableProviders: [
            { value: 'sendgrid', label: 'SendGrid', configured: !!ENV.sendGridApiKey },
            { value: 'resend', label: 'Resend', configured: !!ENV.resendApiKey },
            { value: 'mock', label: 'Mock (Testing)', configured: true },
          ],
        };
      }),

    setEmailProvider: protectedProcedure
      .input(z.object({ provider: z.enum(['sendgrid', 'resend', 'mock']) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        const { setEmailProvider } = await import('./emailService');
        await setEmailProvider(input.provider);
        
        return { success: true };
      }),

    // Get webhook logs for debugging
    getWebhookLogs: protectedProcedure
      .input(z.object({ limit: z.number().optional().default(50) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        const { emailWebhookLogs } = await import("../drizzle/schema");
        const { desc } = await import("drizzle-orm");
        
        const logs = await database
          .select()
          .from(emailWebhookLogs)
          .orderBy(desc(emailWebhookLogs.createdAt))
          .limit(input.limit);
        
        return logs;
      }),

    // Video provider configuration
    getVideoProvider: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        const { systemSettings } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const [setting] = await database
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.settingKey, 'videoProvider'));
        
        const { ENV } = await import('./_core/env');
        const provider = setting?.settingValue || ENV.videoProvider || 'none';
        
        return {
          provider,
          hasZoomCredentials: !!(ENV.zoomClientId && ENV.zoomClientSecret && ENV.zoomAccountId),
          hasTeamsCredentials: !!(ENV.teamsClientId && ENV.teamsClientSecret && ENV.teamsTenantId),
        };
      }),
    
    setVideoProvider: protectedProcedure
      .input(z.object({ provider: z.enum(['zoom', 'teams', 'none']) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        const { systemSettings } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        await database
          .update(systemSettings)
          .set({ settingValue: input.provider, updatedAt: new Date() })
          .where(eq(systemSettings.settingKey, 'videoProvider'));
        
        return { success: true };
      }),

    // Get delivery statistics
    getDeliveryStats: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        const { emailDeliveryEvents, campaignRecipients } = await import("../drizzle/schema");
        const { sql, count } = await import("drizzle-orm");
        
        // Get overall stats
        const allRecipients = await database.select().from(campaignRecipients);
        const allEvents = await database.select().from(emailDeliveryEvents);
        
        const totalSent = allRecipients.length;
        const delivered = allEvents.filter(e => e.eventType === 'delivered').length;
        const bounced = allRecipients.filter(r => r.bouncedAt).length;
        const opened = allRecipients.filter(r => r.openedAt).length;
        const clicked = allRecipients.filter(r => r.clickedAt).length;
        const spamReports = allEvents.filter(e => e.eventType === 'spam_report').length;
        
        // Get provider-specific stats
        const sendgridEvents = allEvents.filter(e => e.provider === 'sendgrid');
        const resendEvents = allEvents.filter(e => e.provider === 'resend');
        
        const sendgridStats = sendgridEvents.length > 0 ? {
          sent: sendgridEvents.length,
          delivered: sendgridEvents.filter(e => e.eventType === 'delivered').length,
          bounced: sendgridEvents.filter(e => e.eventType === 'bounce').length,
          opened: sendgridEvents.filter(e => e.eventType === 'open').length,
        } : null;
        
        const resendStats = resendEvents.length > 0 ? {
          sent: resendEvents.length,
          delivered: resendEvents.filter(e => e.eventType === 'delivered').length,
          bounced: resendEvents.filter(e => e.eventType === 'bounce').length,
          opened: resendEvents.filter(e => e.eventType === 'open').length,
        } : null;
        
        return {
          totalSent,
          delivered,
          bounced,
          opened,
          clicked,
          spamReports,
          sendgridStats,
          resendStats,
        };
      }),
  }),

  // Resume Ranking Router
  ranking: router({
    // Rank candidates for a specific job
    rankCandidatesForJob: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        return await rankCandidatesForJob(input.jobId);
      }),

    // Get top N candidates for a job
    getTopCandidates: protectedProcedure
      .input(z.object({ 
        jobId: z.number(),
        limit: z.number().optional().default(10)
      }))
      .query(async ({ input }) => {
        return await getTopCandidatesForJob(input.jobId, input.limit);
      }),

    // Compare two candidates
    compareCandidates: protectedProcedure
      .input(z.object({ 
        candidateId1: z.number(),
        candidateId2: z.number(),
        jobId: z.number().optional()
      }))
      .query(async ({ input }) => {
        return await compareCandidates(
          input.candidateId1,
          input.candidateId2,
          input.jobId
        );
      }),
  }),

  // Resume Export Router
  export: router({
    // Export candidates to Excel
    exportToExcel: protectedProcedure
      .input(z.object({
        jobId: z.number().optional(),
        candidateIds: z.array(z.number()).optional(),
        includeRankings: z.boolean().default(true),
        includeSkills: z.boolean().default(true),
        includeExperience: z.boolean().default(true),
        includeEducation: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const buffer = await exportCandidatesToExcel(input);
        // Convert buffer to base64 for transmission
        return {
          data: buffer.toString('base64'),
          filename: `candidates_export_${Date.now()}.xlsx`,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
      }),

    // Export candidates to CSV
    exportToCSV: protectedProcedure
      .input(z.object({
        jobId: z.number().optional(),
        candidateIds: z.array(z.number()).optional(),
        includeRankings: z.boolean().default(true),
        includeSkills: z.boolean().default(true),
        includeExperience: z.boolean().default(true),
        includeEducation: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const csv = await exportCandidatesToCSV(input);
        return {
          data: csv,
          filename: `candidates_export_${Date.now()}.csv`,
          mimeType: 'text/csv',
        };
      }),
  }),

  notification: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
      }))
      .query(async ({ ctx, input }) => {
        return await notificationHelpers.getNotificationsByUserId(ctx.user.id, input.limit);
      }),

    getUnreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        return await notificationHelpers.getUnreadCount(ctx.user.id);
      }),

    markAsRead: protectedProcedure
      .input(z.object({
        notificationId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await notificationHelpers.markNotificationAsRead(input.notificationId);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        await notificationHelpers.markAllAsRead(ctx.user.id);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({
        notificationId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await notificationHelpers.deleteNotification(input.notificationId);
        return { success: true };
      }),
  }),

  // Advanced Candidate Search with Boolean Operators and Smart Filters
  candidateSearch: router({
    // Advanced search with boolean operators
    advancedSearch: protectedProcedure
      .input(z.object({
        keywords: z.string().optional(),
        skills: z.array(z.string()).optional(),
        experienceYears: z.object({
          min: z.number().optional(),
          max: z.number().optional(),
        }).optional(),
        location: z.string().optional(),
        availability: z.array(z.string()).optional(),
        visaStatus: z.array(z.string()).optional(),
        salaryRange: z.object({
          min: z.number().optional(),
          max: z.number().optional(),
        }).optional(),
        noticePeriod: z.array(z.string()).optional(),
        willingToRelocate: z.boolean().optional(),
        seniorityLevel: z.array(z.string()).optional(),
        tags: z.array(z.number()).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await candidateSearchHelpers.advancedCandidateSearch(input);
      }),

    // Get all tags for current recruiter
    getTags: protectedProcedure
      .query(async ({ ctx }) => {
        return await candidateSearchHelpers.getCandidateTagsByRecruiter(ctx.user.id);
      }),

    // Create a new tag
    createTag: protectedProcedure
      .input(z.object({
        name: z.string(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await candidateSearchHelpers.createCandidateTag(
          ctx.user.id,
          input.name,
          input.color
        );
      }),

    // Bulk assign tags to candidates
    bulkAssignTags: protectedProcedure
      .input(z.object({
        candidateIds: z.array(z.number()),
        tagIds: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        await candidateSearchHelpers.bulkAssignTags(
          input.candidateIds,
          input.tagIds,
          ctx.user.id
        );
        return { success: true };
      }),

    // Remove tag from candidates
    removeTagFromCandidates: protectedProcedure
      .input(z.object({
        candidateIds: z.array(z.number()),
        tagId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await candidateSearchHelpers.removeTagFromCandidates(
          input.candidateIds,
          input.tagId
        );
        return { success: true };
      }),

    // Get tags for specific candidates
    getTagsForCandidates: protectedProcedure
      .input(z.object({
        candidateIds: z.array(z.number()),
      }))
      .query(async ({ input }) => {
        return await candidateSearchHelpers.getTagsForCandidates(input.candidateIds);
      }),

    // Save search query
    saveSearch: protectedProcedure
      .input(z.object({
        name: z.string(),
        searchQuery: z.string(), // JSON stringified search params
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createSavedSearch({
          userId: ctx.user.id,
          name: input.name,
          searchType: "candidate",
          keyword: input.searchQuery,
        });
      }),

    // Get saved searches
    getSavedSearches: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getSavedSearchesByUser(ctx.user.id);
      }),

    // Delete saved search
    deleteSavedSearch: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteSavedSearch(input.id);
      }),
  }),

  // Email Campaign System
  emailCampaigns: router({
    // Template management
    createTemplate: protectedProcedure
      .input(z.object({
        name: z.string(),
        subject: z.string(),
        body: z.string(),
        category: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await emailCampaignHelpers.createEmailTemplate({
          ...input,
          userId: ctx.user.id,
        });
      }),

    getTemplates: protectedProcedure
      .query(async ({ ctx }) => {
        return await emailCampaignHelpers.getEmailTemplatesByUser(ctx.user.id);
      }),

    getTemplateById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await emailCampaignHelpers.getEmailTemplateById(input.id);
      }),

    updateTemplate: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        subject: z.string().optional(),
        body: z.string().optional(),
        category: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await emailCampaignHelpers.updateEmailTemplate(id, data);
        return { success: true };
      }),

    deleteTemplate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await emailCampaignHelpers.deleteEmailTemplate(input.id);
        return { success: true };
      }),

    // Campaign management
    createCampaign: protectedProcedure
      .input(z.object({
        name: z.string(),
        templateId: z.number().optional(),
        subject: z.string(),
        body: z.string(),
        scheduledAt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await emailCampaignHelpers.createEmailCampaign({
          ...input,
          userId: ctx.user.id,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
        });
      }),

    getCampaigns: protectedProcedure
      .query(async ({ ctx }) => {
        return await emailCampaignHelpers.getCampaignsByUser(ctx.user.id);
      }),

    getCampaignById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await emailCampaignHelpers.getCampaignById(input.id);
      }),

    addRecipients: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        candidateIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        const count = await emailCampaignHelpers.addCampaignRecipients(
          input.campaignId,
          input.candidateIds
        );
        return { count };
      }),

    sendCampaign: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .mutation(async ({ input }) => {
        return await emailCampaignHelpers.sendCampaign(input.campaignId);
      }),

    // Tracking
    trackOpen: publicProcedure
      .input(z.object({ trackingId: z.string() }))
      .mutation(async ({ input }) => {
        await emailCampaignHelpers.trackEmailOpen(input.trackingId);
        return { success: true };
      }),

    trackClick: publicProcedure
      .input(z.object({ trackingId: z.string() }))
      .mutation(async ({ input }) => {
        await emailCampaignHelpers.trackEmailClick(input.trackingId);
        return { success: true };
      }),

    // Follow-up sequences
    createSequence: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        steps: z.array(z.object({
          stepNumber: z.number(),
          delayDays: z.number(),
          subject: z.string(),
          body: z.string(),
          condition: z.string().optional(),
          templateId: z.number().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        return await emailCampaignHelpers.createFollowUpSequence({
          ...input,
          userId: ctx.user.id,
        });
      }),

    getSequences: protectedProcedure
      .query(async ({ ctx }) => {
        return await emailCampaignHelpers.getSequencesByUser(ctx.user.id);
      }),

    enrollCandidates: protectedProcedure
      .input(z.object({
        sequenceId: z.number(),
        candidateIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        const count = await emailCampaignHelpers.enrollCandidatesInSequence(
          input.sequenceId,
          input.candidateIds
        );
        return { count };
      }),

    // Unsubscribe from emails
    unsubscribe: publicProcedure
      .input(z.object({
        trackingId: z.string(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Get recipient email from tracking ID
        const recipient = await emailCampaignHelpers.getRecipientByTrackingId(input.trackingId);
        if (!recipient) {
          throw new Error('Invalid tracking ID');
        }

        // Add to unsubscribe list
        const database = await getDb();
        if (!database) throw new Error('Database not available');
        
        await database.insert(emailUnsubscribes).values({
          email: recipient.email,
          trackingId: input.trackingId,
          reason: input.reason,
        }).onDuplicateKeyUpdate({
          set: {
            trackingId: input.trackingId,
            reason: input.reason,
            unsubscribedAt: new Date(),
          },
        });

        return { success: true };
      }),
  }),

  // Analytics router
  analytics: router({
    // Application funnel metrics
    getFunnelMetrics: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        return await analyticsHelpers.getApplicationFunnelMetrics(startDate, endDate);
      }),

    // Time to hire metrics
    getTimeToHireMetrics: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        return await analyticsHelpers.getTimeToHireMetrics(startDate, endDate);
      }),

    // Interview completion metrics
    getInterviewMetrics: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        return await analyticsHelpers.getInterviewCompletionMetrics(startDate, endDate);
      }),

    // Email campaign metrics
    getEmailMetrics: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        return await analyticsHelpers.getEmailCampaignMetrics(startDate, endDate);
      }),

    // AI matching metrics
    getAIMatchingMetrics: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        return await analyticsHelpers.getAIMatchingMetrics(startDate, endDate);
      }),

    // Top performing jobs
    getTopJobs: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await analyticsHelpers.getTopPerformingJobs(input.limit || 10);
      }),

    // Recruiter performance
    getRecruiterPerformance: protectedProcedure
      .input(z.object({
        recruiterId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        return await analyticsHelpers.getRecruiterPerformance(input.recruiterId, startDate, endDate);
      }),
  }),

  // AI Assistant (Orion)
  ai: router({
    chat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        
        // Add system message for Orion's personality
        const systemMessage = {
          role: "system" as const,
          content: "You are Orion, an AI career assistant for HotGigs recruitment platform. You help candidates with resume optimization, interview preparation, career advice, job search strategies, and salary negotiation. Be friendly, professional, and provide actionable advice. Keep responses concise and helpful.",
        };

        const response = await invokeLLM({
          messages: [systemMessage, ...input.messages],
        });

        const content = response.choices[0].message.content;
        const messageText = typeof content === 'string' ? content : "I'm sorry, I couldn't generate a response.";
        
        return {
          message: messageText,
        };
      }),
    
    getInterviewPrepQuestions: protectedProcedure
      .input(z.object({ role: z.string(), limit: z.number().optional().default(10) }))
      .query(async ({ input }) => {
        return await db.getInterviewPrepQuestionsByRole(input.role, input.limit);
      }),
    
    getCompanyProfile: protectedProcedure
      .input(z.object({ companyName: z.string() }))
      .query(async ({ input }) => {
        return await db.getCompanyProfileByName(input.companyName);
      }),
    
    getAllCompanyProfiles: protectedProcedure
      .query(async () => {
        return await db.getAllCompanyProfiles();
      }),
  }),
});



export type AppRouter = typeof appRouter;
