import { db } from "../_core/db";
import { matchOutcomes, algorithmPerformance, applications } from "../../drizzle/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

/**
 * Outcome Tracking Service
 * 
 * Tracks hiring outcomes for AI-matched candidates and uses this data
 * to improve matching algorithm accuracy over time.
 */

export interface MatchOutcomeData {
  applicationId: number;
  candidateId: number;
  jobId: number;
  recruiterId: number;
  initialMatchScore: number;
  skillsScore?: number;
  experienceScore?: number;
  locationScore?: number;
  salaryScore?: number;
  culturalFitScore?: number;
  outcome: "hired" | "rejected" | "withdrawn" | "no_response" | "in_progress";
  outcomeDate?: Date;
  recruiterFeedback?: string;
  recruiterRating?: number;
}

/**
 * Record a match outcome when an application reaches a final state
 */
export async function recordMatchOutcome(data: MatchOutcomeData) {
  try {
    await db.insert(matchOutcomes).values({
      applicationId: data.applicationId,
      candidateId: data.candidateId,
      jobId: data.jobId,
      recruiterId: data.recruiterId,
      initialMatchScore: data.initialMatchScore.toString(),
      skillsScore: data.skillsScore?.toString(),
      experienceScore: data.experienceScore?.toString(),
      locationScore: data.locationScore?.toString(),
      salaryScore: data.salaryScore?.toString(),
      culturalFitScore: data.culturalFitScore?.toString(),
      outcome: data.outcome,
      outcomeDate: data.outcomeDate || new Date(),
      recruiterFeedback: data.recruiterFeedback,
      recruiterRating: data.recruiterRating
    });

    console.log(`Recorded match outcome for application ${data.applicationId}: ${data.outcome}`);
    return true;
  } catch (error) {
    console.error("Error recording match outcome:", error);
    return false;
  }
}

/**
 * Update outcome with performance data (for hired candidates)
 */
export async function updateHirePerformance(
  applicationId: number,
  performanceRating: number,
  retentionMonths: number
) {
  try {
    await db
      .update(matchOutcomes)
      .set({
        performanceRating: performanceRating.toString(),
        retentionMonths
      })
      .where(eq(matchOutcomes.applicationId, applicationId));

    console.log(`Updated hire performance for application ${applicationId}`);
    return true;
  } catch (error) {
    console.error("Error updating hire performance:", error);
    return false;
  }
}

/**
 * Calculate algorithm performance metrics
 */
