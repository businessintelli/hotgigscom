/**
 * Feedback PDF Generator
 * Generates formatted PDF reports for interview panel feedback
 */

import * as db from './db';
import { storagePut } from './storage';

function randomSuffix() {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Generate HTML content for the feedback PDF
 */
function generateFeedbackHTML(data: {
  interview: any;
  job: any;
  candidate: any;
  feedbackList: any[];
  summary: any;
}): string {
  const { interview, job, candidate, feedbackList, summary } = data;
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRatingStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'strong_hire': return '#22c55e';
      case 'hire': return '#84cc16';
      case 'no_hire': return '#f97316';
      case 'strong_no_hire': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRecommendationLabel = (rec: string) => {
    switch (rec) {
      case 'strong_hire': return 'Strong Hire';
      case 'hire': return 'Hire';
      case 'no_hire': return 'No Hire';
      case 'strong_no_hire': return 'Strong No Hire';
      default: return 'Not Specified';
    }
  };

  const feedbackRows = feedbackList.map(f => `
    <div class="feedback-card">
      <div class="panelist-header">
        <h3>${f.panelist?.name || f.panelist?.email || 'Anonymous'}</h3>
        <span class="role">${f.panelist?.role || 'Panel Member'}</span>
      </div>
      
      <div class="ratings-grid">
        <div class="rating-item">
          <span class="label">Technical Skills</span>
          <span class="stars">${getRatingStars(f.technicalSkills || 0)}</span>
        </div>
        <div class="rating-item">
          <span class="label">Communication</span>
          <span class="stars">${getRatingStars(f.communicationSkills || 0)}</span>
        </div>
        <div class="rating-item">
          <span class="label">Problem Solving</span>
          <span class="stars">${getRatingStars(f.problemSolving || 0)}</span>
        </div>
        <div class="rating-item">
          <span class="label">Culture Fit</span>
          <span class="stars">${getRatingStars(f.cultureFit || 0)}</span>
        </div>
        <div class="rating-item overall">
          <span class="label">Overall Rating</span>
          <span class="stars">${getRatingStars(f.overallRating || 0)}</span>
        </div>
      </div>
      
      <div class="recommendation" style="background-color: ${getRecommendationColor(f.recommendation)}20; border-left: 4px solid ${getRecommendationColor(f.recommendation)};">
        <strong>Recommendation:</strong> ${getRecommendationLabel(f.recommendation)}
      </div>
      
      ${f.strengths ? `
      <div class="feedback-section">
        <h4>Strengths</h4>
        <p>${f.strengths}</p>
      </div>
      ` : ''}
      
      ${f.weaknesses ? `
      <div class="feedback-section">
        <h4>Areas for Improvement</h4>
        <p>${f.weaknesses}</p>
      </div>
      ` : ''}
      
      ${f.notes ? `
      <div class="feedback-section">
        <h4>Additional Notes</h4>
        <p>${f.notes}</p>
      </div>
      ` : ''}
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Interview Feedback Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 40px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #667eea;
    }
    
    .header h1 {
      color: #667eea;
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header .subtitle {
      color: #666;
      font-size: 14px;
    }
    
    .info-section {
      display: flex;
      gap: 40px;
      margin-bottom: 30px;
    }
    
    .info-box {
      flex: 1;
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
    }
    
    .info-box h3 {
      color: #667eea;
      margin-bottom: 15px;
      font-size: 16px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 8px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 8px;
    }
    
    .info-row .label {
      color: #666;
      width: 120px;
      flex-shrink: 0;
    }
    
    .info-row .value {
      font-weight: 600;
    }
    
    .summary-section {
      background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .summary-section h2 {
      color: #667eea;
      margin-bottom: 20px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    
    .summary-item {
      text-align: center;
    }
    
    .summary-item .number {
      font-size: 32px;
      font-weight: 700;
      color: #667eea;
    }
    
    .summary-item .label {
      color: #666;
      font-size: 14px;
    }
    
    .consensus-badge {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 14px;
    }
    
    .consensus-positive {
      background: #22c55e20;
      color: #22c55e;
    }
    
    .consensus-negative {
      background: #ef444420;
      color: #ef4444;
    }
    
    .consensus-mixed {
      background: #f9731620;
      color: #f97316;
    }
    
    .feedback-section-title {
      color: #333;
      font-size: 20px;
      margin: 30px 0 20px 0;
      padding-bottom: 10px;
      border-bottom: 2px solid #eee;
    }
    
    .feedback-card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .panelist-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    
    .panelist-header h3 {
      color: #333;
      font-size: 18px;
    }
    
    .panelist-header .role {
      color: #666;
      font-size: 14px;
    }
    
    .ratings-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .rating-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    
    .rating-item.overall {
      grid-column: span 2;
      background: #667eea10;
    }
    
    .rating-item .label {
      color: #666;
    }
    
    .rating-item .stars {
      color: #fbbf24;
      letter-spacing: 2px;
    }
    
    .recommendation {
      padding: 12px 15px;
      border-radius: 4px;
      margin-bottom: 15px;
    }
    
    .feedback-section {
      margin-top: 15px;
    }
    
    .feedback-section h4 {
      color: #667eea;
      font-size: 14px;
      margin-bottom: 5px;
    }
    
    .feedback-section p {
      color: #555;
      font-size: 14px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .feedback-card {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 Interview Feedback Report</h1>
    <p class="subtitle">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
  
  <div class="info-section">
    <div class="info-box">
      <h3>👤 Candidate Information</h3>
      <div class="info-row">
        <span class="label">Name:</span>
        <span class="value">${candidate?.user?.name || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Email:</span>
        <span class="value">${candidate?.user?.email || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Title:</span>
        <span class="value">${candidate?.title || 'N/A'}</span>
      </div>
    </div>
    
    <div class="info-box">
      <h3>💼 Interview Details</h3>
      <div class="info-row">
        <span class="label">Position:</span>
        <span class="value">${job?.title || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Company:</span>
        <span class="value">${job?.companyName || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Date:</span>
        <span class="value">${interview?.scheduledAt ? formatDate(interview.scheduledAt) : 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Type:</span>
        <span class="value">${interview?.type || 'N/A'}</span>
      </div>
    </div>
  </div>
  
  ${summary ? `
  <div class="summary-section">
    <h2>📊 Feedback Summary</h2>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="number">${summary.totalResponses}</div>
        <div class="label">Panel Responses</div>
      </div>
      <div class="summary-item">
        <div class="number">${summary.averages?.overall?.toFixed(1) || 'N/A'}</div>
        <div class="label">Average Rating</div>
      </div>
      <div class="summary-item">
        <span class="consensus-badge consensus-${summary.consensus}">${summary.consensus}</span>
        <div class="label" style="margin-top: 5px;">Consensus</div>
      </div>
    </div>
    
    <div style="margin-top: 20px; display: flex; gap: 15px; justify-content: center;">
      <span style="color: #22c55e;">✓ Strong Hire: ${summary.recommendations?.strongHire || 0}</span>
      <span style="color: #84cc16;">✓ Hire: ${summary.recommendations?.hire || 0}</span>
      <span style="color: #f97316;">✗ No Hire: ${summary.recommendations?.noHire || 0}</span>
      <span style="color: #ef4444;">✗ Strong No Hire: ${summary.recommendations?.strongNoHire || 0}</span>
    </div>
  </div>
  ` : ''}
  
  <h2 class="feedback-section-title">Individual Panelist Feedback</h2>
  
  ${feedbackRows || '<p style="color: #666; text-align: center; padding: 40px;">No feedback submitted yet.</p>'}
  
  <div class="footer">
    <p>HotGigs - AI-Powered Recruitment Platform</p>
    <p>This report is confidential and intended for internal use only.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate PDF report for interview feedback
 */
export async function generateFeedbackPDFReport(interviewId: number): Promise<string> {
  // Get interview details
  const interviewData = await db.getInterviewById(interviewId);
  if (!interviewData) {
    throw new Error('Interview not found');
  }

  const interview = interviewData.interview;
  const job = await db.getJobById(interview.jobId);
  const candidate = await db.getCandidateById(interview.candidateId);
  
  // Get all panelist feedback
  const feedbackList = await db.getPanelistFeedbackForInterview(interviewId);
  
  // Calculate summary
  let summary = null;
  if (feedbackList.length > 0) {
    const avgTechnical = feedbackList.reduce((sum: number, f: any) => sum + (f.technicalSkills || 0), 0) / feedbackList.length;
    const avgCommunication = feedbackList.reduce((sum: number, f: any) => sum + (f.communicationSkills || 0), 0) / feedbackList.length;
    const avgProblemSolving = feedbackList.reduce((sum: number, f: any) => sum + (f.problemSolving || 0), 0) / feedbackList.length;
    const avgCultureFit = feedbackList.reduce((sum: number, f: any) => sum + (f.cultureFit || 0), 0) / feedbackList.length;
    const avgOverall = feedbackList.reduce((sum: number, f: any) => sum + (f.overallRating || 0), 0) / feedbackList.length;
    
    const recommendations = {
      strongHire: feedbackList.filter((f: any) => f.recommendation === 'strong_hire').length,
      hire: feedbackList.filter((f: any) => f.recommendation === 'hire').length,
      noHire: feedbackList.filter((f: any) => f.recommendation === 'no_hire').length,
      strongNoHire: feedbackList.filter((f: any) => f.recommendation === 'strong_no_hire').length,
    };
    
    const positiveCount = recommendations.strongHire + recommendations.hire;
    const negativeCount = recommendations.noHire + recommendations.strongNoHire;
    let consensus: 'positive' | 'negative' | 'mixed' = 'mixed';
    if (positiveCount > 0 && negativeCount === 0) consensus = 'positive';
    else if (negativeCount > 0 && positiveCount === 0) consensus = 'negative';
    
    summary = {
      totalResponses: feedbackList.length,
      averages: {
        technical: avgTechnical,
        communication: avgCommunication,
        problemSolving: avgProblemSolving,
        cultureFit: avgCultureFit,
        overall: avgOverall,
      },
      recommendations,
      consensus,
    };
  }
  
  // Generate HTML
  const html = generateFeedbackHTML({
    interview,
    job,
    candidate,
    feedbackList,
    summary,
  });
  
  // Convert HTML to PDF using a simple approach - store as HTML for now
  // In production, you'd use a library like puppeteer or wkhtmltopdf
  const htmlBuffer = Buffer.from(html, 'utf-8');
  const fileKey = `feedback-reports/interview-${interviewId}-${randomSuffix()}.html`;
  
  const { url } = await storagePut(fileKey, htmlBuffer, 'text/html');
  
  return url;
}
