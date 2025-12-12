import { Recruiter, Candidate } from "../drizzle/schema";

/**
 * Calculate profile completion percentage for recruiter
 */
export function calculateRecruiterCompletion(recruiter: Recruiter): number {
  if (recruiter.profileCompleted) {
    return 100;
  }

  const fields = [
    recruiter.companyName,
    recruiter.phoneNumber,
    recruiter.bio,
  ];

  const filledFields = fields.filter(field => field && field.trim().length > 0).length;
  const totalFields = fields.length;

  return Math.round((filledFields / totalFields) * 100);
}

/**
 * Calculate profile completion percentage for candidate
 */
export function calculateCandidateCompletion(candidate: Candidate): number {
  if (candidate.profileCompleted) {
    return 100;
  }

  const fields = [
    candidate.title,
    candidate.phoneNumber,
    candidate.location,
    candidate.skills,
    candidate.experience,
    candidate.bio,
    candidate.availability,
    candidate.expectedSalaryMin ? String(candidate.expectedSalaryMin) : null,
    candidate.resumeUrl,
  ];

  const filledFields = fields.filter(field => field && String(field).trim().length > 0).length;
  const totalFields = fields.length;

  return Math.round((filledFields / totalFields) * 100);
}
