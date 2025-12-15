import { invokeLLM } from "../_core/llm";
import * as db from "../db";

// Types for AI assistant context
interface CandidateContext {
  userId: number;
  applications: any[];
  savedJobs: any[];
  profile: any;
}

interface RecruiterContext {
  userId: number;
  jobs: any[];
  applications: any[];
  interviews: any[];
  placements: any[];
}

// Build context summary for candidate
export async function buildCandidateContext(userId: number): Promise<string> {
  try {
    // Get candidate's applications
    const applications = await db.getApplicationsByCandidate(userId);
    
    // Get application statistics
    const stats = {
      total: applications.length,
      submitted: applications.filter((a: any) => a.status === 'submitted').length,
      reviewing: applications.filter((a: any) => a.status === 'reviewing').length,
      shortlisted: applications.filter((a: any) => a.status === 'shortlisted').length,
      interviewing: applications.filter((a: any) => a.status === 'interviewing').length,
      offered: applications.filter((a: any) => a.status === 'offered').length,
      rejected: applications.filter((a: any) => a.status === 'rejected').length,
      withdrawn: applications.filter((a: any) => a.status === 'withdrawn').length,
    };

    // Build context string
    let context = `## Candidate's Current Status\n\n`;
    context += `### Application Statistics\n`;
    context += `- Total Applications: ${stats.total}\n`;
    context += `- Submitted (pending review): ${stats.submitted}\n`;
    context += `- Under Review: ${stats.reviewing}\n`;
    context += `- Shortlisted: ${stats.shortlisted}\n`;
    context += `- In Interview Process: ${stats.interviewing}\n`;
    context += `- Offers Received: ${stats.offered}\n`;
    context += `- Rejected: ${stats.rejected}\n`;
    context += `- Withdrawn: ${stats.withdrawn}\n\n`;

    // Add recent applications details
    if (applications.length > 0) {
      context += `### Recent Applications\n`;
      const recentApps = applications.slice(0, 10);
      for (const app of recentApps) {
        context += `- **${(app as any).jobTitle || 'Unknown Job'}** at ${(app as any).companyName || 'Unknown Company'}\n`;
        context += `  Status: ${app.status}, Applied: ${new Date((app as any).createdAt || (app as any).appliedAt || Date.now()).toLocaleDateString()}\n`;
      }
    }

    return context;
  } catch (error) {
    console.error('Error building candidate context:', error);
    return 'Unable to load candidate data at this time.';
  }
}

// Build context summary for recruiter
export async function buildRecruiterContext(userId: number): Promise<string> {
  try {
    // Get recruiter's jobs
    const jobs = await db.getJobsByRecruiter(userId);
    
    // Get all applications for recruiter's jobs
    let allApplications: any[] = [];
    for (const job of jobs) {
      const apps = await db.getApplicationsByJob(job.id);
      allApplications = allApplications.concat(apps.map((a: any) => ({ ...a, jobTitle: job.title })));
    }

    // Calculate statistics
    const jobStats = {
      total: jobs.length,
      active: jobs.filter((j: any) => j.status === 'active').length,
      paused: jobs.filter((j: any) => j.status === 'paused').length,
      closed: jobs.filter((j: any) => j.status === 'closed').length,
    };

    const appStats = {
      total: allApplications.length,
      submitted: allApplications.filter((a: any) => a.status === 'submitted').length,
      reviewing: allApplications.filter((a: any) => a.status === 'reviewing').length,
      shortlisted: allApplications.filter((a: any) => a.status === 'shortlisted').length,
      interviewing: allApplications.filter((a: any) => a.status === 'interviewing').length,
      offered: allApplications.filter((a: any) => a.status === 'offered').length,
      rejected: allApplications.filter((a: any) => a.status === 'rejected').length,
    };

    // Build context string
    let context = `## Recruiter's Current Pipeline\n\n`;
    
    context += `### Job Postings\n`;
    context += `- Total Jobs: ${jobStats.total}\n`;
    context += `- Active: ${jobStats.active}\n`;
    context += `- Paused: ${jobStats.paused}\n`;
    context += `- Closed: ${jobStats.closed}\n\n`;

    context += `### Application Pipeline\n`;
    context += `- Total Applications: ${appStats.total}\n`;
    context += `- New/Submitted: ${appStats.submitted}\n`;
    context += `- Under Review: ${appStats.reviewing}\n`;
    context += `- Shortlisted: ${appStats.shortlisted}\n`;
    context += `- In Interviews: ${appStats.interviewing}\n`;
    context += `- Offers Extended: ${appStats.offered}\n`;
    context += `- Rejected: ${appStats.rejected}\n\n`;

    // Add job details
    if (jobs.length > 0) {
      context += `### Active Job Postings\n`;
      const activeJobs = jobs.filter((j: any) => j.status === 'active').slice(0, 10);
      for (const job of activeJobs) {
        const jobApps = allApplications.filter((a: any) => a.jobId === job.id);
        context += `- **${job.title}** (${job.location || 'Remote'})\n`;
        context += `  Applications: ${jobApps.length}, Posted: ${new Date(job.createdAt).toLocaleDateString()}\n`;
      }
    }

    return context;
  } catch (error) {
    console.error('Error building recruiter context:', error);
    return 'Unable to load recruiter data at this time.';
  }
}

