import { getDb } from "./db";
import { resumeProfiles, jobs } from "../drizzle/schema";
import { eq } from "drizzle-orm";

interface MatchScore {
  overallScore: number;
  skillMatchScore: number;
  domainMatchScore: number;
  experienceScore: number;
  matchedSkills: string[];
  matchedDomains: string[];
  missingSkills: string[];
}

/**
 * Calculate AI-powered job match score based on candidate's resume profile
 * @param candidateId - The candidate's ID
 * @param jobId - The job ID to match against
 * @returns Match score breakdown
 */
export async function calculateJobMatchScore(
  candidateId: number,
  jobId: number
): Promise<MatchScore | null> {
  // Get candidate's resume profile
  const db = await getDb();
  if (!db) return null;
  const resumeProfile = await db
    .select()
    .from(resumeProfiles)
    .where(eq(resumeProfiles.candidateId, candidateId))
    .orderBy(resumeProfiles.createdAt)
    .limit(1);

  if (!resumeProfile || resumeProfile.length === 0) {
    return null;
  }

  const profile = resumeProfile[0];

  // Get job details
  const job = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!job || job.length === 0) {
    return null;
  }

  const jobData = job[0];

  // Parse resume profile data
  const candidateSkills = parseSkillsFromProfile(profile);
  const candidateDomains = parseDomains(profile.topDomains as string | null);
  const candidateExperience = profile.totalExperienceYears || 0;

  // Parse job requirements
  const requiredSkills = parseSkillsFromJob(jobData);
  const jobDomains = extractDomainsFromJob(jobData);
  const requiredExperience = extractExperienceRequirement(jobData);

  // Calculate skill match
  const { matchedSkills, missingSkills, skillScore } = calculateSkillMatch(
    candidateSkills,
    requiredSkills
  );

  // Calculate domain match
  const { matchedDomains, domainScore } = calculateDomainMatch(
    candidateDomains,
    jobDomains
  );

  // Calculate experience match
  const experienceScore = calculateExperienceMatch(
    candidateExperience,
    requiredExperience
  );

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    skillScore * 0.5 + domainScore * 0.3 + experienceScore * 0.2
  );

  return {
    overallScore,
    skillMatchScore: skillScore,
    domainMatchScore: domainScore,
    experienceScore,
    matchedSkills,
    matchedDomains,
    missingSkills,
  };
}

/**
 * Parse skills from resume profile
 */
function parseSkillsFromProfile(profile: any): string[] {
  const skills: string[] = [];

  // Parse top skills JSON
  if (profile.topSkills) {
    try {
      const topSkills = JSON.parse(profile.topSkills);
      skills.push(...topSkills.map((s: any) => s.skill.toLowerCase()));
    } catch (e) {
      console.error("Error parsing top skills:", e);
    }
  }

  // Parse skills from resume data
  if (profile.resumeData) {
    try {
      const resumeData = JSON.parse(profile.resumeData);
      if (resumeData.skills && Array.isArray(resumeData.skills)) {
        skills.push(...resumeData.skills.map((s: string) => s.toLowerCase()));
      }
    } catch (e) {
      console.error("Error parsing resume data:", e);
    }
  }

  return Array.from(new Set(skills)); // Remove duplicates
}

/**
 * Parse domains from top domains JSON
 */
function parseDomains(topDomainsJson: string | null): string[] {
  if (!topDomainsJson) return [];

  try {
    const domains = JSON.parse(topDomainsJson);
    return domains.map((d: any) => d.domain.toLowerCase());
  } catch (e) {
    console.error("Error parsing domains:", e);
    return [];
  }
}

/**
 * Extract skills from job description and requirements
 */
