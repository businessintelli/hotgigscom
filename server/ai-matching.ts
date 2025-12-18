/**
 * AI-Powered Job Matching & Candidate Screening Service
 * 
 * This module implements ML-based matching algorithms that score candidates
 * against job requirements considering skills, experience, location, salary,
 * and cultural fit.
 */

import { invokeLLM } from "./_core/llm";
import type { Candidate, Job, Application } from "../drizzle/schema";

// =============================================================================
// Types
// =============================================================================

export interface MatchScore {
  overallScore: number; // 0-100
  skillsScore: number; // 0-100
  experienceScore: number; // 0-100
  locationScore: number; // 0-100
  salaryScore: number; // 0-100
  culturalFitScore: number; // 0-100
  breakdown: {
    matchedSkills: string[];
    missingSkills: string[];
    experienceMatch: string;
    locationMatch: string;
    salaryMatch: string;
    strengths: string[];
    concerns: string[];
  };
  recommendation: "strong_match" | "good_match" | "moderate_match" | "weak_match";
  reasoning: string;
}

export interface CandidateRanking {
  candidateId: number;
  applicationId: number;
  matchScore: MatchScore;
  rank: number;
  isTopProspect: boolean;
}

// =============================================================================
// Smart Job Matching Algorithm
// =============================================================================

/**
 * Calculate comprehensive match score between a candidate and a job
 */
export async function calculateJobMatch(
  candidate: Candidate,
  job: Job
): Promise<MatchScore> {
  // Parse candidate skills
  const candidateSkills = candidate.skills ? JSON.parse(candidate.skills) : [];
  
  // Extract job requirements using AI
  const jobRequirements = await extractJobRequirements(job);
  
  // Calculate individual scores
  const skillsScore = calculateSkillsMatch(candidateSkills, jobRequirements.requiredSkills, jobRequirements.preferredSkills);
  const experienceScore = calculateExperienceMatch(candidate, job, jobRequirements);
  const locationScore = calculateLocationMatch(candidate.location, job.location, candidate.willingToRelocate);
  const salaryScore = calculateSalaryMatch(
    candidate.expectedSalaryMin,
    candidate.expectedSalaryMax,
    job.salaryMin,
    job.salaryMax
  );
  
  // Use AI for cultural fit and overall assessment
  const aiAssessment = await getAIMatchAssessment(candidate, job, {
    skillsScore,
    experienceScore,
    locationScore,
    salaryScore,
  });
  
  // Calculate weighted overall score
  const overallScore = Math.round(
    skillsScore * 0.35 +
    experienceScore * 0.25 +
    locationScore * 0.15 +
    salaryScore * 0.10 +
    aiAssessment.culturalFitScore * 0.15
  );
  
  // Determine recommendation level
  let recommendation: MatchScore["recommendation"];
  if (overallScore >= 85) recommendation = "strong_match";
  else if (overallScore >= 70) recommendation = "good_match";
  else if (overallScore >= 50) recommendation = "moderate_match";
  else recommendation = "weak_match";
  
  return {
    overallScore,
    skillsScore,
    experienceScore,
    locationScore,
    salaryScore,
    culturalFitScore: aiAssessment.culturalFitScore,
    breakdown: {
      matchedSkills: aiAssessment.matchedSkills,
      missingSkills: aiAssessment.missingSkills,
      experienceMatch: aiAssessment.experienceMatch,
      locationMatch: getLocationMatchDescription(locationScore),
      salaryMatch: getSalaryMatchDescription(salaryScore),
      strengths: aiAssessment.strengths,
      concerns: aiAssessment.concerns,
    },
    recommendation,
    reasoning: aiAssessment.reasoning,
  };
}

// =============================================================================
// Individual Scoring Functions
// =============================================================================

/**
 * Calculate skills match score
 */
function calculateSkillsMatch(
  candidateSkills: string[],
  requiredSkills: string[],
  preferredSkills: string[]
): number {
  if (requiredSkills.length === 0) return 100;
  
  const normalizedCandidateSkills = candidateSkills.map(s => s.toLowerCase().trim());
  const normalizedRequired = requiredSkills.map(s => s.toLowerCase().trim());
  const normalizedPreferred = preferredSkills.map(s => s.toLowerCase().trim());
  
  // Count matches
  const requiredMatches = normalizedRequired.filter(skill =>
    normalizedCandidateSkills.some(cs => cs.includes(skill) || skill.includes(cs))
  ).length;
  
  const preferredMatches = normalizedPreferred.filter(skill =>
    normalizedCandidateSkills.some(cs => cs.includes(skill) || skill.includes(cs))
  ).length;
  
  // Required skills are weighted more heavily
  const requiredScore = (requiredMatches / normalizedRequired.length) * 70;
  const preferredScore = normalizedPreferred.length > 0
    ? (preferredMatches / normalizedPreferred.length) * 30
    : 30; // Full points if no preferred skills listed
  
  return Math.min(100, Math.round(requiredScore + preferredScore));
}

