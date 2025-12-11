import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
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
import { codingChallenges, codingSubmissions, candidates } from "../drizzle/schema";

import { storagePut } from "./storage";
import { extractResumeText, parseResumeWithAI } from "./resumeParser";
import { sendInterviewInvitation, sendApplicationStatusUpdate } from "./emailNotifications";

// Helper to generate random suffix for file keys
function randomSuffix() {
  return Math.random().toString(36).substring(2, 15);
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
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
            
            // Parse with AI
            parsedData = await parseResumeWithAI(resumeText);
            
            // Update candidate profile with parsed data
            await db.updateCandidate(candidateId, {
              resumeUrl: url,
              resumeFilename: fileName,
              resumeUploadedAt: new Date(),
              ...(parsedData.title && { title: parsedData.title }),
              ...(parsedData.phone && { phoneNumber: parsedData.phone }),
              ...(parsedData.location && { location: parsedData.location }),
              ...(parsedData.summary && { bio: parsedData.summary }),
              ...(parsedData.skills && { skills: parsedData.skills }),
              ...(parsedData.experience && { experience: parsedData.experience }),
              ...(parsedData.education && { education: parsedData.education }),
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
      }))
      .mutation(async ({ input }) => {
        await db.createApplication(input);
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
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateApplication(id, data);
        
        // Send email notification to candidate
        try {
          const applications = await db.getApplicationsByJob(0); // Get application details
          const application = applications.find(app => app.id === id);
          if (application) {
            const candidate = await db.getCandidateById(application.candidateId);
            const job = await db.getJobById(application.jobId);
            if (candidate && job) {
              const user = await db.getUserById(candidate.userId);
              if (user?.email) {
                await sendApplicationStatusUpdate({
                  candidateEmail: user.email,
                  candidateName: user.name || "Candidate",
                  jobTitle: job.title,
                  status: input.status,
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
        
        const interview = await db.createInterview({
          ...input,
          recruiterId: recruiter.id,
          scheduledAt: new Date(input.scheduledAt),
        });
        
        // Send email notification to candidate
        try {
          const candidate = await db.getCandidateById(input.candidateId);
          const job = await db.getJobById(input.jobId);
          if (candidate && job) {
            const user = await db.getUserById(candidate.userId);
            if (user?.email) {
              await sendInterviewInvitation({
                candidateEmail: user.email,
                candidateName: user.name || "Candidate",
                jobTitle: job.title,
                interviewDate: new Date(input.scheduledAt),
                interviewType: input.type || "AI Interview",
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
    
    // Get interview by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getInterviewById(input.id);
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
                const job = await db.getJobById(interview.jobId);
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
        
        const job = await db.getJobById(interview.jobId);
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
        const candidate = await db.getCandidateById(interview.candidateId);
        const job = await db.getJobById(interview.jobId);
        
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
      .query(async ({ input }) => {
        const html = await generateFraudDetectionReport(input.interviewId);
        return { html };
      }),
    
    // Report Generation - Interview evaluation report
    generateEvaluationReport: protectedProcedure
      .input(z.object({ interviewId: z.number() }))
      .query(async ({ input }) => {
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
  }),
});



export type AppRouter = typeof appRouter;
