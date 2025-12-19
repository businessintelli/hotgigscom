import * as XLSX from 'xlsx';
import { storagePut } from './storage';

// Helper to generate random suffix for file keys
function randomSuffix() {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Generate Excel template with all job fields and skill matrix sheet
 */
export async function generateJobTemplate(): Promise<{ url: string; key: string }> {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // ============================================
  // Sheet 1: Job Details
  // ============================================
  const jobHeaders = [
    'Title*',
    'Company Name',
    'Description*',
    'Requirements',
    'Responsibilities',
    'Location',
    'Employment Type',
    'Experience Level',
    'Salary Min',
    'Salary Max',
    'Salary Currency',
    'Customer ID',
    'Application Deadline',
    'Status',
    'Is Public',
    'Education Level',
    'Benefits',
    'Remote Policy',
    'Travel Requirement',
    'Security Clearance',
  ];

  const jobInstructions = [
    'Job title (required)',
    'Company name (optional)',
    'Full job description (required)',
    'Required qualifications and skills',
    'Job responsibilities and duties',
    'Job location (city, state, country)',
    'full-time, part-time, contract, internship',
    'entry, mid, senior, lead, executive',
    'Minimum salary (number only)',
    'Maximum salary (number only)',
    'USD, EUR, GBP, etc.',
    'Customer/Client ID (number, optional)',
    'Deadline date (YYYY-MM-DD format)',
    'draft, active, closed, filled',
    'true or false',
    'High School, Bachelor, Master, PhD, etc.',
    'Health insurance, 401k, PTO, etc.',
    'remote, hybrid, onsite',
    'None, Occasional, Frequent',
    'None, Secret, Top Secret, etc.',
  ];

  const jobExample = [
    'Senior Software Engineer',
    'TechCorp Inc',
    'We are seeking an experienced software engineer to join our team...',
    'Bachelor\'s degree in Computer Science, 5+ years experience',
    'Design and develop scalable applications, mentor junior developers',
    'San Francisco, CA',
    'full-time',
    'senior',
    '120000',
    '180000',
    'USD',
    '',
    '2025-03-31',
    'active',
    'true',
    'Bachelor',
    'Health, Dental, Vision, 401k, Unlimited PTO',
    'hybrid',
    'Occasional',
    'None',
  ];

  const jobData = [jobHeaders, jobInstructions, jobExample];
  const jobSheet = XLSX.utils.aoa_to_sheet(jobData);

  // Set column widths for better readability
  jobSheet['!cols'] = [
    { wch: 25 }, // Title
    { wch: 20 }, // Company Name
    { wch: 50 }, // Description
    { wch: 40 }, // Requirements
    { wch: 40 }, // Responsibilities
    { wch: 20 }, // Location
    { wch: 18 }, // Employment Type
    { wch: 18 }, // Experience Level
    { wch: 12 }, // Salary Min
    { wch: 12 }, // Salary Max
    { wch: 15 }, // Salary Currency
    { wch: 12 }, // Customer ID
    { wch: 18 }, // Application Deadline
    { wch: 12 }, // Status
    { wch: 10 }, // Is Public
    { wch: 18 }, // Education Level
    { wch: 40 }, // Benefits
    { wch: 15 }, // Remote Policy
    { wch: 18 }, // Travel Requirement
    { wch: 18 }, // Security Clearance
  ];

  XLSX.utils.book_append_sheet(workbook, jobSheet, 'Job Details');

  // ============================================
  // Sheet 2: Skill Matrix
  // ============================================
  const skillHeaders = [
    'Job Title*',
    'Skill Name*',
    'Is Mandatory*',
  ];

  const skillInstructions = [
    'Must match the Title from Job Details sheet',
    'Name of the skill (e.g., Python, React, Project Management)',
    'true or false (true = mandatory, false = preferred)',
  ];

  const skillExample1 = [
    'Senior Software Engineer',
    'Python',
    'true',
  ];

  const skillExample2 = [
    'Senior Software Engineer',
    'React',
    'true',
  ];

  const skillExample3 = [
    'Senior Software Engineer',
    'Docker',
    'false',
  ];

  const skillExample4 = [
    'Senior Software Engineer',
    'AWS',
    'false',
  ];

  const skillData = [
    skillHeaders,
    skillInstructions,
    skillExample1,
    skillExample2,
    skillExample3,
    skillExample4,
  ];

  const skillSheet = XLSX.utils.aoa_to_sheet(skillData);

  // Set column widths
  skillSheet['!cols'] = [
    { wch: 30 }, // Job Title
    { wch: 30 }, // Skill Name
    { wch: 15 }, // Is Mandatory
  ];

  XLSX.utils.book_append_sheet(workbook, skillSheet, 'Skill Matrix');

  // ============================================
  // Sheet 3: Instructions
  // ============================================
  const instructions = [
    ['HotGigs Bulk Job Import Template'],
    [''],
    ['Instructions:'],
    ['1. Fill in the "Job Details" sheet with your job information'],
    ['2. Fields marked with * are required'],
    ['3. Use the exact values shown for dropdown fields (Employment Type, Experience Level, Status, etc.)'],
    ['4. For dates, use YYYY-MM-DD format (e.g., 2025-03-31)'],
    ['5. For boolean fields (Is Public), use "true" or "false"'],
    ['6. Fill in the "Skill Matrix" sheet with required and preferred skills for each job'],
    ['7. The Job Title in Skill Matrix must exactly match the Title in Job Details'],
    ['8. You can add multiple rows for each job in the Skill Matrix sheet'],
    ['9. Set "Is Mandatory" to "true" for required skills and "false" for preferred skills'],
    ['10. Delete the example rows before uploading your data'],
    ['11. Save the file and upload it through the job creation interface'],
    [''],
    ['Valid Values:'],
    ['Employment Type: full-time, part-time, contract, internship'],
    ['Experience Level: entry, mid, senior, lead, executive'],
    ['Status: draft, active, closed, filled'],
    ['Remote Policy: remote, hybrid, onsite'],
    ['Travel Requirement: None, Occasional, Frequent'],
    [''],
    ['Notes:'],
    ['- You can create multiple jobs in one file by adding more rows to the Job Details sheet'],
    ['- Each job can have multiple skills in the Skill Matrix sheet'],
    ['- Customer ID should be a number if you want to associate the job with a specific customer'],
    ['- Leave optional fields empty if not needed'],
  ];

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
  instructionsSheet['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

  // Generate Excel file buffer
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  // Upload to S3
  const fileKey = `job-templates/bulk-import-template-${randomSuffix()}.xlsx`;
  const result = await storagePut(
    fileKey,
    excelBuffer,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );

  return result;
}

/**
 * Parse uploaded Excel file and extract job data with skill matrix
 */
export interface ParsedJob {
  title: string;
  companyName?: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  location?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  customerId?: number;
  applicationDeadline?: Date;
  status?: 'draft' | 'active' | 'closed' | 'filled';
  isPublic?: boolean;
  educationLevel?: string;
  benefits?: string;
  remotePolicy?: string;
  travelRequirement?: string;
  securityClearance?: string;
  skills: Array<{
    skillName: string;
    isMandatory: boolean;
  }>;
}

export interface ParseResult {
  success: boolean;
  jobs: ParsedJob[];
  errors: string[];
}

export async function parseJobExcel(fileBuffer: Buffer): Promise<ParseResult> {
  const errors: string[] = [];
  const jobs: ParsedJob[] = [];

  try {
    // Read the workbook
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    // Check if required sheets exist
    if (!workbook.SheetNames.includes('Job Details')) {
      errors.push('Missing required sheet: Job Details');
      return { success: false, jobs: [], errors };
    }

    // Parse Job Details sheet
    const jobSheet = workbook.Sheets['Job Details'];
    const jobData: any[][] = XLSX.utils.sheet_to_json(jobSheet, { header: 1 });

    if (jobData.length < 3) {
      errors.push('Job Details sheet must have at least 3 rows (header, instructions, and data)');
      return { success: false, jobs: [], errors };
    }

    // Get headers from first row
    const headers = jobData[0];
    
    // Parse job rows (skip header and instruction rows)
    const jobRows = jobData.slice(2).filter(row => row && row.length > 0 && row[0]);

    if (jobRows.length === 0) {
      errors.push('No job data found in Job Details sheet');
      return { success: false, jobs: [], errors };
    }

    // Parse Skill Matrix sheet if it exists
    let skillsByJob: Map<string, Array<{ skillName: string; isMandatory: boolean }>> = new Map();
    
    if (workbook.SheetNames.includes('Skill Matrix')) {
      const skillSheet = workbook.Sheets['Skill Matrix'];
      const skillData: any[][] = XLSX.utils.sheet_to_json(skillSheet, { header: 1 });

      if (skillData.length > 2) {
        const skillRows = skillData.slice(2).filter(row => row && row.length >= 3 && row[0]);

        for (const row of skillRows) {
          const jobTitle = String(row[0]).trim();
          const skillName = String(row[1]).trim();
          const isMandatory = String(row[2]).toLowerCase() === 'true';

          if (!skillsByJob.has(jobTitle)) {
            skillsByJob.set(jobTitle, []);
          }

          skillsByJob.get(jobTitle)!.push({ skillName, isMandatory });
        }
      }
    }

    // Process each job row
    for (let i = 0; i < jobRows.length; i++) {
      const row = jobRows[i];
      const rowNum = i + 3; // Account for header and instruction rows

      try {
        // Required fields
        const title = row[0] ? String(row[0]).trim() : '';
        const description = row[2] ? String(row[2]).trim() : '';

        if (!title) {
          errors.push(`Row ${rowNum}: Title is required`);
          continue;
        }

        if (!description) {
          errors.push(`Row ${rowNum}: Description is required`);
          continue;
        }

        // Parse employment type
        let employmentType: 'full-time' | 'part-time' | 'contract' | 'internship' | undefined;
        if (row[6]) {
          const empType = String(row[6]).toLowerCase().trim();
          if (['full-time', 'part-time', 'contract', 'internship'].includes(empType)) {
            employmentType = empType as any;
          } else {
            errors.push(`Row ${rowNum}: Invalid employment type "${row[6]}". Must be: full-time, part-time, contract, or internship`);
          }
        }

        // Parse experience level
        let experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive' | undefined;
        if (row[7]) {
          const expLevel = String(row[7]).toLowerCase().trim();
          if (['entry', 'mid', 'senior', 'lead', 'executive'].includes(expLevel)) {
            experienceLevel = expLevel as any;
          } else {
            errors.push(`Row ${rowNum}: Invalid experience level "${row[7]}". Must be: entry, mid, senior, lead, or executive`);
          }
        }

        // Parse salary
        let salaryMin: number | undefined;
        let salaryMax: number | undefined;
        if (row[8]) {
          const parsed = parseFloat(String(row[8]));
          if (!isNaN(parsed)) {
            salaryMin = parsed;
          }
        }
        if (row[9]) {
          const parsed = parseFloat(String(row[9]));
          if (!isNaN(parsed)) {
            salaryMax = parsed;
          }
        }

        // Parse customer ID
        let customerId: number | undefined;
        if (row[11]) {
          const parsed = parseInt(String(row[11]));
          if (!isNaN(parsed)) {
            customerId = parsed;
          }
        }

        // Parse application deadline
        let applicationDeadline: Date | undefined;
        if (row[12]) {
          const dateStr = String(row[12]).trim();
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            applicationDeadline = parsed;
          } else {
            errors.push(`Row ${rowNum}: Invalid date format for application deadline. Use YYYY-MM-DD format`);
          }
        }

        // Parse status
        let status: 'draft' | 'active' | 'closed' | 'filled' | undefined;
        if (row[13]) {
          const statusVal = String(row[13]).toLowerCase().trim();
          if (['draft', 'active', 'closed', 'filled'].includes(statusVal)) {
            status = statusVal as any;
          } else {
            errors.push(`Row ${rowNum}: Invalid status "${row[13]}". Must be: draft, active, closed, or filled`);
          }
        }

        // Parse isPublic
        let isPublic: boolean | undefined;
        if (row[14]) {
          const val = String(row[14]).toLowerCase().trim();
          isPublic = val === 'true';
        }

        // Get skills for this job
        const skills = skillsByJob.get(title) || [];

        const job: ParsedJob = {
          title,
          companyName: row[1] ? String(row[1]).trim() : undefined,
          description,
          requirements: row[3] ? String(row[3]).trim() : undefined,
          responsibilities: row[4] ? String(row[4]).trim() : undefined,
          location: row[5] ? String(row[5]).trim() : undefined,
          employmentType,
          experienceLevel,
          salaryMin,
          salaryMax,
          salaryCurrency: row[10] ? String(row[10]).trim() : undefined,
          customerId,
          applicationDeadline,
          status,
          isPublic,
          educationLevel: row[15] ? String(row[15]).trim() : undefined,
          benefits: row[16] ? String(row[16]).trim() : undefined,
          remotePolicy: row[17] ? String(row[17]).trim() : undefined,
          travelRequirement: row[18] ? String(row[18]).trim() : undefined,
          securityClearance: row[19] ? String(row[19]).trim() : undefined,
          skills,
        };

        jobs.push(job);
      } catch (error) {
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0 && jobs.length > 0,
      jobs,
      errors,
    };
  } catch (error) {
    errors.push(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, jobs: [], errors };
  }
}
