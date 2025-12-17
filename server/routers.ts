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
import * as recruiterReportsHelpers from './recruiterReportsHelpers';
import { candidateCareerCoach, recruiterAssistant } from './services/aiAssistant';
import { resumeProfileRouter } from './resumeProfileRouter';
import { onboardingRouter } from './onboardingRouter';
import { profileCompletionRouter } from './profileCompletionRouter';
import { createVideoMeeting } from './videoMeetingService';
import { panelPublicRouter } from './panelPublicRouter';
import { generateRescheduleRequestEmail } from './emails/rescheduleRequestEmail';
import { generateRescheduleApprovedEmail, generateRescheduleRejectedEmail, generateAlternativeProposedEmail } from './emails/rescheduleResponseEmail';
import { generateInterviewRescheduledEmail } from './emails/interviewRescheduledEmail';
import { sendEmail } from './emailService';
import { invokeLLM } from './_core/llm';
import { calculateJobMatch, screenAndRankCandidates } from './ai-matching';
import { getHiringTrends, getTimeToHireMetrics as getPredictiveTimeToHire, getPipelineHealth, predictSuccessRate } from './predictive-analytics';

// Helper to generate random suffix for file keys
function randomSuffix() {
  return Math.random().toString(36).substring(2, 15);
}

// Helper to format uptime in human-readable format
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Helper to mask sensitive values
function maskSensitive(value: string): string {
  if (value.length <= 8) return '••••••••';
  return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
}

