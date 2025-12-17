import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { sourcingCampaigns, sourcedCandidates, candidates, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Candidate Sourcing Service
 * 
 * Automates candidate discovery from LinkedIn, GitHub, and other platforms
 * using AI-powered profile enrichment and matching.
 */

export interface SourcingCriteria {
  targetRoles: string[];
  requiredSkills: string[];
  locations?: string[];
  experienceMin?: number;
  experienceMax?: number;
}

export interface SourcedProfile {
  sourceType: 'linkedin' | 'github' | 'stackoverflow';
  sourceUrl: string;
  sourceProfileId: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  location?: string;
  currentTitle?: string;
  currentCompany?: string;
  rawData: any;
}

/**
 * Search LinkedIn for candidates matching criteria
 * Note: This is a placeholder - in production, integrate with LinkedIn Recruiter API or scraping service
 */
export async function searchLinkedIn(criteria: SourcingCriteria, maxResults: number = 50): Promise<SourcedProfile[]> {
  // In production, this would call LinkedIn Recruiter API or a scraping service
  // For now, we'll use AI to generate realistic sample profiles for demonstration
  
  const prompt = `Generate ${Math.min(maxResults, 10)} realistic LinkedIn profiles for candidates matching these criteria:
  
Roles: ${criteria.targetRoles.join(', ')}
Required Skills: ${criteria.requiredSkills.join(', ')}
${criteria.locations ? `Locations: ${criteria.locations.join(', ')}` : ''}
${criteria.experienceMin ? `Min Experience: ${criteria.experienceMin} years` : ''}
${criteria.experienceMax ? `Max Experience: ${criteria.experienceMax} years` : ''}

For each profile, provide:
- Full name
- Current job title
- Current company
- Location
- Years of experience
- Key skills (from the required list)
- LinkedIn profile URL (realistic format)
- Email (professional format)

Return as JSON array.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are a recruitment data generator. Create realistic candidate profiles.' },
        { role: 'user', content: prompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'linkedin_profiles',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              profiles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    fullName: { type: 'string' },
                    currentTitle: { type: 'string' },
                    currentCompany: { type: 'string' },
                    location: { type: 'string' },
                    yearsExperience: { type: 'number' },
                    skills: { type: 'array', items: { type: 'string' } },
                    linkedinUrl: { type: 'string' },
                    email: { type: 'string' }
                  },
                  required: ['fullName', 'currentTitle', 'currentCompany', 'location', 'yearsExperience', 'skills', 'linkedinUrl', 'email'],
                  additionalProperties: false
                }
              }
            },
            required: ['profiles'],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return [];
    }

    const result = JSON.parse(content);
    
    return result.profiles.map((profile: any) => ({
      sourceType: 'linkedin' as const,
      sourceUrl: profile.linkedinUrl,
      sourceProfileId: profile.linkedinUrl.split('/').pop() || '',
      fullName: profile.fullName,
      email: profile.email,
      location: profile.location,
      currentTitle: profile.currentTitle,
      currentCompany: profile.currentCompany,
      rawData: profile
    }));
  } catch (error) {
    console.error('Error searching LinkedIn:', error);
    return [];
  }
}

/**
 * Search GitHub for developers matching criteria
 */
export async function searchGitHub(criteria: SourcingCriteria, maxResults: number = 50): Promise<SourcedProfile[]> {
  // In production, use GitHub Search API: https://api.github.com/search/users
  // For now, generate sample profiles
  
  const prompt = `Generate ${Math.min(maxResults, 10)} realistic GitHub developer profiles matching these criteria:

Roles: ${criteria.targetRoles.join(', ')}
Required Skills: ${criteria.requiredSkills.join(', ')}
${criteria.locations ? `Locations: ${criteria.locations.join(', ')}` : ''}

For each profile, provide:
- Full name
- GitHub username
- Location
- Bio/description
- Top programming languages/skills
- Number of public repos
- GitHub profile URL
- Email (if available)

Return as JSON array.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are a recruitment data generator. Create realistic GitHub developer profiles.' },
        { role: 'user', content: prompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'github_profiles',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              profiles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    fullName: { type: 'string' },
                    username: { type: 'string' },
                    location: { type: 'string' },
                    bio: { type: 'string' },
                    skills: { type: 'array', items: { type: 'string' } },
                    publicRepos: { type: 'number' },
                    githubUrl: { type: 'string' },
                    email: { type: 'string' }
                  },
                  required: ['fullName', 'username', 'location', 'bio', 'skills', 'publicRepos', 'githubUrl'],
                  additionalProperties: false
                }
              }
            },
            required: ['profiles'],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return [];
    }

    const result = JSON.parse(content);
    
    return result.profiles.map((profile: any) => ({
      sourceType: 'github' as const,
      sourceUrl: profile.githubUrl,
      sourceProfileId: profile.username,
      fullName: profile.fullName,
      email: profile.email,
      location: profile.location,
      currentTitle: `${profile.skills[0]} Developer`, // Infer title from skills
      currentCompany: undefined,
      rawData: profile
    }));
  } catch (error) {
    console.error('Error searching GitHub:', error);
    return [];
  }
}