/**
 * Calculate experience match score
 */
function calculateExperienceMatch(
  candidate: Candidate,
  job: Job,
  requirements: { minYearsExperience: number; seniorityLevel: string }
): number {
  const candidateYears = candidate.totalExperienceYears || 0;
  const requiredYears = requirements.minYearsExperience;
  
  // Experience years score (60% weight)
  let yearsScore = 0;
  if (candidateYears >= requiredYears) {
    yearsScore = 60;
    // Bonus for significantly more experience (but cap to avoid over-qualification penalty)
    const bonus = Math.min(20, (candidateYears - requiredYears) * 2);
    yearsScore += bonus;
  } else {
    // Penalty for less experience
    yearsScore = Math.max(0, 60 - (requiredYears - candidateYears) * 10);
  }
  
  // Seniority level match (40% weight)
  const seniorityScore = matchSeniorityLevel(candidate.seniorityLevel, requirements.seniorityLevel);
  
  return Math.min(100, Math.round(yearsScore + seniorityScore));
}

/**
 * Match seniority levels
 */
function matchSeniorityLevel(candidateLevel: string | null, requiredLevel: string): number {
  const levels = ["entry", "junior", "mid", "senior", "lead", "principal", "executive"];
  const candidateIndex = candidateLevel ? levels.indexOf(candidateLevel.toLowerCase()) : -1;
  const requiredIndex = levels.indexOf(requiredLevel.toLowerCase());
  
  if (candidateIndex === -1 || requiredIndex === -1) return 20; // Default partial credit
  
  if (candidateIndex === requiredIndex) return 40; // Perfect match
  if (Math.abs(candidateIndex - requiredIndex) === 1) return 30; // One level off
  if (candidateIndex > requiredIndex) return 25; // Over-qualified
  return 10; // Under-qualified
}

/**
 * Calculate location match score
 */
function calculateLocationMatch(
  candidateLocation: string | null,
  jobLocation: string | null,
  willingToRelocate: boolean | null
): number {
  if (!jobLocation || jobLocation.toLowerCase().includes("remote")) return 100;
  if (!candidateLocation) return 50;
  
  const candLoc = candidateLocation.toLowerCase();
  const jobLoc = jobLocation.toLowerCase();
  
  // Exact match
  if (candLoc === jobLoc) return 100;
  
  // Same city
  if (candLoc.includes(jobLoc.split(",")[0]) || jobLoc.includes(candLoc.split(",")[0])) {
    return 90;
  }
  
  // Same state/region
  const candState = candLoc.split(",").pop()?.trim();
  const jobState = jobLoc.split(",").pop()?.trim();
  if (candState && jobState && candState === jobState) {
    return 70;
  }
  
  // Willing to relocate
  if (willingToRelocate) return 60;
  
  // Different location, not willing to relocate
  return 30;
}

/**
 * Calculate salary match score
 */
function calculateSalaryMatch(
  candidateMin: number | null,
  candidateMax: number | null,
  jobMin: number | null,
  jobMax: number | null
): number {
  // If either side doesn't specify salary, give neutral score
  if (!candidateMin && !candidateMax) return 75;
  if (!jobMin && !jobMax) return 75;
  
  const candMin = candidateMin || 0;
  const candMax = candidateMax || candidateMin || 0;
  const jMin = jobMin || 0;
  const jMax = jobMax || jobMin || 0;
  
  // Perfect overlap
  if (candMin <= jMax && candMax >= jMin) {
    const overlapStart = Math.max(candMin, jMin);
    const overlapEnd = Math.min(candMax, jMax);
    const overlapSize = overlapEnd - overlapStart;
    const candRange = candMax - candMin || 1;
    const overlapPercent = overlapSize / candRange;
    
    return Math.round(70 + overlapPercent * 30);
  }
  
  // Candidate expectations too high
  if (candMin > jMax) {
    const gap = candMin - jMax;
    const penalty = Math.min(50, (gap / jMax) * 100);
    return Math.max(20, 70 - penalty);
  }
  
  // Candidate expectations too low (might indicate under-qualification)
  if (candMax < jMin) {
    return 40;
  }
  
  return 50;
}

// =============================================================================
// AI-Powered Assessment
// =============================================================================

/**
 * Use LLM to assess cultural fit and provide detailed reasoning
 */