export const appRouter = router({
  system: systemRouter,
  resumeProfile: resumeProfileRouter,
  onboarding: onboardingRouter,
  profileCompletion: profileCompletionRouter,
  panelPublic: panelPublicRouter,
  
  // AI Chat router for career coach and recruiting assistant
  ai: router({
    chat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(['system', 'user', 'assistant']),
          content: z.string(),
        })),
        systemPrompt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const messages = input.systemPrompt 
          ? [{ role: 'system' as const, content: input.systemPrompt }, ...input.messages]
          : input.messages;
        
        const response = await invokeLLM({ messages });
        return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      }),
    
    generateInterviewPreparationTips: protectedProcedure
      .input(z.object({
        jobTitle: z.string(),
        companyName: z.string(),
        interviewType: z.string(),
        jobDescription: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { jobTitle, companyName, interviewType, jobDescription } = input;
        
        const interviewTypeLabels: Record<string, string> = {
          'phone': 'Phone Interview',
          'video': 'Video Interview',
          'in-person': 'In-Person Interview',
          'ai-interview': 'AI-Powered Interview',
        };
        
        const typeLabel = interviewTypeLabels[interviewType] || interviewType;
        
        const systemPrompt = `You are an expert career coach helping candidates prepare for job interviews. Provide practical, actionable advice that is specific to the role and company.`;
        
        const userPrompt = `I have an upcoming ${typeLabel} for the position of ${jobTitle} at ${companyName}.

${jobDescription ? `Job Description:\n${jobDescription}\n\n` : ''}
Please provide comprehensive preparation tips including:

1. **Research Tips**: What should I research about the company and role?
2. **Common Questions**: What questions might I be asked for this type of role?
3. **STAR Method Examples**: How can I structure my answers using the STAR method?
4. **Technical Preparation**: Any technical topics I should review?
5. **Questions to Ask**: What thoughtful questions should I ask the interviewer?
6. **${typeLabel} Specific Tips**: Any tips specific to this interview format?
7. **Day-of Checklist**: What should I do on the day of the interview?

Please be specific and practical.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        });
        
        return { tips: response.choices[0]?.message?.content || 'Unable to generate tips at this time.' };
      }),
  }),
  
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
    // AI Assistant endpoint
    aiAssistant: protectedProcedure
      .input(z.object({
        message: z.string(),
        conversationHistory: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        })).optional().default([]),
      }))
      .mutation(async ({ ctx, input }) => {
        const response = await recruiterAssistant(
          ctx.user.id,
          input.message,
          input.conversationHistory
        );
        return { response };
      }),

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
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateRecruiter(id, data);
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
    // AI Career Coach endpoint
    aiCareerCoach: protectedProcedure
      .input(z.object({
        message: z.string(),
        conversationHistory: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        })).optional().default([]),
      }))
      .mutation(async ({ ctx, input }) => {
        const response = await candidateCareerCoach(
          ctx.user.id,
          input.message,
          input.conversationHistory
        );
        return { response };
      }),

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
        return await db.getRecommendedJobsForCandidate(input.candidateId, input.limit);
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

    // Profile sharing - create secure share link
    createShareLink: protectedProcedure
      .input(z.object({
        candidateId: z.number(),
        recipientEmail: z.string().optional(),
        recipientName: z.string().optional(),
        customerId: z.number().optional(),
        jobId: z.number().optional(),
        matchScore: z.number().optional(),
        includeResume: z.boolean().optional().default(true),
        includeVideo: z.boolean().optional().default(true),
        includeContact: z.boolean().optional().default(false),
        expiresInDays: z.number().optional().default(30),
      }))
      .mutation(async ({ ctx, input }) => {
        const shareToken = crypto.randomUUID().replace(/-/g, '');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays || 30));
        
        await db.createProfileShare({
          candidateId: input.candidateId,
          sharedByUserId: ctx.user.id,
          shareToken,
          recipientEmail: input.recipientEmail,
          recipientName: input.recipientName,
          customerId: input.customerId,
          jobId: input.jobId,
          matchScore: input.matchScore,
          includeResume: input.includeResume ?? true,
          includeVideo: input.includeVideo ?? true,
          includeContact: input.includeContact ?? false,
          expiresAt,
        });
        
        return { shareToken, shareUrl: `/share/candidate/${shareToken}` };
      }),

    // Get shared profile (public)
    getSharedProfile: publicProcedure
      .input(z.object({ shareToken: z.string() }))
      .query(async ({ input }) => {
        const share = await db.getProfileShareByToken(input.shareToken);
        if (!share || !share.isActive) {
          throw new Error('Share link not found or expired');
        }
        
        if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
          throw new Error('Share link has expired');
        }
        
        // Increment view count
        await db.incrementShareViewCount(share.id);
        
        // Get candidate data
        const candidate = await db.getCandidateById(share.candidateId);
        if (!candidate) throw new Error('Candidate not found');
        
        const user = await db.getUserById(candidate.userId);
        const sharedBy = await db.getUserById(share.sharedByUserId);
        
        // Get resume profile if included
        let resumeProfile = null;
        if (share.includeResume) {
          resumeProfile = await db.getResumeProfileByCandidate(share.candidateId);
        }
        
        // Get video introduction if included
        let videoIntroduction = null;
        if (share.includeVideo) {
          videoIntroduction = await db.getVideoIntroductionByCandidate(share.candidateId);
        }
        
        return {
          candidate: {
            ...candidate,
            // Hide contact info if not included
            phoneNumber: share.includeContact ? candidate.phoneNumber : null,
          },
          user: share.includeContact ? user : { name: user?.name },
          resumeProfile,
          videoIntroduction,
          sharedBy: { name: sharedBy?.name },
          matchScore: share.matchScore,
          expiresAt: share.expiresAt,
        };
      }),

    // Get all share links created by recruiter
    getShareLinks: protectedProcedure
      .input(z.object({ candidateId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getProfileSharesByUser(ctx.user.id, input.candidateId);
      }),

    // Deactivate share link
    deactivateShareLink: protectedProcedure
      .input(z.object({ shareToken: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.deactivateProfileShare(input.shareToken, ctx.user.id);
        return { success: true };
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

  // Recruiter notification preferences (separate router for clarity)
  recruiterPrefs: router({
    getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
      const { recruiterNotificationPreferences } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const database = await db.getDb();
      if (!database) return null;
      
      const [prefs] = await database
        .select()
        .from(recruiterNotificationPreferences)
        .where(eq(recruiterNotificationPreferences.userId, ctx.user.id));
      
      // Return defaults if no preferences exist
      if (!prefs) {
        return {
          newApplications: true,
          applicationStatusChanges: true,
          applicationFrequency: 'immediate' as const,
          interviewScheduled: true,
          interviewReminders: true,
          interviewCompleted: true,
          panelistResponses: true,
          candidateFeedback: true,
          panelistFeedbackSubmitted: true,
          weeklyDigest: true,
          systemUpdates: false,
          marketingEmails: false,
        };
      }
      
      return prefs;
    }),
    
    updateNotificationPreferences: protectedProcedure
      .input(z.object({
        newApplications: z.boolean().optional(),
        applicationStatusChanges: z.boolean().optional(),
        applicationFrequency: z.enum(['immediate', 'daily', 'weekly']).optional(),
        interviewScheduled: z.boolean().optional(),
        interviewReminders: z.boolean().optional(),
        interviewCompleted: z.boolean().optional(),
        panelistResponses: z.boolean().optional(),
        candidateFeedback: z.boolean().optional(),
        panelistFeedbackSubmitted: z.boolean().optional(),
        weeklyDigest: z.boolean().optional(),
        systemUpdates: z.boolean().optional(),
        marketingEmails: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { recruiterNotificationPreferences } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const database = await db.getDb();
        if (!database) return { success: false };
        
        // Check if preferences exist
        const [existing] = await database
          .select()
          .from(recruiterNotificationPreferences)
          .where(eq(recruiterNotificationPreferences.userId, ctx.user.id));
        
        if (existing) {
          // Update existing
          await database
            .update(recruiterNotificationPreferences)
            .set(input)
            .where(eq(recruiterNotificationPreferences.userId, ctx.user.id));
        } else {
          // Create new
          await database.insert(recruiterNotificationPreferences).values({
            userId: ctx.user.id,
            ...input,
          });
        }
        
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
        const result = await db.createJob({
          ...input,
          postedBy: ctx.user.id,
        });
        return { success: true, id: result.insertId };
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
    
    bulkClose: protectedProcedure
      .input(z.object({ jobIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        for (const jobId of input.jobIds) {
          await db.updateJob(jobId, { status: 'closed' });
        }
        return { success: true, count: input.jobIds.length };
      }),
    
    bulkArchive: protectedProcedure
      .input(z.object({ jobIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        for (const jobId of input.jobIds) {
          await db.updateJob(jobId, { status: 'closed', isPublic: false });
        }
        return { success: true, count: input.jobIds.length };
      }),
    
    duplicate: protectedProcedure
      .input(z.object({ jobIds: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        const createdIds: number[] = [];
        for (const jobId of input.jobIds) {
          const job = await db.getJobById(jobId);
          if (job) {
            const result = await db.createJob({
              title: `${job.title} (Copy)`,
              description: job.description,
              requirements: job.requirements,
              responsibilities: job.responsibilities,
              location: job.location,
              employmentType: job.employmentType,
              salaryMin: job.salaryMin,
              salaryMax: job.salaryMax,
              salaryCurrency: job.salaryCurrency,
              customerId: job.customerId,
              contactId: job.contactId,
              status: 'draft',
              isPublic: false,
              postedBy: ctx.user.id,
            });
            createdIds.push(result.insertId);
          }
        }
        return { success: true, createdIds };
      }),
    
    // Get job templates for recruiter
    getTemplates: protectedProcedure.query(async ({ ctx }) => {
      // For now, return recent jobs as templates (in future, add a separate templates table)
      const recruiter = await db.getRecruiterByUserId(ctx.user.id);
      if (!recruiter) return [];
      const jobs = await db.getJobsByRecruiter(recruiter.id);
      // Return unique jobs by title as templates
      const templateMap = new Map();
      jobs.forEach((job: any) => {
        if (!templateMap.has(job.title)) {
          templateMap.set(job.title, {
            id: job.id,
            name: job.title,
            title: job.title,
            description: job.description,
            requirements: job.requirements,
            responsibilities: job.responsibilities,
            location: job.location,
            employmentType: job.employmentType,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
          });
        }
      });
      return Array.from(templateMap.values()).slice(0, 10);
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
        const appResult = await db.createApplication(input);
        const applicationId = appResult.insertId;
        
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
        
        return { success: true, id: applicationId };
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
    
    // Get placed applications (hired or offered status) for a candidate
    getPlacedByCandidate: protectedProcedure
      .input(z.object({ candidateId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPlacedApplicationsByCandidate(input.candidateId);
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
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateApplication(id, data);
        
        // Send email notification and in-app notification to candidate
        try {
          const applications = await db.getApplicationsByJob(0); // Get application details
          const application = applications.find(app => app.id === id);
          if (application) {
            const candidate = await db.getCandidateById(application.candidateId);
            const job = await db.getJobById(application.jobId);
            if (candidate && job) {
              const user = await db.getUserById(candidate.userId);
              if (user?.email) {
                // Send email
                await sendApplicationStatusUpdate({
                  candidateEmail: user.email,
                  candidateName: user.name || "Candidate",
                  jobTitle: job.title,
                  companyName: job.companyName || "Company",
                  oldStatus: application.status || "pending",
                  newStatus: input.status,
                });
                
                // Create in-app notification
                await notificationHelpers.createNotification({
                  userId: candidate.userId,
                  type: 'status_change',
                  title: 'Application Status Updated',
                  message: `Your application for ${job.title} has been updated to: ${input.status}`,
                  isRead: false,
                  relatedEntityType: 'application',
                  relatedEntityId: id,
                  actionUrl: '/my-applications',
                });
              }
            }
          }
        } catch (error) {
          console.error("Failed to send application status email:", error);
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
    
    // Get placed candidates (offered or onboarded)
    getPlaced: protectedProcedure
      .query(async ({ ctx }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) return [];
        
        // Get all applications with offered or onboarded status for this recruiter's jobs
        const database = await db.getDb();
        if (!database) return [];
        
        const { applications, jobs, candidates, users } = await import('../drizzle/schema');
        const { eq, or, inArray } = await import('drizzle-orm');
        
        // Get recruiter's jobs
        const recruiterJobs = await database
          .select({ id: jobs.id })
          .from(jobs)
          .where(eq(jobs.postedBy, ctx.user.id));
        
        const jobIds = recruiterJobs.map(j => j.id);
        if (jobIds.length === 0) return [];
        
        // Get placed applications
        const placedApps = await database
          .select({
            id: applications.id,
            jobId: applications.jobId,
            candidateId: applications.candidateId,
            status: applications.status,
            createdAt: applications.createdAt,
            updatedAt: applications.updatedAt,
            job: {
              id: jobs.id,
              title: jobs.title,
              companyName: jobs.companyName,
              location: jobs.location,
              salaryMin: jobs.salaryMin,
              salaryMax: jobs.salaryMax,
            },
            candidate: {
              id: candidates.id,
              fullName: candidates.fullName,
              phoneNumber: candidates.phoneNumber,
              user: {
                id: users.id,
                name: users.name,
                email: users.email,
              },
            },
          })
          .from(applications)
          .innerJoin(jobs, eq(applications.jobId, jobs.id))
          .innerJoin(candidates, eq(applications.candidateId, candidates.id))
          .innerJoin(users, eq(candidates.userId, users.id))
          .where(or(
            eq(applications.status, 'offered'),
            eq(applications.status, 'onboarded')
          ));
        
        // Filter to only recruiter's jobs
        return placedApps.filter(app => jobIds.includes(app.jobId));
      }),
    
    // AI-Powered Smart Matching
    calculateSmartMatch: protectedProcedure
      .input(z.object({
        candidateId: z.number(),
        jobId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const candidate = await db.getCandidateById(input.candidateId);
        const job = await db.getJobById(input.jobId);
        
        if (!candidate || !job) {
          throw new Error("Candidate or job not found");
        }
        
        const matchScore = await calculateJobMatch(candidate, job);
        
        // Update application with AI score
        const applications = await db.getApplicationsByJob(input.jobId);
        const application = applications.find(app => app.candidateId === input.candidateId);
        if (application) {
          await db.updateApplication(application.id, { aiScore: matchScore.overallScore });
        }
        
        return matchScore;
      }),
    
    // Screen and Rank All Candidates for a Job
    screenAndRank: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        const job = await db.getJobById(input.jobId);
        if (!job) throw new Error("Job not found");
        
        const applications = await db.getApplicationsByJob(input.jobId);
        
        // Get full candidate details
        const applicationsWithCandidates = await Promise.all(
          applications.map(async (app: any) => {
            const candidate = await db.getCandidateById(app.candidateId);
            return { ...app, candidate };
          })
        );
        
        const rankings = await screenAndRankCandidates(
          applicationsWithCandidates.filter(app => app.candidate),
          job
        );
        
        // Update applications with AI scores
        for (const ranking of rankings) {
          await db.updateApplication(ranking.applicationId, {
            aiScore: ranking.matchScore.overallScore,
          });
        }
        
        return rankings;
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
    
    // Get interviews for recruiter (alias for dashboard calendar)
    getByRecruiter: protectedProcedure.query(async ({ ctx }) => {
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
    
    // Get interviews for candidate by candidateId
    getByCandidate: protectedProcedure
      .input(z.object({ candidateId: z.number() }))
      .query(async ({ input }) => {
        return await db.getInterviewsByCandidateId(input.candidateId);
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
    
    // Request reschedule by candidate
    requestRescheduleByCandidate: protectedProcedure
      .input(z.object({
        interviewId: z.number(),
        reason: z.string(),
        preferredDates: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { interviewId, reason, preferredDates } = input;
        
        // Get the interview details
        const interviewData = await db.getInterviewById(interviewId);
        if (!interviewData) {
          throw new Error('Interview not found');
        }
        const interview = interviewData.interview;
        
        // Verify the candidate owns this interview
        const candidate = await db.getCandidateByUserId(ctx.user.id);
        if (!candidate || interview.candidateId !== candidate.id) {
          throw new Error('You can only request reschedule for your own interviews');
        }
        
        // Check if interview is at least 24 hours away
        const now = new Date();
        const interviewTime = new Date(interview.scheduledAt);
        const hoursUntilInterview = (interviewTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilInterview < 24) {
          throw new Error('Cannot reschedule interviews less than 24 hours away');
        }
        
        // Get the job info from the interview data
        const job = interviewData.job;
        
        // Get the recruiter info
        const recruiter = interview.recruiterId ? await db.getRecruiterByUserId(interview.recruiterId) : null;
        const recruiterUser = recruiter?.userId ? await db.getUserById(recruiter.userId) : null;
        
        // Create notification for recruiter
        if (recruiterUser) {
          const { notifications } = await import("../drizzle/schema");
          const database = await db.getDb();
          if (database) {
            await database.insert(notifications).values({
              userId: recruiterUser.id,
              type: 'reschedule_request',
              title: 'Interview Reschedule Request',
              message: `A candidate has requested to reschedule their interview for ${job?.title || 'a position'}. Reason: ${reason}`,
              isRead: false,
              actionUrl: `/recruiter/interviews`,
            });
          }
        }
        
        // Update interview status to indicate reschedule requested
        await db.updateInterview(interviewId, {
          notes: `[RESCHEDULE REQUESTED] ${reason}${preferredDates && preferredDates.length > 0 ? `\nPreferred dates: ${preferredDates.join(', ')}` : ''}\n\n${interview.notes || ''}`,
        });
        
        return { success: true, message: 'Reschedule request submitted successfully' };
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
    
    // Panel Member Management
    invitePanelist: protectedProcedure
      .input(z.object({
        interviewId: z.number(),
        email: z.string().email(),
        name: z.string().optional(),
        role: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { interviewPanelists, users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        // Find or create user for the panelist
        const [existingUser] = await database
          .select()
          .from(users)
          .where(eq(users.email, input.email));
        
        const userId = existingUser?.id || ctx.user.id; // Use inviter's ID if no user found
        
        // Check if already invited
        const [existing] = await database
          .select()
          .from(interviewPanelists)
          .where(eq(interviewPanelists.interviewId, input.interviewId));
        
        if (existing && existing.email === input.email) {
          throw new Error("This person is already invited to this interview");
        }
        
        // Create panelist invitation
        const [insertResult] = await database.insert(interviewPanelists).values({
          interviewId: input.interviewId,
          userId,
          email: input.email,
          name: input.name || null,
          role: input.role || null,
          status: 'invited',
        });
        
        const panelistId = insertResult.insertId;
        
        // Generate action tokens for email links
        const { createPanelActionTokens, generateActionUrls } = await import("./panelTokenService");
        const tokens = await createPanelActionTokens(panelistId, input.interviewId);
        const baseUrl = process.env.VITE_APP_URL || 'https://hotgigs.manus.space';
        const actionUrls = generateActionUrls(baseUrl, tokens);
        
        // Send invitation email
        try {
          const { sendPanelInvitationEmail } = await import("./panelInvitationEmail");
          const interview = await db.getInterviewById(input.interviewId);
          if (interview) {
            const job = await db.getJobById(interview.interview.jobId);
            const candidate = await db.getCandidateById(interview.interview.candidateId);
            const recruiter = await db.getRecruiterByUserId(ctx.user.id);
            
            await sendPanelInvitationEmail({
              panelistEmail: input.email,
              panelistName: input.name,
              recruiterName: recruiter?.companyName || ctx.user.name || 'Recruiter',
              candidateName: (candidate as any)?.fullName || (candidate as any)?.name || 'Candidate',
              jobTitle: job?.title || 'Position',
              companyName: job?.companyName || undefined,
              interviewDate: new Date(interview.interview.scheduledAt),
              interviewDuration: interview.interview.duration || 60,
              interviewType: interview.interview.type || 'video',
              meetingLink: interview.interview.meetingLink || undefined,
              location: interview.interview.location || undefined,
              notes: interview.interview.notes || undefined,
              acceptUrl: actionUrls.acceptUrl,
              declineUrl: actionUrls.declineUrl,
              rescheduleUrl: actionUrls.rescheduleUrl,
              feedbackUrl: actionUrls.feedbackUrl,
            });
          }
        } catch (emailError) {
          console.error('Failed to send panel invitation email:', emailError);
          // Don't fail the invitation if email fails
        }
        
        return { success: true };
      }),
    
    getPanelists: protectedProcedure
      .input(z.object({ interviewId: z.number() }))
      .query(async ({ input }) => {
        const { interviewPanelists } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const database = await db.getDb();
        if (!database) return [];
        
        const panelists = await database
          .select()
          .from(interviewPanelists)
          .where(eq(interviewPanelists.interviewId, input.interviewId));
        
        return panelists;
      }),
    
    updatePanelistStatus: protectedProcedure
      .input(z.object({
        panelistId: z.number(),
        status: z.enum(['invited', 'accepted', 'declined', 'attended']),
      }))
      .mutation(async ({ input }) => {
        const { interviewPanelists } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        await database
          .update(interviewPanelists)
          .set({
            status: input.status,
            respondedAt: input.status !== 'invited' ? new Date() : null,
            attendedAt: input.status === 'attended' ? new Date() : null,
          })
          .where(eq(interviewPanelists.id, input.panelistId));
        
        return { success: true };
      }),
    
    removePanelist: protectedProcedure
      .input(z.object({ panelistId: z.number() }))
      .mutation(async ({ input }) => {
        const { interviewPanelists } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        await database
          .delete(interviewPanelists)
          .where(eq(interviewPanelists.id, input.panelistId));
        
        return { success: true };
      }),
    
    // Panel Member Feedback
    submitPanelistFeedback: protectedProcedure
      .input(z.object({
        interviewId: z.number(),
        panelistId: z.number(),
        overallRating: z.number().min(1).max(5),
        technicalSkills: z.number().min(1).max(5).optional(),
        communicationSkills: z.number().min(1).max(5).optional(),
        problemSolving: z.number().min(1).max(5).optional(),
        cultureFit: z.number().min(1).max(5).optional(),
        strengths: z.string().optional(),
        weaknesses: z.string().optional(),
        notes: z.string().optional(),
        recommendation: z.enum(['strong_hire', 'hire', 'no_hire', 'strong_no_hire']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { panelistFeedback } = await import("../drizzle/schema");
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        await database.insert(panelistFeedback).values({
          interviewId: input.interviewId,
          panelistId: input.panelistId,
          userId: ctx.user.id,
          overallRating: input.overallRating,
          technicalSkills: input.technicalSkills || null,
          communicationSkills: input.communicationSkills || null,
          problemSolving: input.problemSolving || null,
          cultureFit: input.cultureFit || null,
          strengths: input.strengths || null,
          weaknesses: input.weaknesses || null,
          notes: input.notes || null,
          recommendation: input.recommendation || null,
        });
        
        return { success: true };
      }),
    
    getPanelistFeedback: protectedProcedure
      .input(z.object({ interviewId: z.number() }))
      .query(async ({ input }) => {
        const { panelistFeedback, interviewPanelists } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const database = await db.getDb();
        if (!database) return [];
        
        const feedback = await database
          .select({
            feedback: panelistFeedback,
            panelist: interviewPanelists,
          })
          .from(panelistFeedback)
          .innerJoin(interviewPanelists, eq(panelistFeedback.panelistId, interviewPanelists.id))
          .where(eq(panelistFeedback.interviewId, input.interviewId));
        
        return feedback;
      }),
    
    hasPanelistFeedback: protectedProcedure
      .input(z.object({ interviewId: z.number(), panelistId: z.number() }))
      .query(async ({ input }) => {
        const { panelistFeedback } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const database = await db.getDb();
        if (!database) return false;
        
        const [existing] = await database
          .select()
          .from(panelistFeedback)
          .where(and(
            eq(panelistFeedback.interviewId, input.interviewId),
            eq(panelistFeedback.panelistId, input.panelistId)
          ));
        
        return !!existing;
      }),
    
    // Aggregated feedback summary for interview cards
    getPanelistFeedbackSummary: protectedProcedure
      .input(z.object({ interviewId: z.number() }))
      .query(async ({ input }) => {
        const { panelistFeedback, interviewPanelists } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const database = await db.getDb();
        if (!database) return null;
        
        // Get all feedback for this interview
        const allFeedback = await database
          .select({
            technicalScore: panelistFeedback.technicalSkills,
            communicationScore: panelistFeedback.communicationSkills,
            problemSolvingScore: panelistFeedback.problemSolving,
            cultureFitScore: panelistFeedback.cultureFit,
            overallScore: panelistFeedback.overallRating,
            recommendation: panelistFeedback.recommendation,
            panelistName: interviewPanelists.name,
            panelistEmail: interviewPanelists.email,
          })
          .from(panelistFeedback)
          .innerJoin(interviewPanelists, eq(panelistFeedback.panelistId, interviewPanelists.id))
          .where(eq(panelistFeedback.interviewId, input.interviewId));
        
        if (allFeedback.length === 0) return null;
        
        // Calculate averages
        const avgTechnical = allFeedback.reduce((sum, f) => sum + (f.technicalScore || 0), 0) / allFeedback.length;
        const avgCommunication = allFeedback.reduce((sum, f) => sum + (f.communicationScore || 0), 0) / allFeedback.length;
        const avgProblemSolving = allFeedback.reduce((sum, f) => sum + (f.problemSolvingScore || 0), 0) / allFeedback.length;
        const avgCultureFit = allFeedback.reduce((sum, f) => sum + (f.cultureFitScore || 0), 0) / allFeedback.length;
        const avgOverall = allFeedback.reduce((sum, f) => sum + (f.overallScore || 0), 0) / allFeedback.length;
        
        // Count recommendations
        const recommendations = {
          strongHire: allFeedback.filter(f => f.recommendation === 'strong_hire').length,
          hire: allFeedback.filter(f => f.recommendation === 'hire').length,
          noHire: allFeedback.filter(f => f.recommendation === 'no_hire').length,
          strongNoHire: allFeedback.filter(f => f.recommendation === 'strong_no_hire').length,
        };
        
        // Determine consensus
        const positiveCount = recommendations.strongHire + recommendations.hire;
        const negativeCount = recommendations.noHire + recommendations.strongNoHire;
        let consensus: 'positive' | 'negative' | 'mixed' = 'mixed';
        if (positiveCount > 0 && negativeCount === 0) consensus = 'positive';
        else if (negativeCount > 0 && positiveCount === 0) consensus = 'negative';
        
        return {
          totalResponses: allFeedback.length,
          averages: {
            technical: Math.round(avgTechnical * 10) / 10,
            communication: Math.round(avgCommunication * 10) / 10,
            problemSolving: Math.round(avgProblemSolving * 10) / 10,
            cultureFit: Math.round(avgCultureFit * 10) / 10,
            overall: Math.round(avgOverall * 10) / 10,
          },
          recommendations,
          consensus,
          panelists: allFeedback.map(f => ({
            name: f.panelistName || f.panelistEmail,
            recommendation: f.recommendation,
            overallScore: f.overallScore,
          })),
        };
      }),
    
    // Calendar Sync - Get calendar links for interview
    getCalendarLinks: protectedProcedure
      .input(z.object({ interviewId: z.number() }))
      .query(async ({ input }) => {
        const { generateCalendarLinks } = await import('./services/calendarSyncService');
        return await generateCalendarLinks(input.interviewId);
      }),
    
    // Calendar Sync - Download ICS file
    downloadICS: protectedProcedure
      .input(z.object({ interviewId: z.number() }))
      .query(async ({ input }) => {
        const { generateCalendarLinks } = await import('./services/calendarSyncService');
        const links = await generateCalendarLinks(input.interviewId);
        if (!links) return null;
        return { icsContent: links.icsContent };
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

    // Environment management endpoints
    getEnvironmentInfo: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        const { ENV } = await import('./_core/env');
        
        // Get service statuses (simulated - in production would check actual services)
        const services = [
          { 
            name: "Frontend (Vite)", 
            status: "running" as const, 
            port: 3000, 
            uptime: formatUptime(process.uptime()) 
          },
          { 
            name: "Backend (Express)", 
            status: "running" as const, 
            port: 3000, 
            uptime: formatUptime(process.uptime()) 
          },
          { 
            name: "Database (TiDB)", 
            status: "running" as const, 
            uptime: "Connected" 
          },
        ];
        
        // Get environment variables (mask sensitive values)
        const envVars: Record<string, string> = {
          // App Configuration
          VITE_APP_TITLE: ENV.appTitle || "Not configured",
          VITE_APP_LOGO: ENV.appLogo || "Not configured",
          VITE_APP_ID: ENV.appId || "Not configured",
          VITE_OAUTH_PORTAL_URL: ENV.oauthPortalUrl || "Not configured",
          NODE_ENV: ENV.nodeEnv || "development",
          VIDEO_PROVIDER: ENV.videoProvider || "none",
          
          // Analytics
          VITE_ANALYTICS_WEBSITE_ID: ENV.analyticsWebsiteId || "Not configured",
          VITE_ANALYTICS_ENDPOINT: ENV.analyticsEndpoint || "Not configured",
          
          // Database
          DATABASE_URL: ENV.databaseUrl ? maskSensitive(ENV.databaseUrl) : "Not configured",
          
          // Security
          JWT_SECRET: ENV.jwtSecret ? maskSensitive(ENV.jwtSecret) : "Not configured",
          
          // Manus/Forge API
          BUILT_IN_FORGE_API_KEY: ENV.forgeApiKey ? maskSensitive(ENV.forgeApiKey) : "Not configured",
          BUILT_IN_FORGE_API_URL: ENV.forgeApiUrl || "Not configured",
          VITE_FRONTEND_FORGE_API_KEY: ENV.frontendForgeApiKey ? maskSensitive(ENV.frontendForgeApiKey) : "Not configured",
          VITE_FRONTEND_FORGE_API_URL: ENV.frontendForgeApiUrl || "Not configured",
          
          // AI/LLM APIs
          OPENAI_API_KEY: ENV.openaiApiKey ? maskSensitive(ENV.openaiApiKey) : "Not configured",
          ANTHROPIC_API_KEY: ENV.anthropicApiKey ? maskSensitive(ENV.anthropicApiKey) : "Not configured",
          
          // Email Services
          SENDGRID_API_KEY: ENV.sendGridApiKey ? maskSensitive(ENV.sendGridApiKey) : "Not configured",
          RESEND_API_KEY: ENV.resendApiKey ? maskSensitive(ENV.resendApiKey) : "Not configured",
          
          // Video Conferencing
          ZOOM_CLIENT_ID: ENV.zoomClientId ? maskSensitive(ENV.zoomClientId) : "Not configured",
          ZOOM_CLIENT_SECRET: ENV.zoomClientSecret ? maskSensitive(ENV.zoomClientSecret) : "Not configured",
          ZOOM_ACCOUNT_ID: ENV.zoomAccountId ? maskSensitive(ENV.zoomAccountId) : "Not configured",
          TEAMS_CLIENT_ID: ENV.teamsClientId ? maskSensitive(ENV.teamsClientId) : "Not configured",
          TEAMS_CLIENT_SECRET: ENV.teamsClientSecret ? maskSensitive(ENV.teamsClientSecret) : "Not configured",
          TEAMS_TENANT_ID: ENV.teamsTenantId ? maskSensitive(ENV.teamsTenantId) : "Not configured",
          
          // Storage (S3)
          S3_BUCKET_NAME: ENV.s3BucketName || "Not configured",
          S3_REGION: ENV.s3Region || "Not configured",
          S3_ACCESS_KEY_ID: ENV.s3AccessKeyId ? maskSensitive(ENV.s3AccessKeyId) : "Not configured",
          S3_SECRET_ACCESS_KEY: ENV.s3SecretAccessKey ? maskSensitive(ENV.s3SecretAccessKey) : "Not configured",
          
          // Payment (Stripe)
          STRIPE_SECRET_KEY: ENV.stripeSecretKey ? maskSensitive(ENV.stripeSecretKey) : "Not configured",
          VITE_STRIPE_PUBLISHABLE_KEY: ENV.stripePublishableKey ? maskSensitive(ENV.stripePublishableKey) : "Not configured",
          STRIPE_WEBHOOK_SECRET: ENV.stripeWebhookSecret ? maskSensitive(ENV.stripeWebhookSecret) : "Not configured",
          
          // SMS/Communication (Twilio)
          TWILIO_ACCOUNT_SID: ENV.twilioAccountSid ? maskSensitive(ENV.twilioAccountSid) : "Not configured",
          TWILIO_AUTH_TOKEN: ENV.twilioAuthToken ? maskSensitive(ENV.twilioAuthToken) : "Not configured",
          TWILIO_PHONE_NUMBER: ENV.twilioPhoneNumber || "Not configured",
        };
        
        return { services, envVars };
      }),

    restartService: protectedProcedure
      .input(z.object({ service: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        // In a real production environment, this would trigger actual service restarts
        // For now, we simulate the restart
        console.log(`[Admin] Restart requested for service: ${input.service}`);
        
        // Simulate restart delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { 
          success: true, 
          message: `Service ${input.service} restart initiated`,
          timestamp: new Date().toISOString()
        };
      }),

    stopService: protectedProcedure
      .input(z.object({ service: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        console.log(`[Admin] Stop requested for service: ${input.service}`);
        
        return { 
          success: true, 
          message: `Service ${input.service} stop initiated`,
          timestamp: new Date().toISOString()
        };
      }),

    startService: protectedProcedure
      .input(z.object({ service: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        console.log(`[Admin] Start requested for service: ${input.service}`);
        
        return { 
          success: true, 
          message: `Service ${input.service} start initiated`,
          timestamp: new Date().toISOString()
        };
      }),

    // Environment Variables CRUD
    getEditableEnvVars: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        await db.seedDefaultEnvironmentVariables();
        return db.getEditableEnvironmentVariables();
      }),

    updateEnvVar: protectedProcedure
      .input(z.object({ key: z.string(), value: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        console.log(`[Admin] Updating env var: ${input.key}`);
        const updated = await db.updateEnvironmentVariableValue(input.key, input.value, ctx.user.id);
        return { success: true, envVar: updated, message: `${input.key} updated successfully` };
      }),

    revertEnvVar: protectedProcedure
      .input(z.object({ key: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        console.log(`[Admin] Reverting env var: ${input.key}`);
        const reverted = await db.revertEnvironmentVariable(input.key, ctx.user.id);
        return { success: true, envVar: reverted, message: `${input.key} reverted to previous value` };
      }),

    createEnvVar: protectedProcedure
      .input(z.object({
        key: z.string(),
        value: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        isSensitive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        console.log(`[Admin] Creating env var: ${input.key}`);
        await db.upsertEnvironmentVariable({
          key: input.key,
          currentValue: input.value,
          previousValue: input.value,
          description: input.description,
          category: input.category || 'Custom',
          isEditable: true,
          isSensitive: input.isSensitive || false,
          updatedBy: ctx.user.id,
        });
        return { success: true, message: `${input.key} created successfully` };
      }),

    deleteEnvVar: protectedProcedure
      .input(z.object({ key: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        console.log(`[Admin] Deleting env var: ${input.key}`);
        await db.deleteEnvironmentVariable(input.key);
        return { success: true, message: `${input.key} deleted successfully` };
      }),

    // Application Logs
    getLogs: protectedProcedure
      .input(z.object({
        level: z.string().optional(),
        source: z.string().optional(),
        search: z.string().optional(),
        resolved: z.boolean().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        return db.getApplicationLogs(input);
      }),

    getLogStats: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        return db.getLogStats();
      }),

    resolveLog: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        const resolved = await db.resolveLog(input.id, ctx.user.id);
        return { success: true, log: resolved };
      }),

    createLog: protectedProcedure
      .input(z.object({
        level: z.enum(['debug', 'info', 'warn', 'error', 'critical']),
        source: z.string(),
        message: z.string(),
        details: z.string().optional(),
        stackTrace: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createApplicationLog({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),

    // Log Retention Policy
    getLogRetentionDays: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        const days = await db.getLogRetentionDays();
        return { days };
      }),

    setLogRetentionDays: protectedProcedure
      .input(z.object({ days: z.number().min(1).max(365) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        await db.setLogRetentionDays(input.days);
        return { success: true, days: input.days };
      }),

    cleanupOldLogs: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        const result = await db.cleanupOldLogs();
        return { success: true, deletedCount: result.deletedCount };
      }),

    // Database Info
    getDatabaseInfo: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        // Return list of tables and basic info
        const tables = [
          'users', 'recruiters', 'candidates', 'jobs', 'applications',
          'interviews', 'customers', 'resume_profiles', 'video_introductions',
          'application_logs', 'environment_variables'
        ];
        return { tables, connectionStatus: 'connected' };
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

  // Email Campaign Analytics router
  emailCampaign: router({
    list: protectedProcedure
      .input(z.object({ recruiterId: z.number() }))
      .query(async ({ ctx }) => {
        const campaigns = await emailCampaignHelpers.getCampaignsByUser(ctx.user.id);
        return campaigns.map(c => ({
          id: c.campaign.id,
          name: c.campaign.name,
          subject: c.campaign.subject,
          status: c.campaign.status,
          sentAt: c.campaign.sentAt,
          sentCount: c.campaign.sentCount || 0,
          openedCount: c.campaign.openedCount || 0,
          clickedCount: c.campaign.clickedCount || 0,
          bouncedCount: c.campaign.bouncedCount || 0,
          repliedCount: c.campaign.repliedCount || 0,
        }));
      }),

    getAnalytics: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const campaignData = await emailCampaignHelpers.getCampaignById(input.campaignId);
        if (!campaignData) throw new Error('Campaign not found');
        
        return {
          campaign: campaignData,
          recipients: campaignData.recipients?.map(r => ({
            id: r.recipient.id,
            email: r.user?.email || r.recipient.email || '',
            sentAt: r.recipient.sentAt,
            openedAt: r.recipient.openedAt,
            clickedAt: r.recipient.clickedAt,
            bouncedAt: r.recipient.bouncedAt,
            repliedAt: null, // Add if available in schema
          })) || [],
        };
      }),

    // Get all email templates
    getTemplates: protectedProcedure
      .query(async () => {
        const { allEmailTemplates } = await import('./emails/recruitmentTemplates');
        return allEmailTemplates.map(t => ({
          id: t.id,
          name: t.name,
          category: t.category,
          subject: t.subject,
          variables: t.variables,
        }));
      }),

    // Get template by ID
    getTemplateById: protectedProcedure
      .input(z.object({ templateId: z.string() }))
      .query(async ({ input }) => {
        const { getEmailTemplateById } = await import('./emails/recruitmentTemplates');
        return getEmailTemplateById(input.templateId);
      }),

    // Get templates by category
    getTemplatesByCategory: protectedProcedure
      .input(z.object({ category: z.enum(['job', 'interview', 'offer', 'onboarding', 'general']) }))
      .query(async ({ input }) => {
        const { getEmailTemplatesByCategory } = await import('./emails/recruitmentTemplates');
        return getEmailTemplatesByCategory(input.category);
      }),

    // Fill template with variables
    fillTemplate: protectedProcedure
      .input(z.object({
        templateId: z.string(),
        variables: z.record(z.string(), z.string()),
      }))
      .mutation(async ({ input }) => {
        const { getEmailTemplateById, fillEmailTemplate } = await import('./emails/recruitmentTemplates');
        const template = getEmailTemplateById(input.templateId);
        if (!template) throw new Error('Template not found');
        return fillEmailTemplate(template, input.variables as Record<string, string>);
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
    
    // Predictive Analytics - Hiring Trends
    getHiringTrends: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) throw new Error('Recruiter profile not found');
        
        const endDate = input.endDate ? new Date(input.endDate) : new Date();
        const startDate = input.startDate ? new Date(input.startDate) : new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days default
        
        return await getHiringTrends(recruiter.id, startDate, endDate);
      }),
    
    // Predictive Analytics - Time to Hire
    getPredictiveTimeToHire: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) throw new Error('Recruiter profile not found');
        
        const endDate = input.endDate ? new Date(input.endDate) : new Date();
        const startDate = input.startDate ? new Date(input.startDate) : new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        
        return await getPredictiveTimeToHire(recruiter.id, startDate, endDate);
      }),
    
    // Predictive Analytics - Pipeline Health
    getPipelineHealth: protectedProcedure
      .query(async ({ ctx }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) throw new Error('Recruiter profile not found');
        
        return await getPipelineHealth(recruiter.id);
      }),
    
    // Predictive Analytics - Success Rate Prediction
    getSuccessRatePrediction: protectedProcedure
      .input(z.object({
        historicalMonths: z.number().optional().default(6),
      }))
      .query(async ({ ctx, input }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) throw new Error('Recruiter profile not found');
        
        return await predictSuccessRate(recruiter.id, input.historicalMonths);
      }),
  }),

  // Reschedule Requests Router
  reschedule: router({
    // Submit a reschedule request (panelist)
    submitRequest: protectedProcedure
      .input(z.object({
        interviewId: z.number(),
        panelistId: z.number(),
        reason: z.string(),
        preferredDates: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createRescheduleRequest({
          interviewId: input.interviewId,
          panelistId: input.panelistId,
          requestedBy: ctx.user.id,
          reason: input.reason,
          preferredDates: input.preferredDates ? JSON.stringify(input.preferredDates) : null,
          status: 'pending',
        });

        // Get interview details for notification
        const interview = await db.getInterviewById(input.interviewId);
        if (interview) {
          const job = await db.getJobById(interview.interview.jobId);
          // Notify the recruiter who posted the job
          if (job) {
            await db.createNotification({
              userId: job.postedBy,
              type: 'reschedule_request',
              title: 'Reschedule Request',
              message: `A panelist has requested to reschedule the interview for ${job.title}. Reason: ${input.reason}`,
              relatedEntityType: 'interview',
              relatedEntityId: input.interviewId,
              actionUrl: `/recruiter/reschedule-requests`,
            });

            // Send email notification to recruiter
            try {
              const recruiter = await db.getUserById(job.postedBy);
              const candidate = interview.candidate;
              const panelist = await db.getUserById(ctx.user.id);
              
              if (recruiter?.email) {
                const scheduledDate = new Date(interview.interview.scheduledAt);
                const emailData = generateRescheduleRequestEmail({
                  recruiterName: recruiter.name || recruiter.email.split('@')[0],
                  panelistName: panelist?.name || ctx.user.email?.split('@')[0] || 'Panel Member',
                  panelistEmail: panelist?.email || ctx.user.email || '',
                  candidateName: (candidate as any)?.fullName || (candidate as any)?.name || 'Candidate',
                  jobTitle: job.title,
                  originalDate: scheduledDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                  originalTime: scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                  reason: input.reason,
                  preferredTimes: input.preferredDates || [],
                  dashboardUrl: `${process.env.VITE_OAUTH_PORTAL_URL?.replace('/portal', '') || ''}/recruiter/reschedule-requests`,
                });

                await sendEmail({
                  to: recruiter.email,
                  subject: emailData.subject,
                  html: emailData.html,
                  text: emailData.text,
                });
              }
            } catch (emailError) {
              console.error('Failed to send reschedule request email:', emailError);
              // Don't fail the request if email fails
            }
          }
        }

        return { success: true };
      }),

    // Get pending reschedule requests for recruiter
    getPendingRequests: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getPendingRescheduleRequests(ctx.user.id);
      }),

    // Get reschedule requests for a specific interview
    getByInterview: protectedProcedure
      .input(z.object({ interviewId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRescheduleRequestsByInterview(input.interviewId);
      }),

    // Resolve a reschedule request (recruiter)
    resolveRequest: protectedProcedure
      .input(z.object({
        requestId: z.number(),
        status: z.enum(['approved', 'rejected', 'alternative_proposed']),
        newInterviewTime: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateRescheduleRequest(input.requestId, {
          status: input.status,
          resolvedAt: new Date(),
          resolvedBy: ctx.user.id,
          newInterviewTime: input.newInterviewTime ? new Date(input.newInterviewTime) : null,
        });

        // Get request details for email notification
        try {
          const { rescheduleRequests, interviews, applications, jobs, candidates, users, interviewPanelists } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const database = await db.getDb();
          
          if (database) {
            const requestDetails = await database
              .select()
              .from(rescheduleRequests)
              .leftJoin(interviews, eq(rescheduleRequests.interviewId, interviews.id))
              .leftJoin(applications, eq(interviews.applicationId, applications.id))
              .leftJoin(jobs, eq(applications.jobId, jobs.id))
              .leftJoin(candidates, eq(applications.candidateId, candidates.id))
              .leftJoin(users, eq(candidates.userId, users.id))
              .where(eq(rescheduleRequests.id, input.requestId))
              .limit(1);
            
            if (requestDetails.length > 0) {
              const req = requestDetails[0];
              const panelistEmail = (req.reschedule_requests as any)?.panelistEmail;
              const panelistName = (req.reschedule_requests as any)?.panelistName || 'Panelist';
              const candidateName = (req.users as any)?.name || 'Candidate';
              const jobTitle = (req.jobs as any)?.title || 'Position';
              const originalDate = (req.interviews as any)?.scheduledAt 
                ? new Date((req.interviews as any).scheduledAt).toLocaleString()
                : 'TBD';
              
              if (panelistEmail) {
                let emailContent;
                
                if (input.status === 'approved') {
                  emailContent = generateRescheduleApprovedEmail({
                    panelistName,
                    candidateName,
                    jobTitle,
                    originalDate,
                    notes: input.notes,
                  });
                } else if (input.status === 'rejected') {
                  emailContent = generateRescheduleRejectedEmail({
                    panelistName,
                    candidateName,
                    jobTitle,
                    originalDate,
                    notes: input.notes,
                  });
                } else if (input.status === 'alternative_proposed' && input.newInterviewTime) {
                  // Generate confirmation/decline URLs for panelist
                  const baseUrl = process.env.VITE_OAUTH_PORTAL_URL?.replace('/portal', '') || '';
                  const confirmUrl = `${baseUrl}/reschedule/confirm?requestId=${input.requestId}&action=confirm`;
                  const declineUrl = `${baseUrl}/reschedule/confirm?requestId=${input.requestId}&action=decline`;
                  
                  emailContent = generateAlternativeProposedEmail({
                    panelistName,
                    candidateName,
                    jobTitle,
                    originalDate,
                    proposedDate: new Date(input.newInterviewTime).toLocaleString(),
                    notes: input.notes,
                    rescheduleRequestId: input.requestId,
                    confirmUrl,
                    declineUrl,
                  });
                }
                
                if (emailContent) {
                  await sendEmail({
                    to: panelistEmail,
                    subject: emailContent.subject,
                    html: emailContent.html,
                    text: emailContent.text,
                  });
                }
              }
            }
          }
        } catch (emailError) {
          console.error('Failed to send reschedule response email:', emailError);
          // Don't fail the request if email fails
        }

        // If approved with new time, automatically update the interview
        if (input.status === 'approved' && input.newInterviewTime) {
          try {
            const { rescheduleRequests } = await import("../drizzle/schema");
            const { eq } = await import("drizzle-orm");
            const database = await db.getDb();
            
            if (database) {
              const request = await database
                .select()
                .from(rescheduleRequests)
                .where(eq(rescheduleRequests.id, input.requestId))
                .limit(1);
              
              if (request.length > 0) {
                const interviewId = (request[0] as any).interviewId;
                if (interviewId) {
                  await db.updateInterview(interviewId, {
                    scheduledAt: new Date(input.newInterviewTime),
                  });
                  
                  // Create notification and send email to the candidate about the rescheduled interview
                  const interviewDetails = await db.getInterviewById(interviewId);
                  if (interviewDetails) {
                    const application = await db.getApplicationById((interviewDetails as any).applicationId);
                    if (application) {
                      const candidate = await db.getCandidateById((application as any).candidateId);
                      const job = await db.getJobById((application as any).jobId);
                      if (candidate) {
                        // Create in-app notification
                        await db.createNotification({
                          userId: (candidate as any).userId,
                          type: 'interview_rescheduled',
                          title: 'Interview Rescheduled',
                          message: `Your interview has been rescheduled to ${new Date(input.newInterviewTime).toLocaleString()}`,
                          relatedEntityType: 'interview',
                          relatedEntityId: interviewId,
                          actionUrl: `/candidate/dashboard`,
                        });
                        
                        // Send email to candidate
                        const candidateUser = await db.getUserById((candidate as any).userId);
                        if (candidateUser?.email) {
                          const originalDate = new Date((interviewDetails as any).scheduledAt);
                          const newDate = new Date(input.newInterviewTime);
                          
                          const emailData = generateInterviewRescheduledEmail({
                            candidateName: candidateUser.name || candidateUser.email.split('@')[0],
                            jobTitle: job?.title || 'Position',
                            companyName: job?.companyName || undefined,
                            originalDate: originalDate.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                            newDate: newDate.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                            interviewType: (interviewDetails as any).type || 'video',
                            meetingLink: (interviewDetails as any).meetingLink || undefined,
                            location: (interviewDetails as any).location || undefined,
                            recruiterName: ctx.user.name || undefined,
                          });
                          
                          await sendEmail({
                            to: candidateUser.email,
                            subject: emailData.subject,
                            html: emailData.html,
                          });
                        }
                      }
                    }
                  }
                }
              }
            }
          } catch (calendarError) {
            console.error('Failed to update interview calendar:', calendarError);
            // Don't fail the request if calendar update fails
          }
        }

        return { success: true };
      }),
    
    // Panelist confirms or declines proposed alternative time (from email link)
    confirmAlternative: publicProcedure
      .input(z.object({
        requestId: z.number(),
        action: z.enum(['confirm', 'decline']),
      }))
      .mutation(async ({ input }) => {
        const { rescheduleRequests, interviews } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const database = await db.getDb();
        
        if (!database) throw new Error('Database not available');
        
        // Get the request details
        const [request] = await database
          .select()
          .from(rescheduleRequests)
          .where(eq(rescheduleRequests.id, input.requestId))
          .limit(1);
        
        if (!request) {
          throw new Error('Reschedule request not found');
        }
        
        if (request.status !== 'alternative_proposed') {
          throw new Error('This request is no longer pending confirmation');
        }
        
        if (input.action === 'confirm') {
          // Update request status to approved
          await database.update(rescheduleRequests).set({
            status: 'approved',
            resolvedAt: new Date(),
          }).where(eq(rescheduleRequests.id, input.requestId));
          
          // Update the interview time if newInterviewTime was set
          if (request.newInterviewTime) {
            await database.update(interviews).set({
              scheduledAt: request.newInterviewTime,
            }).where(eq(interviews.id, request.interviewId));
          }
          
          return { success: true, message: 'Alternative time confirmed. The interview has been rescheduled.' };
        } else {
          // Update request status to rejected
          await database.update(rescheduleRequests).set({
            status: 'rejected',
            resolvedAt: new Date(),
          }).where(eq(rescheduleRequests.id, input.requestId));
          
          return { success: true, message: 'Alternative time declined. The recruiter will be notified.' };
        }
      }),
  }),

  // Panelist Reminders Router
  panelistReminders: router({
    // Process all pending reminders (called by cron job or manually)
    processReminders: protectedProcedure
      .mutation(async () => {
        const { processPanelistReminders } = await import('./services/panelistReminderService');
        return await processPanelistReminders();
      }),

    // Get upcoming interviews for panelists (for dashboard)
    getUpcomingForPanelist: protectedProcedure
      .query(async ({ ctx }) => {
        const { interviewPanelists, interviews, applications, jobs, candidates, users } = await import("../drizzle/schema");
        const { eq, and, gte } = await import("drizzle-orm");
        const database = await db.getDb();
        if (!database) return [];

        const now = new Date();
        const result = await database
          .select()
          .from(interviewPanelists)
          .leftJoin(interviews, eq(interviewPanelists.interviewId, interviews.id))
          .leftJoin(applications, eq(interviews.applicationId, applications.id))
          .leftJoin(jobs, eq(applications.jobId, jobs.id))
          .leftJoin(candidates, eq(applications.candidateId, candidates.id))
          .leftJoin(users, eq(candidates.userId, users.id))
          .where(
            and(
              eq(interviewPanelists.email, ctx.user.email || ''),
              eq(interviewPanelists.status, 'accepted'),
              gte(interviews.scheduledAt, now)
            )
          );

        return result.map((row: any) => ({
          panelist: row.interview_panelists,
          interview: row.interviews,
          job: row.jobs,
          candidate: {
            ...row.candidates,
            user: row.users,
          },
        }));
      }),
  }),

  // Feedback PDF Export Router
  feedbackExport: router({
    // Generate PDF report for interview feedback
    generatePDF: protectedProcedure
      .input(z.object({ interviewId: z.number() }))
      .mutation(async ({ input }) => {
        const { generateFeedbackPDFReport } = await import('./feedbackPDFGenerator');
        const pdfUrl = await generateFeedbackPDFReport(input.interviewId);
        return { pdfUrl };
      }),
  }),

  // Skill Matrix Router
  skillMatrix: router({
    // Create/update skill requirements for a job
    setJobSkillRequirements: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        skills: z.array(z.object({
          skillName: z.string(),
          isMandatory: z.boolean(),
        })),
      }))
      .mutation(async ({ input }) => {
        await db.createJobSkillRequirements(input.jobId, input.skills);
        return { success: true };
      }),

    // Get skill requirements for a job
    getJobSkillRequirements: publicProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        return await db.getJobSkillRequirements(input.jobId);
      }),

    // Submit candidate skill ratings with application
    submitSkillRatings: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        ratings: z.array(z.object({
          skillRequirementId: z.number(),
          skillName: z.string(),
          rating: z.number().min(1).max(5),
          yearsExperience: z.number().min(0),
          lastUsedYear: z.number().min(1990).max(2030),
        })),
      }))
      .mutation(async ({ input }) => {
        await db.createCandidateSkillRatings(input.applicationId, input.ratings);
        return { success: true };
      }),

    // Get candidate skill ratings for an application
    getCandidateSkillRatings: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCandidateSkillRatings(input.applicationId);
      }),
  }),

  // Recruiter Reports router
  reports: router({
    // Dashboard summary
    getDashboardSummary: protectedProcedure
      .input(z.object({
        period: z.enum(['today', 'yesterday', 'week', 'month', 'quarter', 'ytd', 'custom']).default('month'),
      }))
      .query(async ({ ctx, input }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) throw new Error('Recruiter profile not found');
        return await recruiterReportsHelpers.getRecruiterDashboardSummary(recruiter.id, input.period);
      }),

    // Submissions report
    getSubmissionsReport: protectedProcedure
      .input(z.object({
        period: z.enum(['today', 'yesterday', 'week', 'month', 'quarter', 'ytd', 'custom']).default('month'),
        customStart: z.string().optional(),
        customEnd: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) throw new Error('Recruiter profile not found');
        return await recruiterReportsHelpers.getSubmissionsReport(recruiter.id, input.period, input.customStart, input.customEnd);
      }),

    // Placements report
    getPlacementsReport: protectedProcedure
      .input(z.object({
        period: z.enum(['today', 'yesterday', 'week', 'month', 'quarter', 'ytd', 'custom']).default('month'),
        customStart: z.string().optional(),
        customEnd: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) throw new Error('Recruiter profile not found');
        return await recruiterReportsHelpers.getPlacementsReport(recruiter.id, input.period, input.customStart, input.customEnd);
      }),

    // Pipeline report
    getPipelineReport: protectedProcedure
      .input(z.object({
        period: z.enum(['today', 'yesterday', 'week', 'month', 'quarter', 'ytd', 'custom']).default('month'),
        customStart: z.string().optional(),
        customEnd: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) throw new Error('Recruiter profile not found');
        return await recruiterReportsHelpers.getPipelineReport(recruiter.id, input.period, input.customStart, input.customEnd);
      }),

    // Time-to-hire report
    getTimeToHireReport: protectedProcedure
      .input(z.object({
        period: z.enum(['today', 'yesterday', 'week', 'month', 'quarter', 'ytd', 'custom']).default('month'),
        customStart: z.string().optional(),
        customEnd: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) throw new Error('Recruiter profile not found');
        return await recruiterReportsHelpers.getTimeToHireReport(recruiter.id, input.period, input.customStart, input.customEnd);
      }),

    // Job performance report
    getJobPerformanceReport: protectedProcedure
      .input(z.object({
        period: z.enum(['today', 'yesterday', 'week', 'month', 'quarter', 'ytd', 'custom']).default('month'),
        customStart: z.string().optional(),
        customEnd: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) throw new Error('Recruiter profile not found');
        return await recruiterReportsHelpers.getJobPerformanceReport(recruiter.id, input.period, input.customStart, input.customEnd);
      }),
  }),

  // Skills Testing Platform
  skillsTesting: router({
    // Test library management
    createTest: protectedProcedure
      .input(z.object({
        testName: z.string(),
        testType: z.enum(['coding', 'personality', 'domain-specific', 'aptitude', 'technical']),
        category: z.string().optional(),
        description: z.string().optional(),
        duration: z.number(),
        passingScore: z.number(),
        difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
        isPublic: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) throw new Error('Recruiter profile not found');

        const database = await getDb();
        if (!database) throw new Error('Database not available');
        const { testLibrary } = await import('../drizzle/schema');
        const [newTest] = await database.insert(testLibrary).values({
          recruiterId: recruiter.id,
          ...input,
        }).$returningId();

        return { testId: newTest.id };
      }),

    getMyTests: protectedProcedure
      .query(async ({ ctx }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) return [];

        const database = await getDb();
        if (!database) return [];
        const { testLibrary } = await import('../drizzle/schema');
        const { eq, desc } = await import('drizzle-orm');
        
        return await database
          .select()
          .from(testLibrary)
          .where(eq(testLibrary.recruiterId, recruiter.id))
          .orderBy(desc(testLibrary.createdAt));
      }),

    // Assign test to candidate
    assignTest: protectedProcedure
      .input(z.object({
        testId: z.number(),
        candidateId: z.number(),
        applicationId: z.number().optional(),
        dueDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) throw new Error('Recruiter profile not found');

        const database = await getDb();
        if (!database) throw new Error('Database not available');
        const { testAssignments } = await import('../drizzle/schema');
        const [assignment] = await database.insert(testAssignments).values({
          testId: input.testId,
          candidateId: input.candidateId,
          applicationId: input.applicationId,
          assignedBy: recruiter.id,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          status: 'assigned',
        }).$returningId();

        return { assignmentId: assignment.id };
      }),

    // Get assigned tests for candidate
    getMyAssignedTests: protectedProcedure
      .query(async ({ ctx }) => {
        const candidate = await db.getCandidateByUserId(ctx.user.id);
        if (!candidate) return [];

        const database = await getDb();
        if (!database) return [];
        const { testAssignments, testLibrary } = await import('../drizzle/schema');
        const { eq, desc } = await import('drizzle-orm');
        
        return await database
          .select({
            assignment: testAssignments,
            test: testLibrary,
          })
          .from(testAssignments)
          .innerJoin(testLibrary, eq(testAssignments.testId, testLibrary.id))
          .where(eq(testAssignments.candidateId, candidate.id))
          .orderBy(desc(testAssignments.createdAt));
      }),
  }),

  // Messaging System
  messaging: router({
    // Get conversations for current user
    getMyConversations: protectedProcedure
      .query(async ({ ctx }) => {
        const database = await getDb();
        if (!database) return [];
        const { conversations, users, recruiters, candidates } = await import('../drizzle/schema');
        const { eq, or, desc } = await import('drizzle-orm');

        // Check if user is recruiter or candidate
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        const candidate = await db.getCandidateByUserId(ctx.user.id);

        if (recruiter) {
          return await database
            .select({
              conversation: conversations,
              candidate: candidates,
              candidateUser: users,
            })
            .from(conversations)
            .innerJoin(candidates, eq(conversations.candidateId, candidates.id))
            .innerJoin(users, eq(candidates.userId, users.id))
            .where(eq(conversations.recruiterId, recruiter.id))
            .orderBy(desc(conversations.lastMessageAt));
        } else if (candidate) {
          return await database
            .select({
              conversation: conversations,
              recruiter: recruiters,
              recruiterUser: users,
            })
            .from(conversations)
            .innerJoin(recruiters, eq(conversations.recruiterId, recruiters.id))
            .innerJoin(users, eq(recruiters.userId, users.id))
            .where(eq(conversations.candidateId, candidate.id))
            .orderBy(desc(conversations.lastMessageAt));
        }

        return [];
      }),

    // Get messages in a conversation
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];
        const { messages, messageAttachments } = await import('../drizzle/schema');
        const { eq, desc } = await import('drizzle-orm');
        
        const msgs = await database
          .select()
          .from(messages)
          .where(eq(messages.conversationId, input.conversationId))
          .orderBy(desc(messages.createdAt));

        // Get attachments for each message
        const messagesWithAttachments = await Promise.all(
          msgs.map(async (msg: any) => {
            const attachments = await database
              .select()
              .from(messageAttachments)
              .where(eq(messageAttachments.messageId, msg.id));
            return { ...msg, attachments };
          })
        );

        return messagesWithAttachments;
      }),

    // Send a message
    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number().optional(),
        recipientId: z.number().optional(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new Error('Database not available');
        const { messages, conversations } = await import('../drizzle/schema');
        const { sendMessage: sendMsg, getOrCreateConversation } = await import('./messaging');

        // Determine sender type
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        const candidate = await db.getCandidateByUserId(ctx.user.id);
        
        if (!recruiter && !candidate) {
          throw new Error('User must be recruiter or candidate');
        }

        let conversationId = input.conversationId;

        // Create conversation if needed
        if (!conversationId && input.recipientId) {
          if (recruiter) {
            conversationId = await getOrCreateConversation({
              recruiterId: recruiter.id,
              candidateId: input.recipientId,
            });
          } else if (candidate) {
            conversationId = await getOrCreateConversation({
              recruiterId: input.recipientId,
              candidateId: candidate.id,
            });
          }
        }

        if (!conversationId) {
          throw new Error('Conversation ID required');
        }

        const messageId = await sendMsg({
          conversationId,
          senderId: ctx.user.id,
          senderType: recruiter ? 'recruiter' : 'candidate',
          content: input.content,
        });

        return { messageId };
      }),

    // Get message templates
    getMyTemplates: protectedProcedure
      .query(async ({ ctx }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) return [];

        const database = await getDb();
        if (!database) return [];
        const { messageTemplates } = await import('../drizzle/schema');
        const { eq, desc } = await import('drizzle-orm');
        
        const templates = await database
          .select()
          .from(messageTemplates)
          .where(eq(messageTemplates.recruiterId, recruiter.id))
          .orderBy(desc(messageTemplates.usageCount));
        
        return templates;
      }),

    // Create message template
    createTemplate: protectedProcedure
      .input(z.object({
        templateName: z.string(),
        subject: z.string().optional(),
        content: z.string(),
        category: z.string().optional(),
        isPublic: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const recruiter = await db.getRecruiterByUserId(ctx.user.id);
        if (!recruiter) throw new Error('Recruiter profile not found');

        const { createMessageTemplate } = await import('./messaging');
        const templateId = await createMessageTemplate({
          recruiterId: recruiter.id,
          ...input,
        });

        return { templateId };
      }),
  }),
});



export type AppRouter = typeof appRouter;
