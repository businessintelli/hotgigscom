/**
 * Calendar Utilities
 * Generate ICS files and calendar URLs for interview appointments
 */

export interface CalendarEvent {
  title: string;
  description: string;
  location?: string;
  url?: string;
  startDate: Date;
  endDate: Date;
  organizer?: string;
}

/**
 * Format date to ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatDateToICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Escape special characters for ICS format
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate ICS file content
 */
export function generateICS(event: CalendarEvent): string {
  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@hotgigs.com`;
  const now = formatDateToICS(new Date());
  
  let description = event.description;
  if (event.url) {
    description += `\\n\\nJoin Meeting: ${event.url}`;
  }
  
  const location = event.url || event.location || '';
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HotGigs//Interview Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatDateToICS(event.startDate)}`,
    `DTEND:${formatDateToICS(event.endDate)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    location ? `LOCATION:${escapeICS(location)}` : '',
    event.url ? `URL:${event.url}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Interview reminder - 1 hour',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Interview reminder - 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
  
  return icsContent;
}

/**
 * Download ICS file
 */
export function downloadICS(event: CalendarEvent, filename?: string): void {
  const icsContent = generateICS(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `interview-${event.startDate.toISOString().split('T')[0]}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar URL
 */
export function generateGoogleCalendarURL(event: CalendarEvent): string {
  const formatGoogleDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  
  let details = event.description;
  if (event.url) {
    details += `\n\nJoin Meeting: ${event.url}`;
  }
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(event.endDate)}`,
    details: details,
    location: event.url || event.location || '',
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL (Office 365)
 */
export function generateOutlookCalendarURL(event: CalendarEvent): string {
  let body = event.description;
  if (event.url) {
    body += `\n\nJoin Meeting: ${event.url}`;
  }
  
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: event.startDate.toISOString(),
    enddt: event.endDate.toISOString(),
    body: body,
    location: event.url || event.location || '',
  });
  
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate Yahoo Calendar URL
 */
export function generateYahooCalendarURL(event: CalendarEvent): string {
  const formatYahooDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, '');
  
  // Calculate duration in hours and minutes
  const durationMs = event.endDate.getTime() - event.startDate.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const duration = `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}`;
  
  let desc = event.description;
  if (event.url) {
    desc += `\n\nJoin Meeting: ${event.url}`;
  }
  
  const params = new URLSearchParams({
    v: '60',
    title: event.title,
    st: formatYahooDate(event.startDate),
    dur: duration,
    desc: desc,
    in_loc: event.url || event.location || '',
  });
  
  return `https://calendar.yahoo.com/?${params.toString()}`;
}

/**
 * Create calendar event from interview data
 */
export function createInterviewCalendarEvent(interview: {
  jobTitle: string;
  companyName: string;
  scheduledAt: Date | string;
  duration: number;
  type: string;
  meetingLink?: string | null;
  location?: string | null;
}): CalendarEvent {
  const startDate = new Date(interview.scheduledAt);
  const endDate = new Date(startDate.getTime() + interview.duration * 60 * 1000);
  
  const interviewType = interview.type === 'video' ? 'Video' :
                        interview.type === 'phone' ? 'Phone' :
                        interview.type === 'in-person' ? 'In-Person' :
                        interview.type === 'ai-interview' ? 'AI' : interview.type;
  
  let description = `${interviewType} Interview for ${interview.jobTitle} position at ${interview.companyName}.\n\n`;
  description += `Duration: ${interview.duration} minutes\n`;
  description += `Type: ${interviewType}\n`;
  
  if (interview.location) {
    description += `Location: ${interview.location}\n`;
  }
  
  description += `\nGood luck with your interview!`;
  
  return {
    title: `Interview: ${interview.jobTitle} at ${interview.companyName}`,
    description,
    location: interview.location || undefined,
    url: interview.meetingLink || undefined,
    startDate,
    endDate,
  };
}
