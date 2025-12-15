import { getDb } from "./db";
import { resumeProfiles, jobs } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Get jobs that match candidate's top 5 skills with percentage indicators
 * @param candidateId - The candidate's ID
 * @param limit - Maximum number of jobs to return
 * @returns Jobs with skill match percentages
 */
export async function getSkillBasedJobs(
  candidateId: number,
  limit: number = 10
): Promise<any[]> {
  // Get candidate's resume profile
  const db = await getDb();
  if (!db) return [];
  
  const resumeProfile = await db
    .select()
    .from(resumeProfiles)
    .where(eq(resumeProfiles.candidateId, candidateId))
    .orderBy(resumeProfiles.createdAt)
    .limit(1);

  if (!resumeProfile || resumeProfile.length === 0) {
    return [];
  }

  const profile = resumeProfile[0];

  // Extract candidate's top 5 skills
  const candidateSkills = extractTopSkills(profile);
  
  if (candidateSkills.length === 0) {
    return [];
  }

  // Get all active jobs
  const activeJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "active"))
    .limit(100); // Get more jobs to filter

  // Calculate skill match for each job
  const jobsWithSkillMatch = activeJobs.map((job: any) => {
    const jobSkills = extractJobSkills(job);
    const matchResult = calculateSkillMatchPercentage(candidateSkills, jobSkills);
    
    return {
      ...job,
      skillMatchPercentage: matchResult.percentage,
      matchedSkills: matchResult.matchedSkills,
      candidateTopSkills: candidateSkills,
    };
  });

  // Filter jobs with at least one skill match and sort by percentage
  return jobsWithSkillMatch
    .filter((job: any) => job.skillMatchPercentage > 0)
    .sort((a: any, b: any) => b.skillMatchPercentage - a.skillMatchPercentage)
    .slice(0, limit);
}

/**
 * Extract top 5 skills from candidate's resume profile
 */
function extractTopSkills(profile: any): string[] {
  const skills: string[] = [];

  // Parse top skills JSON (already has top 5)
  if (profile.topSkills) {
    try {
      const topSkills = JSON.parse(profile.topSkills);
      skills.push(...topSkills.slice(0, 5).map((s: any) => s.skill.toLowerCase()));
    } catch (e) {
      console.error("Error parsing top skills:", e);
    }
  }

  // If no top skills, get from resume data
  if (skills.length === 0 && profile.resumeData) {
    try {
      const resumeData = JSON.parse(profile.resumeData);
      if (resumeData.skills && Array.isArray(resumeData.skills)) {
        skills.push(...resumeData.skills.slice(0, 5).map((s: string) => s.toLowerCase()));
      }
    } catch (e) {
      console.error("Error parsing resume data:", e);
    }
  }

  return skills;
}

/**
 * Extract skills from job description and requirements
 */
function extractJobSkills(job: any): string[] {
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
    "c++",
    "c#",
    "go",
    "rust",
    "ruby",
    "php",
    "swift",
    "kotlin",
    "flutter",
    "react native",
    "figma",
    "sketch",
    "photoshop",
    "illustrator",
    "jira",
    "confluence",
    "salesforce",
    "tableau",
    "power bi",
    "excel",
    "machine learning",
    "deep learning",
    "nlp",
    "computer vision",
    "data analysis",
    "statistics",
    "pandas",
    "numpy",
    "tensorflow",
    "pytorch",
    "scikit-learn",
  ];

  const description = (job.description || "").toLowerCase();
  const requirements = (job.requirements || "").toLowerCase();
  const title = (job.title || "").toLowerCase();
  const combinedText = `${title} ${description} ${requirements}`;

  // Find skills mentioned in job
  techSkills.forEach((skill) => {
    if (combinedText.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  });

  return Array.from(new Set(skills));
}

/**
 * Calculate skill match percentage
 */
function calculateSkillMatchPercentage(
  candidateSkills: string[],
  jobSkills: string[]
): { percentage: number; matchedSkills: string[] } {
  if (candidateSkills.length === 0) {
    return { percentage: 0, matchedSkills: [] };
  }

  // Find matched skills (fuzzy matching)
  const matchedSkills = candidateSkills.filter((candidateSkill) =>
    jobSkills.some((jobSkill) => 
      jobSkill.includes(candidateSkill) || 
      candidateSkill.includes(jobSkill) ||
      areSimilarSkills(candidateSkill, jobSkill)
    )
  );

  // Calculate percentage based on how many of candidate's top skills match
  const percentage = Math.round((matchedSkills.length / candidateSkills.length) * 100);

  return { percentage, matchedSkills };
}

/**
 * Check if two skills are similar (e.g., "react.js" and "react")
 */
function areSimilarSkills(skill1: string, skill2: string): boolean {
  // Remove common suffixes/prefixes
  const normalize = (s: string) => s.replace(/\.js|js|\.css|css/gi, '').trim();
  
  const normalized1 = normalize(skill1);
  const normalized2 = normalize(skill2);
  
  return normalized1 === normalized2 || 
         normalized1.includes(normalized2) || 
         normalized2.includes(normalized1);
}
