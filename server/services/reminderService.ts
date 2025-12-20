import { getDb } from "../db";
import { botInterviewSessions, onboardingTasks, onboardingProcesses, associates, applications, candidates, users, jobs } from "../../drizzle/schema";
import { eq, and, lt, isNull, or } from "drizzle-orm";
import { sendEmail } from "../emailService";

/**
 * Process all pending reminders for incomplete bot interviews and onboarding tasks
 */
export async function processReminders() {
  const results = {
    botInterviewReminders: 0,
    onboardingReminders: 0,
    errors: [] as string[],
  };

  try {
    await sendBotInterviewReminders(results);
    await sendOnboardingTaskReminders(results);
  } catch (error) {
    console.error("Error processing reminders:", error);
    results.errors.push(error instanceof Error ? error.message : String(error));
  }

  return results;
}

/**
 * Send reminders for incomplete bot interviews
 * - Sends reminder if interview was scheduled more than 24 hours ago and not started
 * - Sends urgent reminder if interview was scheduled more than 3 days ago
 */
async function sendBotInterviewReminders(results: any) {
  const database = await getDb();
  if (!database) return;

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // Find incomplete bot interview sessions
  const incompleteSessions = await database
    .select({
      session: botInterviewSessions,
      application: applications,
      candidate: candidates,
      user: users,
      job: jobs,
    })
    .from(botInterviewSessions)
    .leftJoin(applications, eq(botInterviewSessions.applicationId, applications.id))
    .leftJoin(candidates, eq(botInterviewSessions.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .leftJoin(jobs, eq(botInterviewSessions.jobId, jobs.id))
    .where(
      and(
        or(
          eq(botInterviewSessions.sessionStatus, "not-started"),
          eq(botInterviewSessions.sessionStatus, "in-progress")
        ),
        lt(botInterviewSessions.createdAt, oneDayAgo)
      )
    );

  for (const record of incompleteSessions) {
    try {
      const { session, candidate, user, job } = record;
      if (!user?.email || !job) continue;

      const isUrgent = session.createdAt < threeDaysAgo;
      const subject = isUrgent
        ? `Urgent: Complete Your Interview for ${job.title}`
        : `Reminder: Complete Your Interview for ${job.title}`;

      const interviewLink = `${process.env.VITE_OAUTH_PORTAL_URL || 'http://localhost:3000'}/candidate/bot-interview/${session.id}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${isUrgent ? '#dc2626' : '#2563eb'};">${isUrgent ? '⚠️ Urgent Reminder' : '📋 Interview Reminder'}</h2>
          <p>Hi ${user.name || 'there'},</p>
          <p>${isUrgent ? 'This is an urgent reminder that' : 'We noticed that'} you haven't completed your AI interview for the <strong>${job.title}</strong> position.</p>
          ${session.sessionStatus === 'in-progress' ? '<p>You started the interview but haven\'t finished it yet. You can continue where you left off.</p>' : ''}
          <p>Please complete the interview at your earliest convenience to proceed with your application.</p>
          <div style="margin: 30px 0;">
            <a href="${interviewLink}" style="background-color: ${isUrgent ? '#dc2626' : '#2563eb'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              ${session.sessionStatus === 'in-progress' ? 'Continue Interview' : 'Start Interview'}
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Interview Progress: ${session.currentQuestionIndex} of ${session.totalQuestions} questions completed
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you have any questions or need assistance, please contact the recruiter.
          </p>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject,
        html,
      });

      results.botInterviewReminders++;
    } catch (error) {
      console.error(`Failed to send bot interview reminder for session ${record.session.id}:`, error);
      results.errors.push(`Bot interview ${record.session.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Send reminders for pending onboarding tasks
 * - Sends reminder for tasks due within 3 days
 * - Sends urgent reminder for overdue tasks
 */
async function sendOnboardingTaskReminders(results: any) {
  const database = await getDb();
  if (!database) return;

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Find pending onboarding tasks that are due soon or overdue
  const pendingTasks = await database
    .select({
      task: onboardingTasks,
      process: onboardingProcesses,
      associate: associates,
      candidate: candidates,
      user: users,
    })
    .from(onboardingTasks)
    .leftJoin(onboardingProcesses, eq(onboardingTasks.processId, onboardingProcesses.id))
    .leftJoin(associates, eq(onboardingProcesses.associateId, associates.id))
    .leftJoin(candidates, eq(associates.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(
      and(
        eq(onboardingTasks.status, "pending"),
        or(
          lt(onboardingTasks.dueDate, threeDaysFromNow),
          lt(onboardingTasks.dueDate, now)
        )
      )
    );

  for (const record of pendingTasks) {
    try {
      const { task, process: onboardingProcess, associate, candidate, user } = record;
      if (!user?.email || !task) continue;

      const isOverdue = task.dueDate && task.dueDate < now;
      const subject = isOverdue
        ? `Overdue: Complete ${task.title}`
        : `Reminder: ${task.title} Due Soon`;

      const taskLink = `${process.env.VITE_OAUTH_PORTAL_URL || 'http://localhost:3000'}/candidate/onboarding`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${isOverdue ? '#dc2626' : '#2563eb'};">${isOverdue ? '⚠️ Task Overdue' : '📋 Task Reminder'}</h2>
          <p>Hi ${user.name || 'there'},</p>
          <p>${isOverdue ? 'Your onboarding task is overdue' : 'You have an onboarding task due soon'}:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${task.title}</h3>
            <p>${task.description || 'No description provided'}</p>
            <p style="color: ${isOverdue ? '#dc2626' : '#666'}; font-weight: bold;">
              Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not specified'}
            </p>
          </div>
          <p>Please complete this task as soon as possible to continue with your onboarding process.</p>
          <div style="margin: 30px 0;">
            <a href="${taskLink}" style="background-color: ${isOverdue ? '#dc2626' : '#2563eb'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Task
            </a>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you have any questions or need assistance, please contact your recruiter.
          </p>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject,
        html,
      });

      results.onboardingReminders++;
    } catch (error) {
      console.error(`Failed to send onboarding task reminder for task ${record.task?.id}:`, error);
      results.errors.push(`Onboarding task ${record.task?.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Send a manual reminder for a specific bot interview session
 */
export async function sendManualBotInterviewReminder(sessionId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const result = await database
    .select({
      session: botInterviewSessions,
      application: applications,
      candidate: candidates,
      user: users,
      job: jobs,
    })
    .from(botInterviewSessions)
    .leftJoin(applications, eq(botInterviewSessions.applicationId, applications.id))
    .leftJoin(candidates, eq(botInterviewSessions.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .leftJoin(jobs, eq(botInterviewSessions.jobId, jobs.id))
    .where(eq(botInterviewSessions.id, sessionId))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Bot interview session not found");
  }

  const { session, candidate, user, job } = result[0];
  if (!user?.email || !job) {
    throw new Error("Missing required data for sending reminder");
  }

  const interviewLink = `${process.env.VITE_OAUTH_PORTAL_URL || 'http://localhost:3000'}/candidate/bot-interview/${session.id}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">📋 Interview Reminder</h2>
      <p>Hi ${user.name || 'there'},</p>
      <p>This is a reminder to complete your AI interview for the <strong>${job.title}</strong> position.</p>
      ${session.sessionStatus === 'in-progress' ? '<p>You started the interview but haven\'t finished it yet. You can continue where you left off.</p>' : ''}
      <div style="margin: 30px 0;">
        <a href="${interviewLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          ${session.sessionStatus === 'in-progress' ? 'Continue Interview' : 'Start Interview'}
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        Interview Progress: ${session.currentQuestionIndex} of ${session.totalQuestions} questions completed
      </p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: `Reminder: Complete Your Interview for ${job.title}`,
    html,
  });

  return { success: true };
}

/**
 * Send a manual reminder for a specific onboarding task
 */
export async function sendManualOnboardingTaskReminder(taskId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const result = await database
    .select({
      task: onboardingTasks,
      process: onboardingProcesses,
      associate: associates,
      candidate: candidates,
      user: users,
    })
    .from(onboardingTasks)
    .leftJoin(onboardingProcesses, eq(onboardingTasks.processId, onboardingProcesses.id))
    .leftJoin(associates, eq(onboardingProcesses.associateId, associates.id))
    .leftJoin(candidates, eq(associates.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(eq(onboardingTasks.id, taskId))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Onboarding task not found");
  }

  const { task, process: onboardingProcess, associate, candidate, user } = result[0];
  if (!user?.email || !task) {
    throw new Error("Missing required data for sending reminder");
  }

  const taskLink = `${process.env.VITE_OAUTH_PORTAL_URL || 'http://localhost:3000'}/candidate/onboarding`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">📋 Task Reminder</h2>
      <p>Hi ${user.name || 'there'},</p>
      <p>This is a reminder about your onboarding task:</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${task.title}</h3>
        <p>${task.description || 'No description provided'}</p>
        <p style="color: #666; font-weight: bold;">
          Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not specified'}
        </p>
      </div>
      <div style="margin: 30px 0;">
        <a href="${taskLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Task
        </a>
      </div>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: `Reminder: ${task.title}`,
    html,
  });

  return { success: true };
}
