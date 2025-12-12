import { rankResumesBySkills, type ParsedResume, type ResumeRanking } from './resumeParser';
import * as db from './db';

/**
 * Rank candidates for a specific job based on skill match
 */
export async function rankCandidatesForJob(jobId: number): Promise<ResumeRanking[]> {
  // Get job details with required skills
  const job = await db.getJobById(jobId);
  if (!job) {
    throw new Error('Job not found');
  }

  // Parse required skills from job description
  const requiredSkills = extractSkillsFromJobDescription(job.requirements || '', job.responsibilities || '');

  // Get all applications for this job
  const applications = await db.getApplicationsByJob(jobId);
  
  // Get candidate data with parsed resumes
  const candidatesWithResumes: Array<{ candidateId: number; parsedResume: ParsedResume }> = [];
  
  for (const app of applications) {
    const candidate = await db.getCandidateById(app.candidateId);
    if (candidate && candidate.parsedResumeData) {
      try {
        const parsedResume: ParsedResume = JSON.parse(candidate.parsedResumeData);
        candidatesWithResumes.push({
          candidateId: candidate.id,
          parsedResume
        });
      } catch (error) {
        console.error(`Failed to parse resume data for candidate ${candidate.id}:`, error);
      }
    }
  }

  // Rank resumes by skill match
  const rankings = await rankResumesBySkills(candidatesWithResumes, requiredSkills);
  
  return rankings;
}

/**
 * Extract skills from job description text
 */
function extractSkillsFromJobDescription(requirements: string, responsibilities: string): string[] {
  const combinedText = `${requirements} ${responsibilities}`.toLowerCase();
  
  // Common technical skills to look for
  const skillKeywords = [
    // Programming Languages
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'php', 'swift', 'kotlin',
    // Frontend
    'react', 'angular', 'vue', 'html', 'css', 'sass', 'tailwind', 'bootstrap', 'webpack', 'vite',
    // Backend
    'node.js', 'express', 'django', 'flask', 'spring', 'laravel', '.net', 'rails', 'fastapi',
    // Databases
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'sql',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github actions', 'terraform', 'ansible',
    // Tools
    'git', 'jira', 'confluence', 'slack', 'figma', 'postman',
    // Methodologies
    'agile', 'scrum', 'kanban', 'tdd', 'ci/cd', 'microservices', 'rest api', 'graphql',
    // Data & AI
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn',
    // Mobile
    'ios', 'android', 'react native', 'flutter',
    // Other
    'api', 'testing', 'debugging', 'optimization', 'security', 'performance'
  ];

  const foundSkills: string[] = [];
  
  for (const skill of skillKeywords) {
    if (combinedText.includes(skill)) {
      foundSkills.push(skill);
    }
  }

  // Remove duplicates and return
  return Array.from(new Set(foundSkills));
}

/**
 * Get top candidates for a job based on ranking
 */
export async function getTopCandidatesForJob(jobId: number, limit: number = 10): Promise<Array<{
  candidate: any;
  ranking: ResumeRanking;
}>> {
  const rankings = await rankCandidatesForJob(jobId);
  
  // Get top N candidates
  const topRankings = rankings.slice(0, limit);
  
  // Fetch full candidate details
  const results = [];
  for (const ranking of topRankings) {
    const candidate = await db.getCandidateById(ranking.candidateId);
    if (candidate) {
      results.push({
        candidate,
        ranking
      });
    }
  }
  
  return results;
}

/**
 * Compare two candidates side by side
 */
export async function compareCandidates(candidateId1: number, candidateId2: number, jobId?: number): Promise<{
  candidate1: any;
  candidate2: any;
  ranking1?: ResumeRanking;
  ranking2?: ResumeRanking;
  comparison: {
    skillsAdvantage: 'candidate1' | 'candidate2' | 'tie';
    experienceAdvantage: 'candidate1' | 'candidate2' | 'tie';
    educationAdvantage: 'candidate1' | 'candidate2' | 'tie';
    overallRecommendation: 'candidate1' | 'candidate2' | 'tie';
  };
}> {
  const candidate1 = await db.getCandidateById(candidateId1);
  const candidate2 = await db.getCandidateById(candidateId2);
  
  if (!candidate1 || !candidate2) {
    throw new Error('One or both candidates not found');
  }

  let ranking1: ResumeRanking | undefined;
  let ranking2: ResumeRanking | undefined;

  // If job ID provided, get rankings for that job
  if (jobId) {
    const rankings = await rankCandidatesForJob(jobId);
    ranking1 = rankings.find(r => r.candidateId === candidateId1);
    ranking2 = rankings.find(r => r.candidateId === candidateId2);
  } else {
    // Generic comparison based on parsed resume data
    if (candidate1.parsedResumeData && candidate2.parsedResumeData) {
      const parsed1: ParsedResume = JSON.parse(candidate1.parsedResumeData);
      const parsed2: ParsedResume = JSON.parse(candidate2.parsedResumeData);
      
      // Create dummy rankings for comparison
      ranking1 = {
        candidateId: candidateId1,
        overallScore: (parsed1.metadata.totalExperienceYears || 0) * 10,
        skillMatches: [],
        experienceScore: (parsed1.metadata.totalExperienceYears || 0) * 10,
        educationScore: 70,
        matchedSkillsCount: parsed1.skills.length,
        totalSkillsCount: parsed1.skills.length,
        matchPercentage: 100
      };
      
      ranking2 = {
        candidateId: candidateId2,
        overallScore: (parsed2.metadata.totalExperienceYears || 0) * 10,
        skillMatches: [],
        experienceScore: (parsed2.metadata.totalExperienceYears || 0) * 10,
        educationScore: 70,
        matchedSkillsCount: parsed2.skills.length,
        totalSkillsCount: parsed2.skills.length,
        matchPercentage: 100
      };
    }
  }

  // Determine advantages
  const skillsAdvantage = !ranking1 || !ranking2 ? 'tie' :
    ranking1.matchPercentage > ranking2.matchPercentage ? 'candidate1' :
    ranking2.matchPercentage > ranking1.matchPercentage ? 'candidate2' : 'tie';

  const experienceAdvantage = !ranking1 || !ranking2 ? 'tie' :
    ranking1.experienceScore > ranking2.experienceScore ? 'candidate1' :
    ranking2.experienceScore > ranking1.experienceScore ? 'candidate2' : 'tie';

  const educationAdvantage = !ranking1 || !ranking2 ? 'tie' :
    ranking1.educationScore > ranking2.educationScore ? 'candidate1' :
    ranking2.educationScore > ranking1.educationScore ? 'candidate2' : 'tie';

  const overallRecommendation = !ranking1 || !ranking2 ? 'tie' :
    ranking1.overallScore > ranking2.overallScore ? 'candidate1' :
    ranking2.overallScore > ranking1.overallScore ? 'candidate2' : 'tie';

  return {
    candidate1,
    candidate2,
    ranking1,
    ranking2,
    comparison: {
      skillsAdvantage,
      experienceAdvantage,
      educationAdvantage,
      overallRecommendation
    }
  };
}
