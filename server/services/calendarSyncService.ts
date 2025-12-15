/**
 * Calendar Sync Service
 * Handles integration with Google Calendar and Outlook for interview scheduling
 */

import { getDb } from '../db';
import { interviews, applications, jobs, candidates, users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export interface CalendarEvent {
  id?: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  meetingLink?: string;
  attendees: { email: string; name?: string }[];
  reminders?: { method: 'email' | 'popup'; minutes: number }[];
}

export interface CalendarSyncResult {
  success: boolean;
  eventId?: string;
  eventLink?: string;
  error?: string;
}

/**
 * Generate ICS file content for calendar import
 */
export function generateICSFile(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const escapeText = (text: string) => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const uid = `interview-${Date.now()}@hotgigs.com`;
  const now = formatDate(new Date());
  const start = formatDate(event.startTime);
  const end = formatDate(event.endTime);

  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HotGigs//Interview Scheduler//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${start}
DTEND:${end}
SUMMARY:${escapeText(event.title)}
DESCRIPTION:${escapeText(event.description)}`;

  if (event.location) {
    icsContent += `\nLOCATION:${escapeText(event.location)}`;
  }

  if (event.meetingLink) {
    icsContent += `\nURL:${event.meetingLink}`;
  }

  // Add attendees
  for (const attendee of event.attendees) {
    const cn = attendee.name ? `;CN=${escapeText(attendee.name)}` : '';
    icsContent += `\nATTENDEE${cn};RSVP=TRUE:mailto:${attendee.email}`;
  }

  // Add reminders
  if (event.reminders) {
    for (const reminder of event.reminders) {
      icsContent += `
BEGIN:VALARM
ACTION:${reminder.method === 'email' ? 'EMAIL' : 'DISPLAY'}
TRIGGER:-PT${reminder.minutes}M
DESCRIPTION:Interview Reminder
END:VALARM`;
    }
  }

  icsContent += `
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

  return icsContent;
}

/**
 * Generate Google Calendar URL for adding event
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(event.startTime)}/${formatGoogleDate(event.endTime)}`,
    details: event.description,
  });

  if (event.location) {
    params.append('location', event.location);
  }

  if (event.attendees.length > 0) {
    params.append('add', event.attendees.map(a => a.email).join(','));
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL for adding event
 */
export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const formatOutlookDate = (date: Date) => {
    return date.toISOString();
  };

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    startdt: formatOutlookDate(event.startTime),
    enddt: formatOutlookDate(event.endTime),
  });

  if (event.location) {
    params.append('location', event.location);
  }

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate Office 365 Calendar URL for adding event
 */
export function generateOffice365CalendarUrl(event: CalendarEvent): string {
  const formatOutlookDate = (date: Date) => {
    return date.toISOString();
  };

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    startdt: formatOutlookDate(event.startTime),
    enddt: formatOutlookDate(event.endTime),
  });

  if (event.location) {
    params.append('location', event.location);
  }

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Get interview details for calendar event
 */
export async function getInterviewCalendarEvent(interviewId: number): Promise<CalendarEvent | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      interview: interviews,
      application: applications,
      job: jobs,
      candidate: candidates,
      user: users,
    })
    .from(interviews)
    .leftJoin(applications, eq(interviews.applicationId, applications.id))
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(candidates, eq(applications.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(eq(interviews.id, interviewId))
    .limit(1);

  if (!result.length) return null;

  const { interview, job, user } = result[0];
  
  const startTime = new Date(interview.scheduledAt);
  const endTime = new Date(startTime.getTime() + (interview.duration || 60) * 60 * 1000);
  
  const attendees: { email: string; name?: string }[] = [];
  
  // Add candidate as attendee
  if (user?.email) {
    attendees.push({ email: user.email, name: user.name || undefined });
  }

  // Build description
  let description = `Interview for ${job?.title || 'Position'} at ${job?.companyName || 'Company'}`;
  
  if (interview.meetingLink) {
    description += `\n\nMeeting Link: ${interview.meetingLink}`;
  }
  
  if (interview.notes) {
    description += `\n\nNotes: ${interview.notes}`;
  }

  // Determine location
  let location = interview.location || undefined;
  if (interview.type === 'video' && interview.meetingLink) {
    location = interview.meetingLink;
  }

  return {
    title: `Interview: ${job?.title || 'Position'} - ${user?.name || 'Candidate'}`,
    description,
    startTime,
    endTime,
    location,
    meetingLink: interview.meetingLink || undefined,
    attendees,
    reminders: [
      { method: 'email', minutes: 1440 }, // 24 hours before
      { method: 'popup', minutes: 60 },   // 1 hour before
      { method: 'popup', minutes: 15 },   // 15 minutes before
    ],
  };
}

/**
 * Generate all calendar links for an interview
 */
export async function generateCalendarLinks(interviewId: number): Promise<{
  icsContent: string;
  googleCalendarUrl: string;
  outlookUrl: string;
  office365Url: string;
} | null> {
  const event = await getInterviewCalendarEvent(interviewId);
  if (!event) return null;

  return {
    icsContent: generateICSFile(event),
    googleCalendarUrl: generateGoogleCalendarUrl(event),
    outlookUrl: generateOutlookCalendarUrl(event),
    office365Url: generateOffice365CalendarUrl(event),
  };
}