/**
 * Enrich a sourced profile with AI-extracted skills, experience, and insights
 */
export async function enrichProfile(profile: SourcedProfile, jobDescription?: string): Promise<any> {
  const prompt = `Analyze this candidate profile and extract structured information:

Name: ${profile.fullName}
Current Title: ${profile.currentTitle || 'N/A'}
Current Company: ${profile.currentCompany || 'N/A'}
Location: ${profile.location || 'N/A'}
Source: ${profile.sourceType}

Raw Profile Data:
${JSON.stringify(profile.rawData, null, 2)}

${jobDescription ? `\nTarget Job Description:\n${jobDescription}` : ''}

Extract and analyze:
1. Technical skills (programming languages, frameworks, tools)
2. Soft skills (leadership, communication, etc.)
3. Years of experience (estimate if not explicit)
4. Education level (estimate if not explicit)
5. Career trajectory and growth
6. Notable achievements or projects
${jobDescription ? '7. Match score (0-100) for the target job' : ''}
${jobDescription ? '8. Strengths and gaps relative to the job' : ''}

Return structured JSON.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are an expert recruiter analyzing candidate profiles.' },
        { role: 'user', content: prompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'profile_enrichment',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              technicalSkills: { type: 'array', items: { type: 'string' } },
              softSkills: { type: 'array', items: { type: 'string' } },
              yearsExperience: { type: 'number' },
              educationLevel: { type: 'string' },
              careerSummary: { type: 'string' },
              notableAchievements: { type: 'array', items: { type: 'string' } },
              matchScore: { type: 'number' },
              strengths: { type: 'array', items: { type: 'string' } },
              gaps: { type: 'array', items: { type: 'string' } }
            },
            required: ['technicalSkills', 'softSkills', 'yearsExperience', 'educationLevel', 'careerSummary'],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return null;
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error enriching profile:', error);
    return null;
  }
}

/**
 * Run a sourcing campaign
 */
export async function runSourcingCampaign(campaignId: number): Promise<void> {
  const db = getDb();
  
  // Get campaign details
  const campaign = await db.select().from(sourcingCampaigns).where(eq(sourcingCampaigns.id, campaignId)).limit(1);
  if (!campaign || campaign.length === 0) {
    throw new Error('Campaign not found');
  }

  const campaignData = campaign[0];
  
  // Update status to active
  await db.update(sourcingCampaigns)
    .set({ status: 'active', startedAt: new Date() })
    .where(eq(sourcingCampaigns.id, campaignId));

  try {
    const criteria: SourcingCriteria = {
      targetRoles: campaignData.targetRoles ? JSON.parse(campaignData.targetRoles) : [],
      requiredSkills: campaignData.requiredSkills ? JSON.parse(campaignData.requiredSkills) : [],
      locations: campaignData.locations ? JSON.parse(campaignData.locations) : undefined,
      experienceMin: campaignData.experienceMin || undefined,
      experienceMax: campaignData.experienceMax || undefined,
    };

    let allProfiles: SourcedProfile[] = [];

    // Search LinkedIn
    if (campaignData.searchLinkedIn) {
      const linkedInProfiles = await searchLinkedIn(criteria, campaignData.maxCandidates || 100);
      allProfiles = allProfiles.concat(linkedInProfiles);
    }

    // Search GitHub
    if (campaignData.searchGitHub) {
      const githubProfiles = await searchGitHub(criteria, campaignData.maxCandidates || 100);
      allProfiles = allProfiles.concat(githubProfiles);
    }

    // Limit to maxCandidates
    allProfiles = allProfiles.slice(0, campaignData.maxCandidates || 100);

    // Save sourced candidates
    let enrichedCount = 0;
    let addedCount = 0;

    for (const profile of allProfiles) {
      // Insert sourced candidate
      const insertResult = await db.insert(sourcedCandidates).values({
        campaignId,
        sourceType: profile.sourceType,
        sourceUrl: profile.sourceUrl,
        sourceProfileId: profile.sourceProfileId,
        fullName: profile.fullName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        location: profile.location,
        currentTitle: profile.currentTitle,
        currentCompany: profile.currentCompany,
        rawProfileData: JSON.stringify(profile.rawData),
        enrichmentStatus: campaignData.autoEnrich ? 'processing' : 'pending',
      });

      const sourcedCandidateId = insertResult.insertId;

      // Enrich profile if enabled
      if (campaignData.autoEnrich) {
        const enrichedData = await enrichProfile(profile);
        if (enrichedData) {
          await db.update(sourcedCandidates)
            .set({
              enrichedData: JSON.stringify(enrichedData),
              matchScore: enrichedData.matchScore || null,
              enrichmentStatus: 'completed'
            })
            .where(eq(sourcedCandidates.id, sourcedCandidateId));
          enrichedCount++;
        } else {
          await db.update(sourcedCandidates)
            .set({ enrichmentStatus: 'failed' })
            .where(eq(sourcedCandidates.id, sourcedCandidateId));
        }
      }

      // Auto-add to talent pool if enabled
      if (campaignData.autoAddToPool && profile.email) {
        try {
          // Create user account
          const userResult = await db.insert(users).values({
            email: profile.email,
            name: profile.fullName,
            role: 'candidate',
            loginMethod: 'sourced', // Special marker for sourced candidates
          });

          const userId = userResult.insertId;

          // Create candidate profile
          const candidateResult = await db.insert(candidates).values({
            userId,
            title: profile.currentTitle,
            location: profile.location,
            phoneNumber: profile.phoneNumber,
          });

          // Link sourced candidate to candidate record
          await db.update(sourcedCandidates)
            .set({
              candidateId: candidateResult.insertId,
              addedToPool: true
            })
            .where(eq(sourcedCandidates.id, sourcedCandidateId));

          addedCount++;
        } catch (error) {
          console.error('Error adding candidate to pool:', error);
          // Continue with next candidate
        }
      }
    }

    // Update campaign statistics
    await db.update(sourcingCampaigns)
      .set({
        status: 'completed',
        completedAt: new Date(),
        candidatesFound: allProfiles.length,
        candidatesEnriched: enrichedCount,
        candidatesAdded: addedCount,
      })
      .where(eq(sourcingCampaigns.id, campaignId));

  } catch (error) {
    console.error('Error running sourcing campaign:', error);
    
    // Mark campaign as failed
    await db.update(sourcingCampaigns)
      .set({ status: 'failed' })
      .where(eq(sourcingCampaigns.id, campaignId));
    
    throw error;
  }
}
