/**
 * Application Status Notification Service
 * Handles sending enhanced email notifications when application status changes
 */

import { notifyOwner } from "./_core/notification";
import { getStatusEmailTemplate } from "./applicationStatusEmails";
import * as db from "./db";

interface StatusChangeParams {
  applicationId: number;
  oldStatus: string;
  newStatus: string;
  feedback?: string;
  interviewDate?: Date;
  interviewType?: string;
  interviewLink?: string;
  interviewLocation?: string;
  duration?: number;
}

/**
 * Send enhanced email notification for application status change
 */
export async function sendApplicationStatusNotification(params: StatusChangeParams): Promise<boolean> {
  const { applicationId, newStatus, feedback, interviewDate, interviewType, interviewLink, interviewLocation, duration } = params;
  
  try {
    // Get application details
    const application = await db.getApplicationById(applicationId);
    if (!application) {
      console.error(`[StatusNotifier] Application ${applicationId} not found`);
      return false;
    }
    
    // Get candidate and job details
    const candidate = await db.getCandidateById(application.candidateId);
    const job = await db.getJobById(application.jobId);
    
    if (!candidate || !job) {
      console.error(`[StatusNotifier] Candidate or job not found for application ${applicationId}`);
      return false;
    }
    
    // Get user email
    const user = await db.getUserById(candidate.userId);
    if (!user?.email) {
      console.error(`[StatusNotifier] User email not found for candidate ${candidate.id}`);
      return false;
    }
    
    // Generate email content based on status
    const { subject, html } = getStatusEmailTemplate(newStatus, {
      candidateName: user.name || "Candidate",
      candidateEmail: user.email,
      jobTitle: job.title,
      companyName: job.companyName || "Company",
      applicationId,
      feedback,
      interviewDate,
      interviewType,
      interviewLink,
      interviewLocation,
      duration,
    });
    
    // Send email via notification system
    const success = await notifyOwner({
      title: `Email to ${user.email}: ${subject}`,
      content: html,
    });
    
    if (success) {
      console.log(`[StatusNotifier] Sent ${newStatus} email to ${user.email} for application ${applicationId}`);
    }
    
    return success;
  } catch (error) {
    console.error(`[StatusNotifier] Error sending notification:`, error);
    return false;
  }
}

/**
 * Get status-specific notification message for in-app notifications
 */
export function getStatusNotificationMessage(status: string, jobTitle: string): { title: string; message: string } {
  switch (status) {
    case 'pending':
    case 'submitted':
      return {
        title: '✅ Application Received',
        message: `Your application for ${jobTitle} has been successfully submitted!`,
      };
    case 'reviewing':
    case 'screening':
      return {
        title: '👀 Application Under Review',
        message: `Great news! The hiring team is reviewing your application for ${jobTitle}.`,
      };
    case 'shortlisted':
      return {
        title: '⭐ You\'ve Been Shortlisted!',
        message: `Congratulations! You've been shortlisted for the ${jobTitle} position.`,
      };
    case 'interview_scheduled':
    case 'interviewing':
      return {
        title: '📅 Interview Scheduled',
        message: `You have an interview scheduled for ${jobTitle}. Check your email for details!`,
      };
    case 'interview_completed':
      return {
        title: '✨ Interview Completed',
        message: `Thank you for completing your interview for ${jobTitle}. We'll be in touch soon!`,
      };
    case 'offered':
      return {
        title: '🎉 Congratulations! Job Offer',
        message: `Amazing news! You've received an offer for the ${jobTitle} position!`,
      };
    case 'rejected':
    case 'not_selected':
      return {
        title: '📝 Application Update',
        message: `Thank you for your interest in ${jobTitle}. The position has been filled.`,
      };
    case 'withdrawn':
      return {
        title: '↩️ Application Withdrawn',
        message: `Your application for ${jobTitle} has been withdrawn.`,
      };
    default:
      return {
        title: '📋 Application Update',
        message: `Your application for ${jobTitle} has been updated.`,
      };
  }
}
