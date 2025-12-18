import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { candidateSuccessPredictions, applications, jobs, candidates } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Predictive Success Scoring Service
 * 
 * Uses AI to predict candidate success probability for job applications
 * based on skills match, experience fit, and historical patterns.
 */

export interface PredictionFeatures {
  // Skills matching
  skillsMatchPercentage: number;
  requiredSkillsCovered: number;
  totalRequiredSkills: number;
  
  // Experience matching
  experienceYears: number;
  experienceMatch: 'under' | 'match' | 'over';
  
  // Education
  educationLevel: string;
  relevantDegree: boolean;
  
  // Job fit
  titleRelevance: number; // 0-100
  industryMatch: boolean;
  locationMatch: boolean;
  
  // Application quality
  resumeCompleteness: number; // 0-100
  coverLetterProvided: boolean;
  
  // Candidate profile
  profileCompleteness: number; // 0-100
  previousApplications: number;
  interviewHistory: number;
}

/**
 * Extract features from application data
 */
export async function extractFeatures(applicationId: number): Promise<PredictionFeatures> {
  const db = await getDb();
  
  // Get application with job and candidate data
  const appData = await db.select()
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);
  
  if (!appData || appData.length === 0) {
    throw new Error('Application not found');
  }
  
  const application = appData[0];
  
  // Get job details
  const jobData = await db.select()
    .from(jobs)
    .where(eq(jobs.id, application.jobId))
    .limit(1);
  
  const job = jobData[0];
  
  // Get candidate details
  const candidateData = await db.select()
    .from(candidates)
    .where(eq(candidates.id, application.candidateId))
    .limit(1);
  
  const candidate = candidateData[0];
  
  // Parse skills from job and candidate
  let jobSkills: string[] = [];
  let candidateSkills: string[] = [];
  
  try {
    if (job?.requiredSkills) {
      jobSkills = typeof job.requiredSkills === 'string' 
        ? JSON.parse(job.requiredSkills) 
        : job.requiredSkills;
    }
  } catch (e) {
    console.error('Failed to parse job skills:', e);
  }
  
  try {
    if (candidate?.skills) {
      candidateSkills = typeof candidate.skills === 'string'
        ? JSON.parse(candidate.skills)
        : candidate.skills;
    }
  } catch (e) {
    console.error('Failed to parse candidate skills:', e);
  }
  
  // Calculate skills match
  const matchedSkills = jobSkills.filter(skill => 
    candidateSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()))
  );
  const skillsMatchPercentage = jobSkills.length > 0 
    ? (matchedSkills.length / jobSkills.length) * 100 
    : 0;
  
  // Calculate experience match
  const candidateYears = candidate?.yearsOfExperience || 0;
  const jobMinYears = job?.experienceLevel === 'entry' ? 0 : 
                      job?.experienceLevel === 'mid' ? 3 :
                      job?.experienceLevel === 'senior' ? 7 : 0;
  const jobMaxYears = job?.experienceLevel === 'entry' ? 2 :
                      job?.experienceLevel === 'mid' ? 6 :
                      job?.experienceLevel === 'senior' ? 20 : 20;
  
  let experienceMatch: 'under' | 'match' | 'over';
  if (candidateYears < jobMinYears) {
    experienceMatch = 'under';
  } else if (candidateYears > jobMaxYears) {
    experienceMatch = 'over';
  } else {
    experienceMatch = 'match';
  }
  
  // Get previous applications count
  const previousApps = await db.select()
    .from(applications)
    .where(eq(applications.candidateId, application.candidateId));
  
  // Calculate profile completeness
  let profileCompleteness = 0;
  if (candidate) {
    const fields = [
      candidate.firstName,
      candidate.lastName,
      candidate.email,
      candidate.phone,
      candidate.location,
      candidate.headline,
      candidate.summary,
      candidate.skills,
      candidate.education,
      candidate.experience,
    ];
    profileCompleteness = (fields.filter(f => f).length / fields.length) * 100;
  }
  
  return {
    skillsMatchPercentage,
    requiredSkillsCovered: matchedSkills.length,
    totalRequiredSkills: jobSkills.length,
    experienceYears: candidateYears,
    experienceMatch,
    educationLevel: candidate?.education || 'unknown',
    relevantDegree: true, // TODO: Implement degree relevance check
    titleRelevance: 75, // TODO: Calculate based on job title similarity
    industryMatch: true, // TODO: Implement industry matching
    locationMatch: candidate?.location === job?.location,
    resumeCompleteness: application.resumeUrl ? 100 : 0,
    coverLetterProvided: !!application.coverLetter,
    profileCompleteness,
    previousApplications: previousApps.length,
    interviewHistory: 0, // TODO: Get from interviews table
  };
}

/**
 * Calculate success score using AI
 */
