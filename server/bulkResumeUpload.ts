import AdmZip from 'adm-zip';
import { extractResumeText, parseResumeWithAI } from './resumeParser';
import { checkForDuplicates, DeduplicationResult } from './resumeDeduplication';
import { storagePut } from './storage';
import * as db from './db';
import { rankCandidatesForJob } from './resumeRanking';

// Helper to generate random suffix for file keys
function randomSuffix() {
  return Math.random().toString(36).substring(2, 15);
}

export interface BulkUploadResult {
  totalFiles: number;
  successCount: number;
  failedCount: number;
  candidates: Array<{
    filename: string;
    success: boolean;
    candidateId?: number;
    error?: string;
    parsedData?: any;
    isDuplicate?: boolean;
    duplicateInfo?: {
      confidence: number;
      matchCount: number;
      recommendation: string;
      duplicates: any[];
    };
  }>;
}

export interface BulkUploadOptions {
  jobId?: number; // Optional: rank candidates against this job
  autoCreateProfiles?: boolean; // Auto-create candidate profiles
  userId: number; // User who uploaded
}

/**
 * Process a ZIP file containing multiple resumes
 * Extracts, parses, and optionally creates candidate profiles
 */
export async function processBulkResumeUpload(
  zipBuffer: Buffer,
  options: BulkUploadOptions
): Promise<BulkUploadResult> {
  const result: BulkUploadResult = {
    totalFiles: 0,
    successCount: 0,
    failedCount: 0,
    candidates: [],
  };

  try {
    // Extract ZIP file
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    // Filter for resume files (PDF, DOCX, DOC)
    const resumeFiles = zipEntries.filter((entry) => {
      const filename = entry.entryName.toLowerCase();
      return (
        !entry.isDirectory &&
        (filename.endsWith('.pdf') ||
          filename.endsWith('.docx') ||
          filename.endsWith('.doc')) &&
        !filename.startsWith('__MACOSX') && // Ignore Mac metadata
        !filename.startsWith('.') // Ignore hidden files
      );
    });

    result.totalFiles = resumeFiles.length;

    // Process each resume file
    for (const entry of resumeFiles) {
      const filename = entry.entryName.split('/').pop() || entry.entryName;
      const fileBuffer = entry.getData();

      try {
        // Upload resume to S3
        const fileKey = `bulk-uploads/${options.userId}-${Date.now()}-${randomSuffix()}/${filename}`;
        const { url: resumeUrl } = await storagePut(
          fileKey,
          fileBuffer,
          filename.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );

        // Extract text from resume
        const resumeText = await extractResumeText(fileBuffer, filename);

        // Parse resume with AI
        const parsedData = await parseResumeWithAI(resumeText);
        
        // Check for duplicates
        const dedupeResult = await checkForDuplicates(parsedData, options.userId);

        let candidateId: number | undefined;

        // Auto-create candidate profile if enabled
        if (options.autoCreateProfiles && parsedData) {
          try {
            // Get recruiter who uploaded
            const recruiter = await db.getRecruiterByUserId(options.userId);
            if (!recruiter) {
              throw new Error('Recruiter profile not found');
            }

            // Extract email from parsed data or generate placeholder
            const candidateEmail = parsedData.personalInfo?.email || `candidate-${Date.now()}-${randomSuffix()}@placeholder.com`;
            const candidateName = parsedData.personalInfo?.name || filename.replace(/\.[^/.]+$/, '');

            // Check if user exists with this email
            let user = await db.getUserByEmail(candidateEmail);
            let userId: number;

            if (user) {
              userId = user.id;
              // Check if candidate profile already exists
              const existingCandidate = await db.getCandidateByUserId(userId);
              if (existingCandidate) {
                // Skip this candidate
                result.candidates.push({
                  filename,
                  success: false,
                  error: 'Candidate profile already exists for this email',
                });
                result.failedCount++;
                continue;
              }
            } else {
              // Create new user
              const userResult = await db.createUser({
                email: candidateEmail,
                name: candidateName,
                role: 'candidate',
                emailVerified: false,
              });
              userId = userResult.insertId;
            }

            // Create new candidate profile
            const candidateResult = await db.createCandidate({
                userId,
                addedBy: recruiter.id,
                source: 'bulk-upload',
                phoneNumber: parsedData.personalInfo?.phone,
                location: parsedData.personalInfo?.location,
                resumeUrl,
                resumeFilename: filename,
                resumeUploadedAt: new Date(),
                skills: parsedData.skills ? parsedData.skills.join(', ') : undefined,
                experience: parsedData.experience ? JSON.stringify(parsedData.experience) : undefined,
                education: parsedData.education ? JSON.stringify(parsedData.education) : undefined,
                certifications: parsedData.certifications ? JSON.stringify(parsedData.certifications) : undefined,
                languages: parsedData.languages ? JSON.stringify(parsedData.languages) : undefined,
                projects: parsedData.projects ? JSON.stringify(parsedData.projects) : undefined,
                bio: parsedData.summary,
                linkedinUrl: parsedData.personalInfo?.linkedin,
                githubUrl: parsedData.personalInfo?.github,
                totalExperienceYears: parsedData.metadata?.totalExperienceYears,
                seniorityLevel: parsedData.metadata?.seniorityLevel,
                primaryDomain: parsedData.metadata?.primaryDomain,
                parsedResumeData: JSON.stringify(parsedData),
              });

            candidateId = candidateResult.insertId;
          } catch (createError) {
            console.error(`Failed to create/update candidate profile for ${filename}:`, createError);
            result.failedCount++;
            result.candidates.push({
              filename,
              success: false,
              error: createError instanceof Error ? createError.message : 'Failed to create candidate',
            });
            continue;
          }
        }

        result.successCount++;
        result.candidates.push({
          filename,
          success: true,
          candidateId,
          parsedData,
          isDuplicate: dedupeResult.isDuplicate,
          duplicateInfo: dedupeResult.isDuplicate ? {
            confidence: dedupeResult.confidence,
            matchCount: dedupeResult.duplicates.length,
            recommendation: dedupeResult.recommendation,
            duplicates: dedupeResult.duplicates,
          } : undefined,
        });
      } catch (error) {
        console.error(`Failed to process resume ${filename}:`, error);
        result.failedCount++;
        result.candidates.push({
          filename,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // If jobId provided, rank all successfully created candidates
    if (options.jobId && options.autoCreateProfiles) {
      try {
        await rankCandidatesForJob(options.jobId);
      } catch (rankError) {
        console.error('Failed to rank candidates:', rankError);
        // Don't fail the entire operation if ranking fails
      }
    }

    return result;
  } catch (error) {
    console.error('Failed to process bulk upload:', error);
    throw new Error(`Bulk upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate ZIP file before processing
 */
export function validateBulkUploadZip(zipBuffer: Buffer): {
  valid: boolean;
  error?: string;
  resumeCount?: number;
} {
  try {
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    const resumeFiles = zipEntries.filter((entry) => {
      const filename = entry.entryName.toLowerCase();
      return (
        !entry.isDirectory &&
        (filename.endsWith('.pdf') ||
          filename.endsWith('.docx') ||
          filename.endsWith('.doc')) &&
        !filename.startsWith('__MACOSX') &&
        !filename.startsWith('.')
      );
    });

    if (resumeFiles.length === 0) {
      return {
        valid: false,
        error: 'No resume files found in ZIP. Please include PDF or DOCX files.',
      };
    }

    if (resumeFiles.length > 100) {
      return {
        valid: false,
        error: 'Too many files. Maximum 100 resumes per upload.',
      };
    }

    return {
      valid: true,
      resumeCount: resumeFiles.length,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid ZIP file format',
    };
  }
}
