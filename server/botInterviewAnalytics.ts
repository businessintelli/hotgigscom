import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

/**
 * Bot Interview Analytics Router
 * Provides analytics and metrics for bot interview performance
 */
export const botInterviewAnalyticsRouter = router({
  getAnalytics: protectedProcedure
    .input(z.object({
      dateRange: z.number().default(30), // days
      jobId: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const recruiterId = ctx.user.id;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.dateRange);

      // Get all bot interview sessions within date range
      const sessions = await db.getBotInterviewSessionsByDateRange(
        startDate.toISOString(),
        endDate.toISOString(),
        input.jobId
      );

      if (!sessions || sessions.length === 0) {
        return null;
      }

      // Calculate metrics
      const totalInterviews = sessions.length;
      const completedInterviews = sessions.filter(s => s.sessionStatus === 'completed').length;
      const inProgressInterviews = sessions.filter(s => s.sessionStatus === 'in-progress').length;
      const notStartedInterviews = sessions.filter(s => s.sessionStatus === 'not-started').length;
      const completionRate = totalInterviews > 0 ? Math.round((completedInterviews / totalInterviews) * 100) : 0;

      // Get all analyses for completed interviews
      const analyses = await Promise.all(
        sessions
          .filter(s => s.sessionStatus === 'completed')
          .map(s => db.getInterviewAnalysisBySessionId(s.id))
      );

      const validAnalyses = analyses.filter(a => a !== null);

      // Calculate average scores
      const avgOverallScore = validAnalyses.length > 0
        ? validAnalyses.reduce((sum, a) => sum + (a!.overallScore || 0), 0) / validAnalyses.length
        : null;

      const avgTechnicalScore = validAnalyses.length > 0
        ? validAnalyses.reduce((sum, a) => sum + (a!.technicalScore || 0), 0) / validAnalyses.length
        : null;

      const avgBehavioralScore = validAnalyses.length > 0
        ? validAnalyses.reduce((sum, a) => sum + (a!.behavioralScore || 0), 0) / validAnalyses.length
        : null;

      const avgCommunicationScore = validAnalyses.length > 0
        ? validAnalyses.reduce((sum, a) => sum + (a!.communicationScore || 0), 0) / validAnalyses.length
        : null;

      const avgProblemSolvingScore = validAnalyses.length > 0
        ? validAnalyses.reduce((sum, a) => sum + (a!.problemSolvingScore || 0), 0) / validAnalyses.length
        : null;

      // Calculate average time to complete (in minutes)
      const completedSessions = sessions.filter(s => s.completedAt && s.startedAt);
      const avgTimeToComplete = completedSessions.length > 0
        ? Math.round(
            completedSessions.reduce((sum, s) => {
              const duration = new Date(s.completedAt!).getTime() - new Date(s.startedAt!).getTime();
              return sum + duration / (1000 * 60); // Convert to minutes
            }, 0) / completedSessions.length
          )
        : 0;

      // Count hiring recommendations
      const recommendations = {
        strongYes: validAnalyses.filter(a => a!.hiringRecommendation === 'strong-yes').length,
        yes: validAnalyses.filter(a => a!.hiringRecommendation === 'yes').length,
        maybe: validAnalyses.filter(a => a!.hiringRecommendation === 'maybe').length,
        no: validAnalyses.filter(a => a!.hiringRecommendation === 'no').length,
        strongNo: validAnalyses.filter(a => a!.hiringRecommendation === 'strong-no').length,
      };

      // Get top performing jobs
      const jobScores = new Map<number, { total: number; count: number; title: string }>();
      
      for (const analysis of validAnalyses) {
        if (analysis && analysis.jobId) {
          const existing = jobScores.get(analysis.jobId) || { total: 0, count: 0, title: '' };
          existing.total += analysis.overallScore || 0;
          existing.count += 1;
          
          if (!existing.title) {
            const job = await db.getJobById(analysis.jobId);
            existing.title = job?.title || 'Unknown Job';
          }
          
          jobScores.set(analysis.jobId, existing);
        }
      }

      const topPerformingJobs = Array.from(jobScores.entries())
        .map(([jobId, data]) => ({
          jobId,
          jobTitle: data.title,
          avgScore: data.total / data.count,
          interviewCount: data.count,
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5);

      return {
        totalInterviews,
        completedInterviews,
        inProgressInterviews,
        notStartedInterviews,
        completionRate,
        avgOverallScore,
        avgTechnicalScore,
        avgBehavioralScore,
        avgCommunicationScore,
        avgProblemSolvingScore,
        avgTimeToComplete,
        recommendations,
        topPerformingJobs,
      };
    }),
});
