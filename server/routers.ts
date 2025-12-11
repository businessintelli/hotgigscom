import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { parseResume, calculateMatchScore, generateInterviewQuestions, analyzeResume } from "./aiHelpers";
import { transcribeAudio } from "./_core/voiceTranscription";
import { z } from "zod";
import * as db from "./db";

import { storagePut } from "./storage";
import { extractResumeText, parseResumeWithAI } from "./resumeParser";

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
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["submitted", "reviewing", "shortlisted", "interviewing", "offered", "rejected", "withdrawn"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateApplication(id, data);
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
        
        await db.createInterview({
          ...input,
          recruiterId: recruiter.id,
          scheduledAt: new Date(input.scheduledAt),
        });
        
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
  }),
});

export type AppRouter = typeof appRouter;