function parseSkillsFromJob(job: any): string[] {
  const skills: string[] = [];

  // Common tech skills to look for
  const techSkills = [
    "javascript",
    "typescript",
    "python",
    "java",
    "react",
    "node.js",
    "angular",
    "vue",
    "sql",
    "mongodb",
    "aws",
    "docker",
    "kubernetes",
    "git",
    "agile",
    "scrum",
    "rest api",
    "graphql",
    "html",
    "css",
    "tailwind",
    "next.js",
    "express",
    "django",
    "flask",
    "spring boot",
    "postgresql",
    "mysql",
    "redis",
    "elasticsearch",
    "ci/cd",
    "jenkins",
    "terraform",
    "ansible",
  ];

  const description = (job.description || "").toLowerCase();
  const requirements = (job.requirements || "").toLowerCase();
  const combinedText = `${description} ${requirements}`;

  // Find skills mentioned in job description
  techSkills.forEach((skill) => {
    if (combinedText.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  });

  return Array.from(new Set(skills));
}

/**
 * Extract domains from job title and description
 */
function extractDomainsFromJob(job: any): string[] {
  const domains: string[] = [];
  const title = (job.title || "").toLowerCase();
  const description = (job.description || "").toLowerCase();

  const domainKeywords: { [key: string]: string[] } = {
    "web development": ["web", "frontend", "backend", "full stack", "fullstack"],
    "mobile development": ["mobile", "ios", "android", "react native", "flutter"],
    "data science": ["data science", "machine learning", "ml", "ai", "analytics"],
    "devops": ["devops", "infrastructure", "cloud", "deployment", "sre"],
    "ui/ux design": ["ui", "ux", "design", "figma", "sketch"],
    "product management": ["product manager", "product owner", "pm"],
    "project management": ["project manager", "scrum master", "agile"],
  };

  Object.entries(domainKeywords).forEach(([domain, keywords]) => {
    if (keywords.some((kw) => title.includes(kw) || description.includes(kw))) {
      domains.push(domain);
    }
  });

  return domains;
}

/**
 * Extract experience requirement from job
 */
function extractExperienceRequirement(job: any): number {
  const requirements = (job.requirements || "").toLowerCase();
  const description = (job.description || "").toLowerCase();
  const combinedText = `${requirements} ${description}`;

  // Look for patterns like "5+ years", "3-5 years", "minimum 2 years"
  const patterns = [
    /(\d+)\+?\s*years/i,
    /(\d+)-\d+\s*years/i,
    /minimum\s*(\d+)\s*years/i,
    /at least\s*(\d+)\s*years/i,
  ];

  for (const pattern of patterns) {
    const match = combinedText.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }

  // Default based on experience level
  if (job.experienceLevel) {
    const level = job.experienceLevel.toLowerCase();
    if (level.includes("entry")) return 0;
    if (level.includes("mid")) return 3;
    if (level.includes("senior")) return 5;
    if (level.includes("lead")) return 8;
  }

  return 0;
}

/**
 * Calculate skill match score
 */
function calculateSkillMatch(
  candidateSkills: string[],
  requiredSkills: string[]
): { matchedSkills: string[]; missingSkills: string[]; skillScore: number } {
  if (requiredSkills.length === 0) {
    return { matchedSkills: [], missingSkills: [], skillScore: 80 }; // Default score if no specific skills required
  }

  const matchedSkills = requiredSkills.filter((skill) =>
    candidateSkills.some((cs) => cs.includes(skill) || skill.includes(cs))
  );

  const missingSkills = requiredSkills.filter(
    (skill) => !matchedSkills.includes(skill)
  );

  const skillScore = Math.round((matchedSkills.length / requiredSkills.length) * 100);

  return { matchedSkills, missingSkills, skillScore };
}

/**
 * Calculate domain match score
 */
function calculateDomainMatch(
  candidateDomains: string[],
  jobDomains: string[]
): { matchedDomains: string[]; domainScore: number } {
  if (jobDomains.length === 0) {
    return { matchedDomains: [], domainScore: 80 }; // Default score
  }

  const matchedDomains = jobDomains.filter((domain) =>
    candidateDomains.some((cd) => cd.includes(domain) || domain.includes(cd))
  );

  const domainScore = Math.round((matchedDomains.length / jobDomains.length) * 100);

  return { matchedDomains, domainScore };
}

/**
 * Calculate experience match score
 */
function calculateExperienceMatch(
  candidateExperience: number,
  requiredExperience: number
): number {
  if (requiredExperience === 0) return 100;

  if (candidateExperience >= requiredExperience) {
    return 100;
  } else if (candidateExperience >= requiredExperience * 0.75) {
    return 85;
  } else if (candidateExperience >= requiredExperience * 0.5) {
    return 70;
  } else {
    return 50;
  }
}

/**
 * Get matching jobs for a candidate with real AI scores
 */
export async function getMatchingJobsForCandidate(
  candidateId: number,
  limit: number = 10
): Promise<any[]> {
  // Get all active jobs
  const db = await getDb();
  if (!db) return [];
  const activeJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "active"))
    .limit(50); // Get more jobs to filter and sort

  // Calculate match scores for each job
  const jobsWithScores = await Promise.all(
    activeJobs.map(async (job: any) => {
      const matchScore = await calculateJobMatchScore(candidateId, job.id);
      return {
        ...job,
        matchScore: matchScore?.overallScore || 0,
        skillMatchScore: matchScore?.skillMatchScore || 0,
        domainMatchScore: matchScore?.domainMatchScore || 0,
        experienceScore: matchScore?.experienceScore || 0,
        matchedSkills: matchScore?.matchedSkills || [],
        matchedDomains: matchScore?.matchedDomains || [],
        missingSkills: matchScore?.missingSkills || [],
      };
    })
  );

  // Sort by match score and return top matches
  return jobsWithScores
    .filter((job: any) => job.matchScore >= 60) // Only show jobs with 60%+ match
    .sort((a: any, b: any) => b.matchScore - a.matchScore)
    .slice(0, limit);
}