export async function calculateAlgorithmMetrics(
  startDate: Date,
  endDate: Date,
  algorithmVersion: string = "v1.0"
) {
  try {
    // Get all outcomes in the date range
    const outcomes = await db
      .select()
      .from(matchOutcomes)
      .where(
        and(
          gte(matchOutcomes.outcomeDate, startDate),
          lte(matchOutcomes.outcomeDate, endDate)
        )
      );

    if (outcomes.length === 0) {
      return {
        precision: 0,
        recall: 0,
        f1Score: 0,
        accuracy: 0,
        sampleSize: 0
      };
    }

    // Calculate metrics
    const totalOutcomes = outcomes.length;
    const hiredCandidates = outcomes.filter(o => o.outcome === "hired");
    const rejectedCandidates = outcomes.filter(o => o.outcome === "rejected");
    
    // High match score threshold (>= 70)
    const highMatchScoreThreshold = 70;
    const predictedPositives = outcomes.filter(o => parseFloat(o.initialMatchScore) >= highMatchScoreThreshold);
    const truePositives = predictedPositives.filter(o => o.outcome === "hired");
    const falsePositives = predictedPositives.filter(o => o.outcome === "rejected");
    const falseNegatives = outcomes.filter(o => 
      parseFloat(o.initialMatchScore) < highMatchScoreThreshold && o.outcome === "hired"
    );

    // Precision: Of all candidates we predicted would be good, how many were actually hired?
    const precision = predictedPositives.length > 0 
      ? truePositives.length / predictedPositives.length 
      : 0;

    // Recall: Of all candidates who were hired, how many did we predict correctly?
    const recall = hiredCandidates.length > 0 
      ? truePositives.length / hiredCandidates.length 
      : 0;

    // F1 Score: Harmonic mean of precision and recall
    const f1Score = (precision + recall) > 0 
      ? 2 * (precision * recall) / (precision + recall) 
      : 0;

    // Accuracy: Overall correct predictions
    const correctPredictions = truePositives.length + 
      outcomes.filter(o => parseFloat(o.initialMatchScore) < highMatchScoreThreshold && o.outcome === "rejected").length;
    const accuracy = totalOutcomes > 0 ? correctPredictions / totalOutcomes : 0;

    // Save metrics to database
    await db.insert(algorithmPerformance).values([
      {
        algorithmVersion,
        metricName: "precision",
        metricValue: precision.toString(),
        sampleSize: totalOutcomes,
        periodStart: startDate,
        periodEnd: endDate
      },
      {
        algorithmVersion,
        metricName: "recall",
        metricValue: recall.toString(),
        sampleSize: totalOutcomes,
        periodStart: startDate,
        periodEnd: endDate
      },
      {
        algorithmVersion,
        metricName: "f1_score",
        metricValue: f1Score.toString(),
        sampleSize: totalOutcomes,
        periodStart: startDate,
        periodEnd: endDate
      },
      {
        algorithmVersion,
        metricName: "accuracy",
        metricValue: accuracy.toString(),
        sampleSize: totalOutcomes,
        periodStart: startDate,
        periodEnd: endDate
      }
    ]);

    return {
      precision,
      recall,
      f1Score,
      accuracy,
      sampleSize: totalOutcomes
    };
  } catch (error) {
    console.error("Error calculating algorithm metrics:", error);
    return {
      precision: 0,
      recall: 0,
      f1Score: 0,
      accuracy: 0,
      sampleSize: 0
    };
  }
}

/**
 * Get algorithm performance trends over time
 */
export async function getPerformanceTrends(
  algorithmVersion: string,
  metricName: string,
  limit: number = 12
) {
  return await db
    .select()
    .from(algorithmPerformance)
    .where(
      and(
        eq(algorithmPerformance.algorithmVersion, algorithmVersion),
        eq(algorithmPerformance.metricName, metricName)
      )
    )
    .orderBy(desc(algorithmPerformance.periodEnd))
    .limit(limit);
}

/**
 * Analyze which score components are most predictive of hiring
 */
export async function analyzeScoreComponents(startDate: Date, endDate: Date) {
  try {
    const outcomes = await db
      .select()
      .from(matchOutcomes)
      .where(
        and(
          gte(matchOutcomes.outcomeDate, startDate),
          lte(matchOutcomes.outcomeDate, endDate)
        )
      );

    const hiredCandidates = outcomes.filter(o => o.outcome === "hired");
    const rejectedCandidates = outcomes.filter(o => o.outcome === "rejected");

    // Calculate average scores for each component
    const avgHiredScores = {
      skills: hiredCandidates.reduce((sum: any, o: any) => sum + (parseFloat(o.skillsScore || "0")), 0) / hiredCandidates.length,
      experience: hiredCandidates.reduce((sum: any, o: any) => sum + (parseFloat(o.experienceScore || "0")), 0) / hiredCandidates.length,
      location: hiredCandidates.reduce((sum: any, o: any) => sum + (parseFloat(o.locationScore || "0")), 0) / hiredCandidates.length,
      salary: hiredCandidates.reduce((sum: any, o: any) => sum + (parseFloat(o.salaryScore || "0")), 0) / hiredCandidates.length,
      culturalFit: hiredCandidates.reduce((sum: any, o: any) => sum + (parseFloat(o.culturalFitScore || "0")), 0) / hiredCandidates.length
    };

    const avgRejectedScores = {
      skills: rejectedCandidates.reduce((sum: any, o: any) => sum + (parseFloat(o.skillsScore || "0")), 0) / rejectedCandidates.length,
      experience: rejectedCandidates.reduce((sum: any, o: any) => sum + (parseFloat(o.experienceScore || "0")), 0) / rejectedCandidates.length,
      location: rejectedCandidates.reduce((sum: any, o: any) => sum + (parseFloat(o.locationScore || "0")), 0) / rejectedCandidates.length,
      salary: rejectedCandidates.reduce((sum: any, o: any) => sum + (parseFloat(o.salaryScore || "0")), 0) / rejectedCandidates.length,
      culturalFit: rejectedCandidates.reduce((sum: any, o: any) => sum + (parseFloat(o.culturalFitScore || "0")), 0) / rejectedCandidates.length
    };

    // Calculate predictive power (difference between hired and rejected)
    const predictivePower = {
      skills: Math.abs(avgHiredScores.skills - avgRejectedScores.skills),
      experience: Math.abs(avgHiredScores.experience - avgRejectedScores.experience),
      location: Math.abs(avgHiredScores.location - avgRejectedScores.location),
      salary: Math.abs(avgHiredScores.salary - avgRejectedScores.salary),
      culturalFit: Math.abs(avgHiredScores.culturalFit - avgRejectedScores.culturalFit)
    };

    return {
      avgHiredScores,
      avgRejectedScores,
      predictivePower,
      sampleSize: outcomes.length,
      hiredCount: hiredCandidates.length,
      rejectedCount: rejectedCandidates.length
    };
  } catch (error) {
    console.error("Error analyzing score components:", error);
    return null;
  }
}