export async function calculateSuccessScore(features: PredictionFeatures): Promise<{
  score: number;
  confidence: number;
  factors: string[];
  recommendation: string;
}> {
  const prompt = `You are an expert recruiter analyzing a job application to predict candidate success.

**Application Features:**
- Skills Match: ${features.skillsMatchPercentage.toFixed(1)}% (${features.requiredSkillsCovered}/${features.totalRequiredSkills} required skills)
- Experience: ${features.experienceYears} years (${features.experienceMatch})
- Education: ${features.educationLevel}
- Title Relevance: ${features.titleRelevance}%
- Location Match: ${features.locationMatch ? 'Yes' : 'No'}
- Resume Provided: ${features.resumeCompleteness > 0 ? 'Yes' : 'No'}
- Cover Letter: ${features.coverLetterProvided ? 'Yes' : 'No'}
- Profile Completeness: ${features.profileCompleteness.toFixed(1)}%
- Previous Applications: ${features.previousApplications}

**Task:**
Predict the likelihood of this candidate being successful in the role (0-100 score).

**Consider:**
1. Skills alignment with job requirements
2. Experience level appropriateness
3. Application quality and effort
4. Profile completeness indicating seriousness
5. Location compatibility

**Output:**
Return JSON with:
- score: 0-100 (higher = more likely to succeed)
- confidence: 0-100 (how confident you are in this prediction)
- factors: Array of 3-5 key factors influencing the score (positive or negative)
- recommendation: One sentence recommendation for the recruiter`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are an expert recruiter with 20 years of experience predicting candidate success.' },
        { role: 'user', content: prompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'success_prediction',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              score: { type: 'number' },
              confidence: { type: 'number' },
              factors: {
                type: 'array',
                items: { type: 'string' }
              },
              recommendation: { type: 'string' }
            },
            required: ['score', 'confidence', 'factors', 'recommendation'],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Failed to generate prediction');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error calculating success score:', error);
    // Fallback to simple scoring
    let score = features.skillsMatchPercentage * 0.4;
    score += (features.experienceMatch === 'match' ? 30 : features.experienceMatch === 'over' ? 20 : 10);
    score += features.profileCompleteness * 0.2;
    score += (features.coverLetterProvided ? 10 : 0);
    
    return {
      score: Math.min(100, Math.max(0, score)),
      confidence: 50,
      factors: ['Skills match', 'Experience level', 'Profile completeness'],
      recommendation: 'Review application manually'
    };
  }
}

/**
 * Predict success for an application and store result
 */
export async function predictApplicationSuccess(applicationId: number): Promise<{
  score: number;
  confidence: number;
  factors: string[];
  recommendation: string;
}> {
  const db = await getDb();
  
  // Extract features
  const features = await extractFeatures(applicationId);
  
  // Calculate score
  const prediction = await calculateSuccessScore(features);
  
  // Get application details for storage
  const appData = await db.select()
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);
  
  if (!appData || appData.length === 0) {
    throw new Error('Application not found');
  }
  
  const application = appData[0];
  
  // Store prediction
  await db.insert(candidateSuccessPredictions).values({
    candidateId: application.candidateId,
    jobId: application.jobId,
    applicationId,
    predictionScore: prediction.score,
    confidence: prediction.confidence,
    features: JSON.stringify(features),
    factors: JSON.stringify(prediction.factors),
    recommendation: prediction.recommendation,
  });
  
  console.log(`Predicted success for application ${applicationId}: ${prediction.score}/100`);
  
  // Trigger auto-scheduling if score is high enough
  if (prediction.score >= 85) {
    try {
      const { autoScheduleInterview } = await import('./autoScheduling');
      // Get recruiter ID from application
      const appData = await db.select()
        .from(applications)
        .where(eq(applications.id, applicationId))
        .limit(1);
      
      if (appData && appData.length > 0) {
        const application = appData[0];
        const jobData = await db.select()
          .from(jobs)
          .where(eq(jobs.id, application.jobId))
          .limit(1);
        
        if (jobData && jobData.length > 0) {
          const job = jobData[0];
          // Auto-schedule in background (don't block prediction response)
          autoScheduleInterview(applicationId, job.recruiterId).catch(error => {
            console.error('Auto-scheduling failed:', error);
          });
        }
      }
    } catch (error) {
      console.error('Error triggering auto-schedule:', error);
    }
  }
  
  return prediction;
}

/**
 * Batch predict success for multiple applications
 */
export async function batchPredictSuccess(applicationIds: number[]): Promise<void> {
  for (const appId of applicationIds) {
    try {
      await predictApplicationSuccess(appId);
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to predict success for application ${appId}:`, error);
    }
  }
}

/**
 * Get ranked applications by success score
 */
export async function getRankedApplications(jobId: number): Promise<any[]> {
  const db = await getDb();
  
  // Get all applications for job
  const apps = await db.select()
    .from(applications)
    .where(eq(applications.jobId, jobId));
  
  // Get predictions for each application
  const rankedApps = [];
  
  for (const app of apps) {
    const predictions = await db.select()
      .from(candidateSuccessPredictions)
      .where(eq(candidateSuccessPredictions.applicationId, app.id))
      .limit(1);
    
    rankedApps.push({
      ...app,
      prediction: predictions[0] || null,
    });
  }
  
  // Sort by prediction score (highest first)
  rankedApps.sort((a, b) => {
    const scoreA = a.prediction?.predictionScore || 0;
    const scoreB = b.prediction?.predictionScore || 0;
    return scoreB - scoreA;
  });
  
  return rankedApps;
}
