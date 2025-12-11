import * as db from "./db";

interface FraudReportData {
  interview: any;
  candidate: any;
  job: any;
  fraudEvents: any[];
  fraudScore: {
    score: number;
    riskLevel: 'low' | 'medium' | 'high';
    eventCounts: Record<string, number>;
  };
}

export async function generateFraudDetectionReport(interviewId: number): Promise<string> {
  // Fetch all required data
  const interview = await db.getInterviewById(interviewId);
  if (!interview) throw new Error("Interview not found");
  
  const candidate = await db.getCandidateById(interview.interview.candidateId);
  const job = await db.getJobById(interview.interview.jobId);
  const fraudEvents = await db.getFraudEventsByInterview(interviewId);
  const fraudScore = await db.calculateFraudScore(interviewId);
  
  const data: FraudReportData = {
    interview,
    candidate,
    job,
    fraudEvents,
    fraudScore,
  };
  
  return generateFraudHTML(data);
}

function generateFraudHTML(data: FraudReportData): string {
  const { interview, candidate, job, fraudEvents, fraudScore } = data;
  
  const riskColor = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  }[fraudScore.riskLevel];
  
  const eventTypeLabels: Record<string, string> = {
    no_face_detected: 'No Face Detected',
    multiple_faces_detected: 'Multiple Faces Detected',
    tab_switch: 'Tab Switch',
    window_blur: 'Window Lost Focus',
    audio_anomaly: 'Audio Anomaly',
    suspicious_behavior: 'Suspicious Behavior',
  };
  
  const eventsList = fraudEvents.map(event => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        ${new Date(event.timestamp).toLocaleString()}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        ${eventTypeLabels[event.eventType] || event.eventType}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <span style="padding: 4px 8px; border-radius: 4px; background: ${
          event.severity === 'high' ? '#fee2e2' : 
          event.severity === 'medium' ? '#fef3c7' : '#dcfce7'
        }; color: ${
          event.severity === 'high' ? '#991b1b' : 
          event.severity === 'medium' ? '#92400e' : '#166534'
        };">
          ${event.severity.toUpperCase()}
        </span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        ${event.description || '-'}
      </td>
    </tr>
  `).join('');
  
  const eventCountsHTML = Object.entries(fraudScore.eventCounts).map(([type, count]) => `
    <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 500;">${eventTypeLabels[type] || type}</span>
        <span style="background: #6366f1; color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold;">
          ${count}
        </span>
      </div>
    </div>
  `).join('');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>HotGigs Fraud Detection Report</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      background: #fff;
      color: #333;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 20px auto;
      background: #fff;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      color: #fff;
      text-align: center;
      padding: 40px 20px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 2em;
    }
    .risk-score {
      background: ${riskColor};
      color: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      margin-bottom: 30px;
    }
    .risk-score h2 {
      margin: 0;
      font-size: 3em;
    }
    .risk-score p {
      margin: 10px 0 0 0;
      font-size: 1.2em;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #1f2937;
      border-left: 5px solid #6366f1;
      padding-left: 15px;
      margin-bottom: 20px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .info-item {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
    }
    .info-item label {
      font-weight: bold;
      color: #6b7280;
      display: block;
      margin-bottom: 5px;
      font-size: 0.9em;
    }
    .info-item value {
      color: #1f2937;
      font-size: 1.1em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }
    th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 Fraud Detection Report</h1>
      <p>AI-Powered Interview Monitoring</p>
    </div>
    
    <div class="risk-score">
      <h2>${fraudScore.score}/100</h2>
      <p>${fraudScore.riskLevel} Risk</p>
    </div>
    
    <div class="section">
      <h2>Interview Details</h2>
      <div class="info-grid">
        <div class="info-item">
          <label>Candidate Name</label>
          <value>${candidate?.title || 'N/A'}</value>
        </div>
        <div class="info-item">
          <label>Job Position</label>
          <value>${job?.title || 'N/A'}</value>
        </div>
        <div class="info-item">
          <label>Interview Date</label>
          <value>${new Date(interview.scheduledAt).toLocaleDateString()}</value>
        </div>
        <div class="info-item">
          <label>Interview Status</label>
          <value>${interview.status.toUpperCase()}</value>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>Event Summary</h2>
      ${eventCountsHTML || '<p>No fraud events detected</p>'}
    </div>
    
    <div class="section">
      <h2>Event Timeline</h2>
      ${fraudEvents.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event Type</th>
              <th>Severity</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${eventsList}
          </tbody>
        </table>
      ` : '<p>No fraud events detected during this interview.</p>'}
    </div>
    
    <div class="footer">
      <p>Generated by HotGigs AI Interview Platform</p>
      <p>Report generated on ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
  `;
}

interface InterviewReportData {
  interview: any;
  candidate: any;
  job: any;
  questions: any[];
  responses: any[];
}

export async function generateInterviewEvaluationReport(interviewId: number): Promise<string> {
  const interview = await db.getInterviewById(interviewId);
  if (!interview) throw new Error("Interview not found");
  
  const candidate = await db.getCandidateById(interview.interview.candidateId);
  const job = await db.getJobById(interview.interview.jobId);
  const questions = await db.getInterviewQuestions(interviewId);
  const responses = await db.getInterviewResponses(interviewId);
  
  const data: InterviewReportData = {
    interview,
    candidate,
    job,
    questions,
    responses,
  };
  
  return generateInterviewHTML(data);
}

function generateInterviewHTML(data: InterviewReportData): string {
  const { interview, candidate, job, questions, responses } = data;
  
  const avgScore = responses.length > 0
    ? Math.round(responses.reduce((sum, r) => sum + (r.aiScore || 0), 0) / responses.length)
    : 0;
  
  const scoreColor = avgScore >= 80 ? '#10b981' : avgScore >= 60 ? '#f59e0b' : '#ef4444';
  
  const responsesHTML = responses.map((response, index) => {
    const question = questions.find(q => q.id === response.questionId);
    return `
      <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #6366f1;">
        <h3 style="margin-top: 0; color: #1f2937;">Question ${index + 1}</h3>
        <p style="font-weight: 500; color: #374151;">${question?.questionText || 'N/A'}</p>
        
        <div style="margin: 15px 0;">
          <label style="font-weight: bold; color: #6b7280; display: block; margin-bottom: 5px;">Response Transcript:</label>
          <p style="background: white; padding: 15px; border-radius: 8px; color: #1f2937;">
            ${response.transcription || 'No transcription available'}
          </p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
          <div>
            <label style="font-weight: bold; color: #6b7280; display: block; margin-bottom: 5px;">AI Score:</label>
            <span style="background: ${scoreColor}; color: white; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 1.2em;">
              ${response.aiScore || 0}/100
            </span>
          </div>
          <div>
            <label style="font-weight: bold; color: #6b7280; display: block; margin-bottom: 5px;">Duration:</label>
            <span>${response.duration || 0}s</span>
          </div>
        </div>
        
        ${response.strengths ? `
          <div style="margin-top: 15px;">
            <label style="font-weight: bold; color: #10b981; display: block; margin-bottom: 5px;">✓ Strengths:</label>
            <p style="color: #374151;">${response.strengths}</p>
          </div>
        ` : ''}
        
        ${response.weaknesses ? `
          <div style="margin-top: 15px;">
            <label style="font-weight: bold; color: #ef4444; display: block; margin-bottom: 5px;">✗ Areas for Improvement:</label>
            <p style="color: #374151;">${response.weaknesses}</p>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>HotGigs Interview Evaluation Report</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      background: #fff;
      color: #333;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 20px auto;
      background: #fff;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      color: #fff;
      text-align: center;
      padding: 40px 20px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 2em;
    }
    .score-box {
      background: ${scoreColor};
      color: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      margin-bottom: 30px;
    }
    .score-box h2 {
      margin: 0;
      font-size: 3em;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #1f2937;
      border-left: 5px solid #6366f1;
      padding-left: 15px;
      margin-bottom: 20px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .info-item {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
    }
    .info-item label {
      font-weight: bold;
      color: #6b7280;
      display: block;
      margin-bottom: 5px;
      font-size: 0.9em;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Interview Evaluation Report</h1>
      <p>AI-Powered Assessment Results</p>
    </div>
    
    <div class="score-box">
      <h2>${avgScore}/100</h2>
      <p>Overall Interview Score</p>
    </div>
    
    <div class="section">
      <h2>Candidate Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <label>Candidate Name</label>
          <value>${candidate?.title || 'N/A'}</value>
        </div>
        <div class="info-item">
          <label>Job Position</label>
          <value>${job?.title || 'N/A'}</value>
        </div>
        <div class="info-item">
          <label>Interview Date</label>
          <value>${new Date(interview.scheduledAt).toLocaleDateString()}</value>
        </div>
        <div class="info-item">
          <label>Total Questions</label>
          <value>${questions.length}</value>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>Question-by-Question Analysis</h2>
      ${responsesHTML || '<p>No responses recorded</p>'}
    </div>
    
    <div class="footer">
      <p>Generated by HotGigs AI Interview Platform</p>
      <p>Report generated on ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
  `;
}