// Candidate AI Career Coach
export async function candidateCareerCoach(
  userId: number,
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const context = await buildCandidateContext(userId);

  const systemPrompt = `You are an AI Career Coach for a job seeker on the HotGigs recruitment platform. You have access to their application data and can help them with:

1. **Application Status**: Answer questions about their applications, which jobs they applied to, current status, etc.
2. **Career Advice**: Provide guidance on job search strategies, resume improvement, interview preparation
3. **Rejection Analysis**: Help them understand why they might have been rejected and how to improve
4. **Offer Negotiation**: Advise on salary negotiation and evaluating job offers
5. **Interview Prep**: Help prepare for upcoming interviews based on the jobs they applied to

Here is the candidate's current data:

${context}

Be helpful, encouraging, and provide specific advice based on their actual application data. If they ask about specific applications or jobs, reference the data above. Keep responses concise but informative.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })),
    { role: 'user' as const, content: message }
  ];

  try {
    const response = await invokeLLM({ messages });
    const content = response.choices[0]?.message?.content;
    return typeof content === 'string' ? content : 'I apologize, but I was unable to generate a response. Please try again.';
  } catch (error) {
    console.error('Error in candidate career coach:', error);
    return 'I apologize, but I encountered an error. Please try again later.';
  }
}

// Recruiter AI Assistant
export async function recruiterAssistant(
  userId: number,
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const context = await buildRecruiterContext(userId);

  const systemPrompt = `You are an AI Recruiting Assistant for a recruiter on the HotGigs recruitment platform. You have access to their job postings and application pipeline data. You can help them with:

1. **Pipeline Overview**: Answer questions about their current applications, candidates in different stages
2. **Job Performance**: Provide insights on which jobs are getting more applications, conversion rates
3. **Candidate Analysis**: Help evaluate and compare candidates for specific positions
4. **Hiring Metrics**: Discuss time-to-hire, offer acceptance rates, rejection patterns
5. **Process Optimization**: Suggest improvements to their hiring process based on data
6. **Backout Analysis**: Help understand candidate dropoff and backout patterns

Here is the recruiter's current data:

${context}

Be professional, data-driven, and provide actionable insights. Reference specific numbers from their pipeline when answering questions. Keep responses concise but informative.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })),
    { role: 'user' as const, content: message }
  ];

  try {
    const response = await invokeLLM({ messages });
    const content = response.choices[0]?.message?.content;
    return typeof content === 'string' ? content : 'I apologize, but I was unable to generate a response. Please try again.';
  } catch (error) {
    console.error('Error in recruiter assistant:', error);
    return 'I apologize, but I encountered an error. Please try again later.';
  }
}