async function getAIMatchAssessment(
  candidate: Candidate,
  job: Job,
  scores: {
    skillsScore: number;
    experienceScore: number;
    locationScore: number;
    salaryScore: number;
  }
) {
  const prompt = `You are an expert recruiter analyzing candidate-job fit.

**Job Details:**
Title: ${job.title}
Company: ${job.companyName}
Description: ${job.description}
Requirements: ${job.requirements}
Responsibilities: ${job.responsibilities}

**Candidate Profile:**
Name: ${candidate.title}
Bio: ${candidate.bio}
Skills: ${candidate.skills}
Experience: ${candidate.experience}
Education: ${candidate.education}

**Preliminary Scores:**
- Skills Match: ${scores.skillsScore}/100
- Experience Match: ${scores.experienceScore}/100
- Location Match: ${scores.locationScore}/100
- Salary Match: ${scores.salaryScore}/100

Analyze this candidate-job match and provide:
1. Cultural fit score (0-100) based on values, work style, and company fit
2. List of matched skills
3. List of missing critical skills
4. Experience match assessment
5. Top 3 strengths for this role
6. Top 3 concerns or gaps
7. Overall reasoning for the match quality

Respond in JSON format:
{
  "culturalFitScore": number,
  "matchedSkills": string[],
  "missingSkills": string[],
  "experienceMatch": string,
  "strengths": string[],
  "concerns": string[],
  "reasoning": string
}`;

  try {
    const response = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "match_assessment",
          strict: true,
          schema: {
            type: "object",
            properties: {
              culturalFitScore: { type: "number" },
              matchedSkills: { type: "array", items: { type: "string" } },
              missingSkills: { type: "array", items: { type: "string" } },
              experienceMatch: { type: "string" },
              strengths: { type: "array", items: { type: "string" } },
              concerns: { type: "array", items: { type: "string" } },
              reasoning: { type: "string" },
            },
            required: ["culturalFitScore", "matchedSkills", "missingSkills", "experienceMatch", "strengths", "concerns", "reasoning"],
            additionalProperties: false,
          },
        },
      },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error("AI assessment failed:", error);
    // Fallback to basic assessment
    return {
      culturalFitScore: 70,
      matchedSkills: [],
      missingSkills: [],
      experienceMatch: "Unable to assess automatically",
      strengths: ["Review manually"],
      concerns: ["AI assessment unavailable"],
      reasoning: "Automated assessment failed, manual review recommended",
    };
  }
}

/**
 * Extract job requirements using AI
 */
async function extractJobRequirements(job: Job): Promise<{
  requiredSkills: string[];
  preferredSkills: string[];
  minYearsExperience: number;
  seniorityLevel: string;
}> {
  const prompt = `Extract structured requirements from this job posting:

**Title:** ${job.title}
**Description:** ${job.description}
**Requirements:** ${job.requirements}

Extract and return in JSON:
{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill3", "skill4"],
  "minYearsExperience": number,
  "seniorityLevel": "entry|junior|mid|senior|lead|principal"
}`;

  try {
    const response = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "job_requirements",
          strict: true,
          schema: {
            type: "object",
            properties: {
              requiredSkills: { type: "array", items: { type: "string" } },
              preferredSkills: { type: "array", items: { type: "string" } },
              minYearsExperience: { type: "number" },
              seniorityLevel: { type: "string" },
            },
            required: ["requiredSkills", "preferredSkills", "minYearsExperience", "seniorityLevel"],
            additionalProperties: false,
          },
        },
      },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Job requirements extraction failed:", error);
    return {
      requiredSkills: [],
      preferredSkills: [],
      minYearsExperience: 0,
      seniorityLevel: "mid",
    };
  }
}

// =============================================================================
// Candidate Screening & Ranking
// =============================================================================

/**
 * Screen and rank all applicants for a job
 */
export async function screenAndRankCandidates(
  applications: Array<Application & { candidate: Candidate }>,
  job: Job
): Promise<CandidateRanking[]> {
  // Calculate match scores for all candidates
  const scoredCandidates = await Promise.all(
    applications.map(async (app) => {
      const matchScore = await calculateJobMatch(app.candidate, job);
      return {
        candidateId: app.candidateId,
        applicationId: app.id,
        matchScore,
        rank: 0, // Will be set after sorting
        isTopProspect: false, // Will be set after sorting
      };
    })
  );

  // Sort by overall score (descending)
  scoredCandidates.sort((a, b) => b.matchScore.overallScore - a.matchScore.overallScore);

  // Assign ranks and flag top prospects
  const topProspectThreshold = Math.max(3, Math.ceil(scoredCandidates.length * 0.2)); // Top 20% or at least 3
  scoredCandidates.forEach((candidate, index) => {
    candidate.rank = index + 1;
    candidate.isTopProspect = index < topProspectThreshold && candidate.matchScore.overallScore >= 70;
  });

  return scoredCandidates;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getLocationMatchDescription(score: number): string {
  if (score >= 90) return "Same location or remote";
  if (score >= 70) return "Same region, commutable";
  if (score >= 60) return "Willing to relocate";
  return "Location mismatch";
}

function getSalaryMatchDescription(score: number): string {
  if (score >= 85) return "Excellent salary alignment";
  if (score >= 70) return "Good salary overlap";
  if (score >= 50) return "Partial salary overlap";
  if (score >= 40) return "Candidate expectations may be low";
  return "Salary expectations too high";
}
