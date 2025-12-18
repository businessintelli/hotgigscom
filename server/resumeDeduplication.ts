import * as db from './db';

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching of names and emails
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-100)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 100;
  
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(s1, s2);
  return Math.round(((maxLen - distance) / maxLen) * 100);
}

/**
 * Normalize phone number for comparison
 */
function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, ''); // Remove all non-digit characters
}

/**
 * Normalize email for comparison
 */
function normalizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

/**
 * Normalize name for comparison
 */
function normalizeName(name: string | null | undefined): string {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

export interface DuplicateCandidate {
  candidateId: number;
  userId: number;
  email: string | null;
  phoneNumber: string | null;
  location: string | null;
  resumeUrl: string | null;
  matchScore: number;
  matchReasons: string[];
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  confidence: number; // 0-100
  duplicates: DuplicateCandidate[];
  recommendation: 'merge' | 'skip' | 'create_new';
}

/**
 * Check if a candidate is a duplicate based on parsed resume data
 */
export async function checkForDuplicates(
  parsedData: {
    personalInfo?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  },
  userId: number
): Promise<DeduplicationResult> {
  const result: DeduplicationResult = {
    isDuplicate: false,
    confidence: 0,
    duplicates: [],
    recommendation: 'create_new',
  };

  const email = parsedData.personalInfo?.email;
  const phone = parsedData.personalInfo?.phone;
  const name = parsedData.personalInfo?.name;

  if (!email && !phone && !name) {
    return result; // No identifying information to check
  }

  // Get all candidates for this user
  const allCandidates = await db.getCandidateByUserId(userId);
  const candidatesArray = allCandidates ? [allCandidates] : [];

  if (candidatesArray.length === 0) {
    return result;
  }

  // Check each candidate for potential duplicates
  for (const candidate of candidatesArray) {
    const matchReasons: string[] = [];
    let matchScore = 0;

    // Email exact match (highest priority)
    if (email && candidate.email) {
      const normalizedEmail1 = normalizeEmail(email);
      const normalizedEmail2 = normalizeEmail(candidate.email);
      
      if (normalizedEmail1 === normalizedEmail2) {
        matchScore += 50;
        matchReasons.push('Exact email match');
      }
    }

    // Phone exact match
    if (phone && candidate.phoneNumber) {
      const normalizedPhone1 = normalizePhone(phone);
      const normalizedPhone2 = normalizePhone(candidate.phoneNumber);
      
      if (normalizedPhone1 && normalizedPhone2 && normalizedPhone1 === normalizedPhone2) {
        matchScore += 30;
        matchReasons.push('Exact phone match');
      }
    }

    // Name fuzzy match
    if (name) {
      // Try to extract name from candidate's user record or other fields
      // For now, we'll skip name matching as candidates table doesn't have a name field
      // This can be enhanced by joining with users table
    }

    // If we found a match, add to duplicates
    if (matchScore >= 30) {
      result.duplicates.push({
        candidateId: candidate.id,
        userId: candidate.userId,
        email: candidate.email || null,
        phoneNumber: candidate.phoneNumber,
        location: candidate.location,
        resumeUrl: candidate.resumeUrl,
        matchScore,
        matchReasons,
      });
    }
  }

  // Determine if duplicate and recommendation
  if (result.duplicates.length > 0) {
    result.isDuplicate = true;
    
    // Calculate overall confidence (use highest match score)
    result.confidence = Math.max(...result.duplicates.map(d => d.matchScore));
    
    // Make recommendation based on confidence
    if (result.confidence >= 80) {
      result.recommendation = 'skip'; // Very likely duplicate, skip
    } else if (result.confidence >= 50) {
      result.recommendation = 'merge'; // Likely duplicate, suggest merge
    } else {
      result.recommendation = 'create_new'; // Low confidence, create new
    }
  }

  return result;
}

/**
 * Batch check for duplicates across multiple parsed resumes
 */
export async function batchCheckForDuplicates(
  parsedResumes: Array<{
    filename: string;
    parsedData: any;
  }>,
  userId: number
): Promise<Map<string, DeduplicationResult>> {
  const results = new Map<string, DeduplicationResult>();

  for (const resume of parsedResumes) {
    const dedupeResult = await checkForDuplicates(resume.parsedData, userId);
    results.set(resume.filename, dedupeResult);
  }

  return results;
}

/**
 * Merge duplicate candidate profiles
 */
export async function mergeCandidates(
  primaryCandidateId: number,
  duplicateCandidateId: number
): Promise<void> {
  // Get both candidates
  const primary = await db.getCandidateById(primaryCandidateId);
  const duplicate = await db.getCandidateById(duplicateCandidateId);

  if (!primary || !duplicate) {
    throw new Error('Candidate not found');
  }

  // Merge data (prefer non-null values from duplicate if primary is null)
  const mergedData: any = {
    phoneNumber: primary.phoneNumber || duplicate.phoneNumber,
    location: primary.location || duplicate.location,
    bio: primary.bio || duplicate.bio,
    skills: primary.skills || duplicate.skills,
    experience: primary.experience || duplicate.experience,
    education: primary.education || duplicate.education,
    linkedinUrl: primary.linkedinUrl || duplicate.linkedinUrl,
    githubUrl: primary.githubUrl || duplicate.githubUrl,
    certifications: primary.certifications || duplicate.certifications,
    languages: primary.languages || duplicate.languages,
    projects: primary.projects || duplicate.projects,
    totalExperienceYears: primary.totalExperienceYears || duplicate.totalExperienceYears,
    seniorityLevel: primary.seniorityLevel || duplicate.seniorityLevel,
    primaryDomain: primary.primaryDomain || duplicate.primaryDomain,
    skillCategories: primary.skillCategories || duplicate.skillCategories,
  };

  // Update primary candidate with merged data
  await db.updateCandidate(primaryCandidateId, mergedData);

  // TODO: Transfer applications, interviews, etc. from duplicate to primary
  // For now, we'll just mark the duplicate as merged (we don't have a delete function yet)
  // await db.deleteCandidate(duplicateCandidateId);
}
