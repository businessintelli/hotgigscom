/**
 * Microsoft Teams Notifications Service
 * 
 * Sends notifications to Microsoft Teams channels using incoming webhooks
 * Based on Microsoft Teams API documentation: https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook
 */

export interface TeamsMessage {
  type?: string;
  attachments?: Array<{
    contentType: string;
    content: any;
  }>;
  text?: string; // Simple text fallback
}

export interface TeamsAdaptiveCard {
  type: "AdaptiveCard";
  body: Array<{
    type: string;
    text?: string;
    size?: string;
    weight?: string;
    color?: string;
    items?: any[];
    columns?: any[];
  }>;
  actions?: Array<{
    type: string;
    title: string;
    url?: string;
    data?: any;
  }>;
  $schema: string;
  version: string;
}

export interface TeamsNotificationConfig {
  webhookUrl: string;
  channel?: string; // Display only
  enabled: boolean;
}

/**
 * Send a message to Microsoft Teams via incoming webhook
 */
export async function sendTeamsNotification(
  webhookUrl: string,
  message: TeamsMessage
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error(`Teams webhook failed: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send Teams notification:", error);
    return false;
  }
}

/**
 * Send a simple text notification to Teams
 */
export async function sendTeamsTextNotification(
  webhookUrl: string,
  text: string
): Promise<boolean> {
  return sendTeamsNotification(webhookUrl, { text });
}

/**
 * Send an Adaptive Card notification to Teams
 */
export async function sendTeamsAdaptiveCard(
  webhookUrl: string,
  card: TeamsAdaptiveCard
): Promise<boolean> {
  const message: TeamsMessage = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: card,
      },
    ],
  };

  return sendTeamsNotification(webhookUrl, message);
}

/**
 * Send a rich notification with Adaptive Card formatting
 */
export async function sendTeamsRichNotification(
  webhookUrl: string,
  title: string,
  message: string,
  facts?: Array<{ title: string; value: string }>,
  color?: "accent" | "good" | "warning" | "attention"
): Promise<boolean> {
  const cardBody: any[] = [
    {
      type: "TextBlock",
      text: title,
      size: "Large",
      weight: "Bolder",
      color: color || "default",
    },
    {
      type: "TextBlock",
      text: message,
      wrap: true,
    },
  ];

  if (facts && facts.length > 0) {
    cardBody.push({
      type: "FactSet",
      facts: facts.map((fact) => ({
        title: fact.title,
        value: fact.value,
      })),
    } as any);
  }

  const card: TeamsAdaptiveCard = {
    type: "AdaptiveCard",
    body: cardBody,
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.4",
  };

  return sendTeamsAdaptiveCard(webhookUrl, card);
}

/**
 * Send budget alert to Teams
 */
export async function sendBudgetAlertToTeams(
  webhookUrl: string,
  alert: {
    companyName: string;
    alertType: "warning" | "critical" | "paused" | "override";
    currentSpending: number;
    monthlyLimit: number;
    message: string;
  }
): Promise<boolean> {
  const percentageUsed = (alert.currentSpending / alert.monthlyLimit) * 100;
  const emoji = getAlertEmoji(alert.alertType);
  const color = getTeamsAlertColor(alert.alertType);

  return sendTeamsRichNotification(
    webhookUrl,
    `${emoji} AI Budget Alert - ${alert.companyName}`,
    alert.message,
    [
      { title: "Current Spending", value: `$${alert.currentSpending.toFixed(2)}` },
      { title: "Monthly Limit", value: `$${alert.monthlyLimit.toFixed(2)}` },
      { title: "Usage", value: `${percentageUsed.toFixed(1)}%` },
    ],
    color
  );
}

/**
 * Send LLM usage alert to Teams
 */
export async function sendLLMUsageAlertToTeams(
  webhookUrl: string,
  alert: {
    companyName: string;
    provider: string;
    totalTokens: number;
    estimatedCost: number;
    threshold: number;
  }
): Promise<boolean> {
  return sendTeamsRichNotification(
    webhookUrl,
    `⚠️ LLM Usage Alert - ${alert.companyName}`,
    `Your company has reached ${alert.threshold}% of the configured LLM usage threshold.`,
    [
      { title: "Provider", value: alert.provider },
      { title: "Total Tokens", value: alert.totalTokens.toLocaleString() },
      { title: "Estimated Cost", value: `$${alert.estimatedCost.toFixed(2)}` },
    ],
    "warning"
  );
}

/**
 * Send application status notification to Teams
 */
export async function sendApplicationStatusToTeams(
  webhookUrl: string,
  notification: {
    candidateName: string;
    jobTitle: string;
    status: string;
    recruiterName: string;
  }
): Promise<boolean> {
  return sendTeamsRichNotification(
    webhookUrl,
    `📋 Application Status Update`,
    `Application status has been updated`,
    [
      { title: "Candidate", value: notification.candidateName },
      { title: "Job", value: notification.jobTitle },
      { title: "Status", value: notification.status },
      { title: "Recruiter", value: notification.recruiterName },
    ]
  );
}

/**
 * Send interview reminder to Teams
 */
export async function sendInterviewReminderToTeams(
  webhookUrl: string,
  reminder: {
    candidateName: string;
    jobTitle: string;
    interviewType: string;
    scheduledAt: Date;
    meetingLink?: string;
  }
): Promise<boolean> {
  const timeString = reminder.scheduledAt.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const card: TeamsAdaptiveCard = {
    type: "AdaptiveCard",
    body: [
      {
        type: "TextBlock",
        text: "📅 Interview Reminder",
        size: "Large",
        weight: "Bolder",
      },
      {
        type: "TextBlock",
        text: `Interview scheduled for **${reminder.candidateName}**`,
      },
      {
        type: "FactSet",
        facts: [
          { title: "Job", value: reminder.jobTitle },
          { title: "Type", value: reminder.interviewType },
          { title: "Time", value: timeString },
        ],
      } as any,
    ],
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.4",
  };

  if (reminder.meetingLink) {
    card.actions = [
      {
        type: "Action.OpenUrl",
        title: "Join Meeting",
        url: reminder.meetingLink,
      },
    ];
  }

  return sendTeamsAdaptiveCard(webhookUrl, card);
}

/**
 * Send system health alert to Teams
 */
export async function sendSystemHealthAlertToTeams(
  webhookUrl: string,
  alert: {
    service: string;
    status: "degraded" | "down" | "recovered";
    message: string;
    timestamp: Date;
  }
): Promise<boolean> {
  const emoji = alert.status === "recovered" ? "✅" : alert.status === "degraded" ? "⚠️" : "🚨";
  const color = alert.status === "recovered" ? "good" : alert.status === "degraded" ? "warning" : "attention";

  return sendTeamsRichNotification(
    webhookUrl,
    `${emoji} System Health Alert`,
    alert.message,
    [
      { title: "Service", value: alert.service },
      { title: "Status", value: alert.status.toUpperCase() },
      { title: "Time", value: alert.timestamp.toLocaleString() },
    ],
    color
  );
}

/**
 * Test Teams webhook connection
 */
export async function testTeamsWebhook(webhookUrl: string): Promise<boolean> {
  return sendTeamsTextNotification(
    webhookUrl,
    "🎉 Microsoft Teams integration test successful! Your webhook is working correctly."
  );
}

// Helper functions
function getAlertEmoji(alertType: string): string {
  switch (alertType) {
    case "warning":
      return "⚠️";
    case "critical":
      return "🚨";
    case "paused":
      return "⏸️";
    case "override":
      return "✅";
    default:
      return "ℹ️";
  }
}

function getTeamsAlertColor(alertType: string): "accent" | "good" | "warning" | "attention" {
  switch (alertType) {
    case "warning":
      return "warning";
    case "critical":
    case "paused":
      return "attention";
    case "override":
      return "good";
    default:
      return "accent";
  }
}
