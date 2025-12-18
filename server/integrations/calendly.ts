/**
 * Calendly Integration Service
 * 
 * Handles scheduling link generation and webhook processing for Calendly
 */

import { getDb } from "../db";
import { schedulingLinks, calendarEvents, calendarIntegrations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

interface CalendlyEventType {
  uri: string;
  name: string;
  duration: number; // in minutes
  scheduling_url: string;
}

/**
 * Initialize Calendly OAuth flow
 */
export function getCalendlyAuthUrl(userId: number, redirectUri: string): string {
  const clientId = process.env.CALENDLY_CLIENT_ID || "mock-client-id";
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  
  return `https://auth.calendly.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCalendlyCode(
  code: string,
  userId: number,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  console.log(`[Calendly] Exchanging code for user ${userId}`);
  
  // In production:
  // const response = await fetch('https://auth.calendly.com/oauth/token', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     grant_type: 'authorization_code',
  //     code,
  //     client_id: process.env.CALENDLY_CLIENT_ID!,
  //     client_secret: process.env.CALENDLY_CLIENT_SECRET!,
  //     redirect_uri: redirectUri
  //   })
  // });
  // const data = await response.json();
  
  return {
    accessToken: `mock-calendly-token-${Date.now()}`,
    refreshToken: `mock-calendly-refresh-${Date.now()}`,
    expiresIn: 7200
  };
}

/**
 * Save Calendly integration
 */
export async function saveCalendlyIntegration(
  userId: number,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  calendlyEmail: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

  const result = await db.insert(calendarIntegrations).values({
    userId,
    provider: "calendly",
    providerEmail: calendlyEmail,
    accessToken,
    refreshToken,
    tokenExpiry,
    autoSync: true,
    syncDirection: "one-way",
    isActive: true,
  });

  return result.insertId;
}

/**
 * Get user's Calendly event types
 */
export async function getCalendlyEventTypes(userId: number): Promise<CalendlyEventType[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Get Calendly integration
  const integration = await db
    .select()
    .from(calendarIntegrations)
    .where(eq(calendarIntegrations.userId, userId))
    .limit(1);

  if (integration.length === 0) {
    throw new Error("Calendly integration not found");
  }

  // Call Calendly API (mock implementation)
  // In production:
  // const response = await fetch('https://api.calendly.com/event_types?user={user_uri}', {
  //   headers: { 'Authorization': `Bearer ${integration[0].accessToken}` }
  // });
  // const data = await response.json();
  // return data.collection;
  
  return [
    {
      uri: "https://api.calendly.com/event_types/mock-1",
      name: "30 Minute Phone Screen",
      duration: 30,
      scheduling_url: "https://calendly.com/your-company/30min-phone-screen"
    },
    {
      uri: "https://api.calendly.com/event_types/mock-2",
      name: "60 Minute Technical Interview",
      duration: 60,
      scheduling_url: "https://calendly.com/your-company/60min-technical"
    },
    {
      uri: "https://api.calendly.com/event_types/mock-3",
      name: "45 Minute Culture Fit Interview",
      duration: 45,
      scheduling_url: "https://calendly.com/your-company/45min-culture-fit"
    }
  ];
}

/**
 * Create a scheduling link for an interview
 */
export async function createCalendlySchedulingLink(
  recruiterId: number,
  interviewId: number,
  candidateId: number,
  eventTypeUri: string,
  expiresInDays: number = 7
): Promise<{ linkId: number; schedulingUrl: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Get Calendly integration
  const integration = await db
    .select()
    .from(calendarIntegrations)
    .where(eq(calendarIntegrations.userId, recruiterId))
    .limit(1);

  if (integration.length === 0) {
    throw new Error("Calendly integration not found");
  }

  // Get event type details (mock)
  const eventTypes = await getCalendlyEventTypes(recruiterId);
  const eventType = eventTypes.find(et => et.uri === eventTypeUri);
  
  if (!eventType) {
    throw new Error("Event type not found");
  }

  // Create scheduling link with prefilled data
  // In production, use Calendly's single-use scheduling links API
  const schedulingUrl = `${eventType.scheduling_url}?name=Candidate&email=candidate@example.com`;
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const result = await db.insert(schedulingLinks).values({
    recruiterId,
    interviewId,
    candidateId,
    provider: "calendly",
    schedulingUrl,
    externalLinkId: `calendly-${Date.now()}`,
    eventType: eventType.name,
    duration: eventType.duration,
    linkSentAt: new Date(),
    bookingStatus: "pending",
    expiresAt,
  });

  return {
    linkId: result.insertId,
    schedulingUrl
  };
}

/**
 * Process Calendly webhook for booking confirmation
 */
export async function processCalendlyBookingWebhook(payload: {
  event: string;
  payload: {
    event_type: {
      name: string;
      duration: number;
    };
    event: {
      uri: string;
      start_time: string;
      end_time: string;
      location?: {
        type: string;
        location?: string;
        join_url?: string;
      };
    };
    invitee: {
      name: string;
      email: string;
      timezone: string;
    };
  };
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  if (payload.event === "invitee.created") {
    // Booking confirmed
    const { event, invitee, event_type } = payload.payload;
    
    // Find scheduling link by URL pattern or external ID
    // This is simplified - in production, match by unique identifier
    const links = await db
      .select()
      .from(schedulingLinks)
      .where(eq(schedulingLinks.provider, "calendly"))
      .limit(10);

    if (links.length > 0) {
      const link = links[0]; // Simplified matching
      
      // Update scheduling link status
      await db
        .update(schedulingLinks)
        .set({
          bookedAt: new Date(),
          bookingStatus: "booked",
        })
        .where(eq(schedulingLinks.id, link.id));

      // Create calendar event record
      if (link.interviewId) {
        await db.insert(calendarEvents).values({
          interviewId: link.interviewId,
          calendarIntegrationId: link.recruiterId, // Simplified
          externalEventId: event.uri,
          provider: "calendly",
          title: event_type.name,
          startTime: new Date(event.start_time),
          endTime: new Date(event.end_time),
          timezone: invitee.timezone,
          attendees: JSON.stringify([{ email: invitee.email, name: invitee.name }]),
          meetingUrl: event.location?.join_url,
          syncStatus: "synced",
          bookingConfirmedAt: new Date(),
          lastSyncAt: new Date(),
        });
      }
    }
  } else if (payload.event === "invitee.canceled") {
    // Booking cancelled
    const { event } = payload.payload;
    
    // Find and update calendar event
    const events = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.externalEventId, event.uri))
      .limit(1);

    if (events.length > 0) {
      await db
        .update(calendarEvents)
        .set({
          syncStatus: "cancelled",
          bookingCancelledAt: new Date(),
        })
        .where(eq(calendarEvents.id, events[0].id));
    }
  }
}

/**
 * Track scheduling link click
 */
export async function trackSchedulingLinkClick(linkId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db
    .update(schedulingLinks)
    .set({
      linkClickedAt: new Date(),
      bookingStatus: "clicked",
    })
    .where(eq(schedulingLinks.id, linkId));
}

/**
 * Get scheduling link statistics
 */
export async function getSchedulingLinkStats(recruiterId: number): Promise<{
  totalLinks: number;
  clicked: number;
  booked: number;
  expired: number;
  conversionRate: number;
}> {
  const db = await getDb();
  if (!db) {
    return { totalLinks: 0, clicked: 0, booked: 0, expired: 0, conversionRate: 0 };
  }

  const links = await db
    .select()
    .from(schedulingLinks)
    .where(eq(schedulingLinks.recruiterId, recruiterId));

  const totalLinks = links.length;
  const clicked = links.filter(l => l.linkClickedAt !== null).length;
  const booked = links.filter(l => l.bookingStatus === "booked").length;
  const expired = links.filter(l => l.bookingStatus === "expired").length;
  const conversionRate = clicked > 0 ? (booked / clicked) * 100 : 0;

  return { totalLinks, clicked, booked, expired, conversionRate };
}