/**
 * Get suggested weight adjustments based on outcome data
 */
export async function getSuggestedWeightAdjustments(startDate: Date, endDate: Date) {
  const analysis = await analyzeScoreComponents(startDate, endDate);
  
  if (!analysis) {
    return null;
  }

  // Current weights
  const currentWeights = {
    skills: 0.35,
    experience: 0.25,
    location: 0.15,
    salary: 0.10,
    culturalFit: 0.15
  };

  // Calculate suggested weights based on predictive power
  const totalPredictivePower = Object.values(analysis.predictivePower).reduce((sum: any, val: any) => sum + val, 0);
  
  const suggestedWeights = {
    skills: (analysis.predictivePower.skills / totalPredictivePower) || currentWeights.skills,
    experience: (analysis.predictivePower.experience / totalPredictivePower) || currentWeights.experience,
    location: (analysis.predictivePower.location / totalPredictivePower) || currentWeights.location,
    salary: (analysis.predictivePower.salary / totalPredictivePower) || currentWeights.salary,
    culturalFit: (analysis.predictivePower.culturalFit / totalPredictivePower) || currentWeights.culturalFit
  };

  return {
    currentWeights,
    suggestedWeights,
    analysis,
    recommendation: generateWeightRecommendation(currentWeights, suggestedWeights, analysis)
  };
}

function generateWeightRecommendation(
  current: any,
  suggested: any,
  analysis: any
): string {
  const changes = [];
  
  for (const key of Object.keys(current)) {
    const diff = suggested[key] - current[key];
    if (Math.abs(diff) > 0.05) { // Only recommend changes > 5%
      const direction = diff > 0 ? "increase" : "decrease";
      changes.push(`${direction} ${key} weight from ${(current[key] * 100).toFixed(0)}% to ${(suggested[key] * 100).toFixed(0)}%`);
    }
  }

  if (changes.length === 0) {
    return "Current weights are well-calibrated based on hiring outcomes. No adjustments recommended.";
  }

  return `Based on ${analysis.sampleSize} outcomes (${analysis.hiredCount} hired, ${analysis.rejectedCount} rejected), consider these adjustments:\n` +
    changes.map(c => `- ${c}`).join("\n");
}

/**
 * Get match outcomes for a specific job
 */
export async function getJobMatchOutcomes(jobId: number) {
  return await db
    .select()
    .from(matchOutcomes)
    .where(eq(matchOutcomes.jobId, jobId))
    .orderBy(desc(matchOutcomes.createdAt));
}

/**
 * Get match outcomes for a specific candidate
 */
export async function getCandidateMatchOutcomes(candidateId: number) {
  return await db
    .select()
    .from(matchOutcomes)
    .where(eq(matchOutcomes.candidateId, candidateId))
    .orderBy(desc(matchOutcomes.createdAt));
}
