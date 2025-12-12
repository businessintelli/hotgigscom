import ExcelJS from 'exceljs';
import * as db from './db';

export interface ExportOptions {
  jobId?: number;
  candidateIds?: number[];
  includeRankings?: boolean;
  includeSkills?: boolean;
  includeExperience?: boolean;
  includeEducation?: boolean;
}

/**
 * Export candidates to Excel format with parsed resume data
 */
export async function exportCandidatesToExcel(
  options: ExportOptions
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Candidates');

  // Define columns
  const columns: any[] = [
    { header: 'Candidate ID', key: 'id', width: 12 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'Location', key: 'location', width: 25 },
    { header: 'Seniority Level', key: 'seniorityLevel', width: 18 },
    { header: 'Primary Domain', key: 'primaryDomain', width: 20 },
  ];

  if (options.includeRankings) {
    columns.push(
      { header: 'Overall Score', key: 'overallScore', width: 15 },
      { header: 'Skill Match %', key: 'skillMatchScore', width: 15 },
      { header: 'Experience Score', key: 'experienceScore', width: 18 },
      { header: 'Education Score', key: 'educationScore', width: 18 }
    );
  }

  if (options.includeSkills) {
    columns.push({ header: 'Top Skills', key: 'skills', width: 50 });
  }

  if (options.includeExperience) {
    columns.push(
      { header: 'Years of Experience', key: 'yearsOfExperience', width: 20 },
      { header: 'Recent Position', key: 'recentPosition', width: 30 },
      { header: 'Recent Company', key: 'recentCompany', width: 30 }
    );
  }

  if (options.includeEducation) {
    columns.push(
      { header: 'Highest Degree', key: 'highestDegree', width: 20 },
      { header: 'Institution', key: 'institution', width: 35 }
    );
  }

  columns.push(
    { header: 'Resume URL', key: 'resumeUrl', width: 50 },
    { header: 'Created At', key: 'createdAt', width: 20 }
  );

  worksheet.columns = columns;

  // Style header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }, // Indigo
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 25;

  // Fetch candidates
  let candidates: any[] = [];
  
  if (options.candidateIds && options.candidateIds.length > 0) {
    // Fetch specific candidates
    candidates = await Promise.all(
      options.candidateIds.map((id: number) => db.getCandidateById(id))
    );
    candidates = candidates.filter(c => c !== null);
  } else if (options.jobId) {
    // Fetch candidates who applied to this job
    const applications = await db.getApplicationsByJob(options.jobId);
    const candidateIds = applications.map((app: any) => app.candidateId);
    candidates = await Promise.all(
      candidateIds.map((id: number) => db.getCandidateById(id))
    );
    candidates = candidates.filter(c => c !== null);
  }

  // Add candidate data rows
  for (const candidate of candidates) {
    let parsedData: any = {};
    try {
      if (candidate.parsedResumeData) {
        parsedData = JSON.parse(candidate.parsedResumeData);
      }
    } catch (e) {
      console.error('Failed to parse resume data:', e);
    }

    const row: any = {
      id: candidate.id,
      name: parsedData.personalInfo?.name || 'N/A',
      email: parsedData.personalInfo?.email || 'N/A',
      phone: candidate.phoneNumber || parsedData.personalInfo?.phone || 'N/A',
      location: candidate.location || parsedData.personalInfo?.location || 'N/A',
      seniorityLevel: candidate.seniorityLevel || 'N/A',
      primaryDomain: candidate.primaryDomain || 'N/A',
    };

    if (options.includeRankings && options.jobId) {
      // TODO: Fetch ranking data from rankings table
      row.overallScore = 'N/A';
      row.skillMatchScore = 'N/A';
      row.experienceScore = 'N/A';
      row.educationScore = 'N/A';
    }

    if (options.includeSkills && parsedData.skills) {
      row.skills = parsedData.skills.slice(0, 10).join(', ');
    }

    if (options.includeExperience && parsedData.experience && parsedData.experience.length > 0) {
      const recentExp = parsedData.experience[0];
      row.yearsOfExperience = parsedData.metadata?.yearsOfExperience || 'N/A';
      row.recentPosition = recentExp.title || 'N/A';
      row.recentCompany = recentExp.company || 'N/A';
    }

    if (options.includeEducation && parsedData.education && parsedData.education.length > 0) {
      const highestEd = parsedData.education[0];
      row.highestDegree = highestEd.degree || 'N/A';
      row.institution = highestEd.institution || 'N/A';
    }

    row.resumeUrl = candidate.resumeUrl || 'N/A';
    row.createdAt = candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : 'N/A';

    worksheet.addRow(row);
  }

  // Auto-filter
  worksheet.autoFilter = {
    from: 'A1',
    to: String.fromCharCode(64 + columns.length) + '1',
  };

  // Freeze header row
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Export candidates to CSV format
 */
export async function exportCandidatesToCSV(
  options: ExportOptions
): Promise<string> {
  // Fetch candidates (same logic as Excel export)
  let candidates: any[] = [];
  
  if (options.candidateIds && options.candidateIds.length > 0) {
    candidates = await Promise.all(
      options.candidateIds.map((id: number) => db.getCandidateById(id))
    );
    candidates = candidates.filter(c => c !== null);
  } else if (options.jobId) {
    const applications = await db.getApplicationsByJob(options.jobId);
    const candidateIds = applications.map((app: any) => app.candidateId);
    candidates = await Promise.all(
      candidateIds.map((id: number) => db.getCandidateById(id))
    );
    candidates = candidates.filter(c => c !== null);
  }

  // Build CSV header
  const headers = [
    'Candidate ID',
    'Name',
    'Email',
    'Phone',
    'Location',
    'Seniority Level',
    'Primary Domain',
  ];

  if (options.includeRankings) {
    headers.push('Overall Score', 'Skill Match %', 'Experience Score', 'Education Score');
  }

  if (options.includeSkills) {
    headers.push('Top Skills');
  }

  if (options.includeExperience) {
    headers.push('Years of Experience', 'Recent Position', 'Recent Company');
  }

  if (options.includeEducation) {
    headers.push('Highest Degree', 'Institution');
  }

  headers.push('Resume URL', 'Created At');

  // Build CSV rows
  const rows: string[][] = [headers];

  for (const candidate of candidates) {
    let parsedData: any = {};
    try {
      if (candidate.parsedResumeData) {
        parsedData = JSON.parse(candidate.parsedResumeData);
      }
    } catch (e) {
      console.error('Failed to parse resume data:', e);
    }

    const row: string[] = [
      candidate.id.toString(),
      parsedData.personalInfo?.name || 'N/A',
      parsedData.personalInfo?.email || 'N/A',
      candidate.phoneNumber || parsedData.personalInfo?.phone || 'N/A',
      candidate.location || parsedData.personalInfo?.location || 'N/A',
      candidate.seniorityLevel || 'N/A',
      candidate.primaryDomain || 'N/A',
    ];

    if (options.includeRankings) {
      row.push('N/A', 'N/A', 'N/A', 'N/A');
    }

    if (options.includeSkills && parsedData.skills) {
      row.push(parsedData.skills.slice(0, 10).join('; '));
    }

    if (options.includeExperience && parsedData.experience && parsedData.experience.length > 0) {
      const recentExp = parsedData.experience[0];
      row.push(
        parsedData.metadata?.yearsOfExperience?.toString() || 'N/A',
        recentExp.title || 'N/A',
        recentExp.company || 'N/A'
      );
    }

    if (options.includeEducation && parsedData.education && parsedData.education.length > 0) {
      const highestEd = parsedData.education[0];
      row.push(highestEd.degree || 'N/A', highestEd.institution || 'N/A');
    }

    row.push(
      candidate.resumeUrl || 'N/A',
      candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : 'N/A'
    );

    rows.push(row);
  }

  // Convert to CSV string
  return rows
    .map(row =>
      row
        .map(cell => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(',')
    )
    .join('\n');
}
