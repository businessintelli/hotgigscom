import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";

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
      }))
      .mutation(async ({ input }) => {
        const { candidateId, fileData, fileName } = input;
        
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
        
        // Update candidate profile
        await db.updateCandidate(candidateId, {
          resumeUrl: url,
          resumeFilename: fileName,
          resumeUploadedAt: new Date(),
        });
        
        return { success: true, url };
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
  }),
});

export type AppRouter = typeof appRouter;
