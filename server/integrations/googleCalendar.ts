/**
 * Google Calendar Integration Service
 * 
 * Handles OAuth authentication and calendar event management for Google Calendar
 */

import { getDb } from "../db";
import { calendarIntegrations, calendarEvents, interviews } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string; // ISO 8601 format
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{ email: string; displayName?: string }>;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: { type: string };
    };
  };
}

/**
 * Initialize Google Calendar OAuth flow
 * Returns authorization URL for user to grant access
 */
export function getGoogleCalendarAuthUrl(userId: number, redirectUri: string): string {
  // In production, use actual Google OAuth2 client
  // This is a mock implementation
  const clientId = process.env.GOOGLE_CLIENT_ID || "mock-client-id";
  const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar");
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&state=${state}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeGoogleCalendarCode(
  code: string,
  userId: number,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  // Mock implementation - in production, call Google OAuth2 token endpoint
  console.log(`[GoogleCalendar] Exchanging code for user ${userId}`);
  
  // In production:
  // const response = await fetch('https://oauth2.googleapis.com/token', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  //   body: new URLSearchParams({
  //     code,
  //     client_id: process.env.GOOGLE_CLIENT_ID!,
  //     client_secret: process.env.GOOGLE_CLIENT_SECRET!,
  //     redirect_uri: redirectUri,
  //     grant_type: 'authorization_code'
  //   })
  // });
  // const data = await response.json();
  
  return {
    accessToken: `mock-access-token-${Date.now()}`,
    refreshToken: `mock-refresh-token-${Date.now()}`,
    expiresIn: 3600
  };
}

/**
 * Save Google Calendar integration
 */
export async function saveGoogleCalendarIntegration(
  userId: number,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  calendarEmail: string,
  timezone: string = "UTC"
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

  // Check if integration already exists
  const existing = await db
    .select()
    .from(calendarIntegrations)
    .where(
      and(
        eq(calendarIntegrations.userId, userId),
        eq(calendarIntegrations.provider, "google")
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing integration
    await db
      .update(calendarIntegrations)
      .set({
        accessToken,
        refreshToken,
        tokenExpiry,
        providerEmail: calendarEmail,
        timezone,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(calendarIntegrations.id, existing[0].id));
    
    return existing[0].id;
  } else {
    // Create new integration
    const result = await db.insert(calendarIntegrations).values({
      userId,
      provider: "google",
      providerEmail: calendarEmail,
      accessToken,
      refreshToken,
      tokenExpiry,
      timezone,
      autoSync: true,
      syncDirection: "two-way",
      isActive: true,
    });

    return result.insertId;
  }
}

/**
 * Create a calendar event for an interview
 */
export async function createGoogleCalendarEvent(
  interviewId: number,
  calendarIntegrationId: number,
  eventData: {
    title: string;
    description?: string;
    location?: string;
    startTime: Date;
    endTime: Date;
    timezone: string;
    attendees: Array<{ email: string; name?: string }>;
    meetingUrl?: string;
  }
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Get calendar integration
  const integration = await db
    .select()
    .from(calendarIntegrations)
    .where(eq(calendarIntegrations.id, calendarIntegrationId))
    .limit(1);

  if (integration.length === 0) {
    throw new Error("Calendar integration not found");
  }

  // Prepare event data
  const event: CalendarEvent = {
    summary: eventData.title,
    description: eventData.description,
    location: eventData.location,
    start: {
      dateTime: eventData.startTime.toISOString(),
      timeZone: eventData.timezone,
    },
    end: {
      dateTime: eventData.endTime.toISOString(),
      timeZone: eventData.timezone,
    },
    attendees: eventData.attendees.map(a => ({
      email: a.email,
      displayName: a.name,
    })),
  };

  // Add Google Meet link if requested
  if (eventData.meetingUrl === "google-meet") {
    event.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  // Call Google Calendar API (mock implementation)
  const externalEventId = await callGoogleCalendarAPI(
    integration[0].accessToken,
    "POST",
    "/calendars/primary/events",
    event
  );

  // Save calendar event record
  await db.insert(calendarEvents).values({
    interviewId,
    calendarIntegrationId,
    externalEventId,
    provider: "google",
    title: eventData.title,
    description: eventData.description,
    location: eventData.location,
    meetingUrl: eventData.meetingUrl,
    startTime: eventData.startTime,
    endTime: eventData.endTime,
    timezone: eventData.timezone,
    attendees: JSON.stringify(eventData.attendees),
    organizerEmail: integration[0].providerEmail || undefined,
    syncStatus: "synced",
    lastSyncAt: new Date(),
  });

  return externalEventId;
}

/**
 * Update a calendar event
 */
export async function updateGoogleCalendarEvent(
  interviewId: number,
  updates: {
    startTime?: Date;
    endTime?: Date;
    location?: string;
    description?: string;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Get existing calendar event
  const existingEvent = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.interviewId, interviewId))
    .limit(1);

  if (existingEvent.length === 0) {
    throw new Error("Calendar event not found");
  }

  const event = existingEvent[0];

  // Get calendar integration
  const integration = await db
    .select()
    .from(calendarIntegrations)
    .where(eq(calendarIntegrations.id, event.calendarIntegrationId))
    .limit(1);

  if (integration.length === 0) {
    throw new Error("Calendar integration not found");
  }

  // Prepare update data
  const updateData: Partial<CalendarEvent> = {};
  
  if (updates.startTime) {
    updateData.start = {
      dateTime: updates.startTime.toISOString(),
      timeZone: event.timezone,
    };
  }
  
  if (updates.endTime) {
    updateData.end = {
      dateTime: updates.endTime.toISOString(),
      timeZone: event.timezone,
    };
  }
  
  if (updates.location) {
    updateData.location = updates.location;
  }
  
  if (updates.description) {
    updateData.description = updates.description;
  }

  // Call Google Calendar API
  await callGoogleCalendarAPI(
    integration[0].accessToken,
    "PATCH",
    `/calendars/primary/events/${event.externalEventId}`,
    updateData
  );

  // Update local record
  await db
    .update(calendarEvents)
    .set({
      ...updates,
      lastSyncAt: new Date(),
    })
    .where(eq(calendarEvents.id, event.id));
}

/**
 * Cancel a calendar event
 */
export async function cancelGoogleCalendarEvent(interviewId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Get existing calendar event
  const existingEvent = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.interviewId, interviewId))
    .limit(1);

  if (existingEvent.length === 0) {
    throw new Error("Calendar event not found");
  }

  const event = existingEvent[0];

  // Get calendar integration
  const integration = await db
    .select()
    .from(calendarIntegrations)
    .where(eq(calendarIntegrations.id, event.calendarIntegrationId))
    .limit(1);

  if (integration.length === 0) {
    throw new Error("Calendar integration not found");
  }

  // Call Google Calendar API to delete event
  await callGoogleCalendarAPI(
    integration[0].accessToken,
    "DELETE",
    `/calendars/primary/events/${event.externalEventId}`,
    null
  );

  // Update local record
  await db
    .update(calendarEvents)
    .set({
      syncStatus: "cancelled",
      lastSyncAt: new Date(),
    })
    .where(eq(calendarEvents.id, event.id));
}

/**
 * Check availability for a time slot
 */
export async function checkGoogleCalendarAvailability(
  userId: number,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Get calendar integration
  const integration = await db
    .select()
    .from(calendarIntegrations)
    .where(
      and(
        eq(calendarIntegrations.userId, userId),
        eq(calendarIntegrations.provider, "google"),
        eq(calendarIntegrations.isActive, true)
      )
    )
    .limit(1);

  if (integration.length === 0) {
    return true; // No calendar integration, assume available
  }

  // Call Google Calendar API freebusy query (mock implementation)
  const busySlots = await callGoogleCalendarAPI(
    integration[0].accessToken,
    "POST",
    "/freeBusy",
    {
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      items: [{ id: "primary" }],
    }
  );

  // Check if requested time overlaps with busy slots
  // Mock implementation returns true (available)
  return true;
}

/**
 * Call Google Calendar API (mock implementation)
 */
async function callGoogleCalendarAPI(
  accessToken: string,
  method: string,
  endpoint: string,
  data: any
): Promise<any> {
  // Mock implementation
  console.log(`[GoogleCalendar] ${method} ${endpoint}`);
  
  // In production, call actual Google Calendar API:
  // const response = await fetch(`https://www.googleapis.com/calendar/v3${endpoint}`, {
  //   method,
  //   headers: {
  //     'Authorization': `Bearer ${accessToken}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: data ? JSON.stringify(data) : undefined
  // });
  // return await response.json();
  
  // Return mock event ID
  return `mock-event-${Date.now()}`;
}
