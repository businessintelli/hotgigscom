import axios from "axios";
import { ENV } from "./_core/env";

export type VideoProvider = "zoom" | "teams" | "none";

export interface MeetingDetails {
  meetingId: string;
  joinUrl: string;
  startUrl?: string;
  password?: string;
  provider: VideoProvider;
}

export interface CreateMeetingParams {
  topic: string;
  startTime: Date;
  duration: number; // in minutes
  timezone?: string;
  agenda?: string;
  hostEmail?: string;
}

/**
 * Create a Zoom meeting
 */
async function createZoomMeeting(
  params: CreateMeetingParams
): Promise<MeetingDetails> {
  const { zoomClientId, zoomClientSecret, zoomAccountId } = ENV;

  if (!zoomClientId || !zoomClientSecret || !zoomAccountId) {
    throw new Error(
      "Zoom credentials not configured. Please set ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, and ZOOM_ACCOUNT_ID in environment variables."
    );
  }

  // Get Server-to-Server OAuth token
  const tokenResponse = await axios.post(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${zoomAccountId}`,
    {},
    {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${zoomClientId}:${zoomClientSecret}`
        ).toString("base64")}`,
      },
    }
  );

  const accessToken = tokenResponse.data.access_token;

  // Create meeting
  const meetingResponse = await axios.post(
    "https://api.zoom.us/v2/users/me/meetings",
    {
      topic: params.topic,
      type: 2, // Scheduled meeting
      start_time: params.startTime.toISOString(),
      duration: params.duration,
      timezone: params.timezone || "UTC",
      agenda: params.agenda || "",
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
        audio: "both",
        auto_recording: "cloud",
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const meeting = meetingResponse.data;

  return {
    meetingId: meeting.id.toString(),
    joinUrl: meeting.join_url,
    startUrl: meeting.start_url,
    password: meeting.password,
    provider: "zoom",
  };
}

/**
 * Create a Microsoft Teams meeting
 */
async function createTeamsMeeting(
  params: CreateMeetingParams
): Promise<MeetingDetails> {
  const { teamsClientId, teamsClientSecret, teamsTenantId } = ENV;

  if (!teamsClientId || !teamsClientSecret || !teamsTenantId) {
    throw new Error(
      "Microsoft Teams credentials not configured. Please set TEAMS_CLIENT_ID, TEAMS_CLIENT_SECRET, and TEAMS_TENANT_ID in environment variables."
    );
  }

  // Get access token using client credentials flow
  const tokenResponse = await axios.post(
    `https://login.microsoftonline.com/${teamsTenantId}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: teamsClientId,
      client_secret: teamsClientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const accessToken = tokenResponse.data.access_token;

  // Create online meeting
  const meetingResponse = await axios.post(
    "https://graph.microsoft.com/v1.0/me/onlineMeetings",
    {
      subject: params.topic,
      startDateTime: params.startTime.toISOString(),
      endDateTime: new Date(
        params.startTime.getTime() + params.duration * 60000
      ).toISOString(),
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const meeting = meetingResponse.data;

  return {
    meetingId: meeting.id,
    joinUrl: meeting.joinWebUrl,
    provider: "teams",
  };
}

/**
 * Create a video meeting based on configured provider
 */
export async function createVideoMeeting(
  params: CreateMeetingParams,
  provider?: VideoProvider
): Promise<MeetingDetails | null> {
  // Get configured provider from system settings if not specified
  const activeProvider = provider || (await getActiveVideoProvider());

  if (activeProvider === "none") {
    return null;
  }

  try {
    if (activeProvider === "zoom") {
      return await createZoomMeeting(params);
    } else if (activeProvider === "teams") {
      return await createTeamsMeeting(params);
    }
  } catch (error) {
    console.error(`Failed to create ${activeProvider} meeting:`, error);
    throw error;
  }

  return null;
}

/**
 * Get active video provider from system settings
 */
async function getActiveVideoProvider(): Promise<VideoProvider> {
  // This will be implemented when we add system settings
  // For now, check environment variable
  const provider = ENV.videoProvider as VideoProvider;
  return provider || "none";
}

/**
 * Delete a video meeting
 */
export async function deleteVideoMeeting(
  meetingId: string,
  provider: VideoProvider
): Promise<void> {
  if (provider === "zoom") {
    const { zoomClientId, zoomClientSecret, zoomAccountId } = ENV;

    if (!zoomClientId || !zoomClientSecret || !zoomAccountId) {
      throw new Error("Zoom credentials not configured");
    }

    // Get access token
    const tokenResponse = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${zoomAccountId}`,
      {},
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${zoomClientId}:${zoomClientSecret}`
          ).toString("base64")}`,
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Delete meeting
    await axios.delete(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } else if (provider === "teams") {
    const { teamsClientId, teamsClientSecret, teamsTenantId } = ENV;

    if (!teamsClientId || !teamsClientSecret || !teamsTenantId) {
      throw new Error("Microsoft Teams credentials not configured");
    }

    // Get access token
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${teamsTenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: teamsClientId,
        client_secret: teamsClientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Delete meeting
    await axios.delete(
      `https://graph.microsoft.com/v1.0/me/onlineMeetings/${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }
}
