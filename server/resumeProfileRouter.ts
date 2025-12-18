import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";
import { extractResumeText, parseResumeWithAI } from "./resumeParser";
import { calculateResumeScores, calculateTopDomains, calculateTopSkills } from "./resumeRanking";

// Helper to generate random suffix for file keys
function randomSuffix() {
  return Math.random().toString(36).substring(2, 15);
}

export const resumeProfileRouter = router({
  // Resume Profile Management
  getResumeProfiles: protectedProcedure
    .input(z.object({ candidateId: z.number() }))
    .query(async ({ input }) => {
      return await db.getResumeProfilesByCandidateId(input.candidateId);
    }),
  
  getResumeProfileById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getResumeProfileById(input.id);
    }),
  
  getVideoIntroductionById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getVideoIntroductionById(input.id);
    }),
  
  createResumeProfile: protectedProcedure
    .input(z.object({
      candidateId: z.number(),
      profileName: z.string(),
      fileData: z.string(), // base64 encoded file
      fileName: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { candidateId, profileName, fileData, fileName } = input;
      
      // Check if candidate already has 5 profiles
      const count = await db.countResumeProfiles(candidateId);
      if (count >= 5) {
        throw new Error('Maximum 5 resume profiles allowed per candidate');
      }
      
      // Extract base64 data and mime type
      const matches = fileData.match(/^data:(.+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid file data format');
      }
      
      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Upload to S3
      const fileKey = `resume-profiles/${candidateId}/${profileName}-${randomSuffix()}-${fileName}`;
      const { url } = await storagePut(fileKey, buffer, mimeType);
      
      // Parse resume with AI
      let parsedData = null;
      let scores = null;
      try {
        const resumeText = await extractResumeText(buffer, mimeType);
        parsedData = await parseResumeWithAI(resumeText);
        
        // Calculate ranking scores and top domains/skills
        if (parsedData) {
          scores = calculateResumeScores(parsedData);
          scores.topDomains = calculateTopDomains(parsedData);
          scores.topSkills = calculateTopSkills(parsedData);
        }
      } catch (error) {
        console.error('Resume parsing failed:', error);
      }
      
      // Check if this is the first profile (make it default)
      const isDefault = count === 0;
      
      // Create resume profile with scores
      await db.createResumeProfile({
        candidateId,
        profileName,
        resumeUrl: url,
        resumeFileKey: fileKey,
        resumeFilename: fileName,
        parsedData: parsedData ? JSON.stringify(parsedData) : null,
        domainMatchScore: scores?.domainMatchScore || 0,
        skillMatchScore: scores?.skillMatchScore || 0,
        experienceScore: scores?.experienceScore || 0,
        overallScore: scores?.overallScore || 0,
        primaryDomain: scores?.primaryDomain || null,
        totalExperienceYears: scores?.totalExperienceYears || 0,
        topDomains: scores?.topDomains ? JSON.stringify(scores.topDomains) : null,
        topSkills: scores?.topSkills ? JSON.stringify(scores.topSkills) : null,
        isDefault,
        uploadedAt: new Date(),
      });
      
      return { success: true, url, parsedData };
    }),
  
  updateResumeProfile: protectedProcedure
    .input(z.object({
      id: z.number(),
      profileName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateResumeProfile(id, data);
      return { success: true };
    }),
  
  updateResumeProfileData: protectedProcedure
    .input(z.object({
      id: z.number(),
      parsedData: z.string(), // JSON string of ParsedResume
    }))
    .mutation(async ({ input }) => {
      const { id, parsedData } = input;
      
      // Recalculate scores based on updated data
      let scores = null;
      try {
        const parsed = JSON.parse(parsedData);
        scores = calculateResumeScores(parsed);
      } catch (error) {
        console.error('Failed to parse resume data:', error);
      }
      
      // Update resume profile with new data and scores
      await db.updateResumeProfile(id, {
        parsedData,
        domainMatchScore: scores?.domainMatchScore,
        skillMatchScore: scores?.skillMatchScore,
        experienceScore: scores?.experienceScore,
        overallScore: scores?.overallScore,
        primaryDomain: scores?.primaryDomain,
        totalExperienceYears: scores?.totalExperienceYears,
        topDomains: scores?.topDomains ? JSON.stringify(scores.topDomains) : null,
        topSkills: scores?.topSkills ? JSON.stringify(scores.topSkills) : null,
      });
      
      return { success: true };
    }),
  
  deleteResumeProfile: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteResumeProfile(input.id);
      return { success: true };
    }),
  
  setDefaultResumeProfile: protectedProcedure
    .input(z.object({ candidateId: z.number(), profileId: z.number() }))
    .mutation(async ({ input }) => {
      await db.setDefaultResumeProfile(input.candidateId, input.profileId);
      return { success: true };
    }),
  
  // Video Introduction Management
  getVideoIntroduction: protectedProcedure
    .input(z.object({ candidateId: z.number() }))
    .query(async ({ input }) => {
      return await db.getVideoIntroductionByCandidate(input.candidateId);
    }),
  
  uploadVideoIntroduction: protectedProcedure
    .input(z.object({
      candidateId: z.number(),
      videoData: z.string(), // base64 encoded video
      duration: z.number(), // in seconds
      mimeType: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { candidateId, videoData, duration, mimeType } = input;
      
      // Validate duration (max 15 minutes = 900 seconds)
      if (duration > 900) {
        throw new Error('Video duration cannot exceed 15 minutes');
      }
      
      // Extract base64 data
      const matches = videoData.match(/^data:(.+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid video data format');
      }
      
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const fileSize = buffer.length;
      
      // Upload to S3
      const fileKey = `video-introductions/${candidateId}/intro-${randomSuffix()}.${mimeType.split('/')[1]}`;
      const { url } = await storagePut(fileKey, buffer, mimeType);
      
      // Delete existing video introduction if any
      const existing = await db.getVideoIntroductionByCandidate(candidateId);
      if (existing) {
        await db.deleteVideoIntroduction(existing.id);
      }
      
      // Create new video introduction
      await db.createVideoIntroduction({
        candidateId,
        videoUrl: url,
        videoFileKey: fileKey,
        duration,
        fileSize,
        mimeType,
      });
      
      return { success: true, url };
    }),
  
  deleteVideoIntroduction: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteVideoIntroduction(input.id);
      return { success: true };
    }),
});
