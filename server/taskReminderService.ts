import * as onboardingDb from "./onboardingDb";
import { sendEmail } from "./emailNotifications";

/**
 * Task Reminder Service
 * Sends automated email reminders to recruiters for pending tasks
 * Should be called periodically (e.g., daily via cron job)
 */

interface TaskReminderResult {
  success: boolean;
  remindersSent: number;
  errors: string[];
}

/**
 * Send reminders for tasks that are:
 * - Due within 3 days
 * - Status is "pending" or "in_progress"
 * - Haven't had a reminder sent in the last 24 hours
 */
export async function sendTaskReminders(): Promise<TaskReminderResult> {
  const result: TaskReminderResult = {
    success: true,
    remindersSent: 0,
    errors: [],
  };

  try {
    // Get all pending tasks that need reminders
    const pendingTasks = await onboardingDb.getPendingTasksForReminders();

    if (!pendingTasks || pendingTasks.length === 0) {
      console.log("[Task Reminders] No pending tasks found");
      return result;
    }

    // Group tasks by recruiter to send one email per recruiter
    const tasksByRecruiter = new Map<number, any[]>();
    
    for (const taskData of pendingTasks) {
      const recruiterId = taskData.taskAssignments?.recruiterId;
      if (!recruiterId) continue;

      if (!tasksByRecruiter.has(recruiterId)) {
        tasksByRecruiter.set(recruiterId, []);
      }
      tasksByRecruiter.get(recruiterId)!.push(taskData);
    }

    // Send reminder emails to each recruiter
    for (const [recruiterId, tasks] of Array.from(tasksByRecruiter.entries())) {
      try {
        const recruiter = await onboardingDb.getRecruiterById(recruiterId);
        
        if (!recruiter || !recruiter.users?.email) {
          result.errors.push(`Recruiter ${recruiterId} not found or has no email`);
          continue;
        }

        // Check if we've sent a reminder in the last 24 hours
        const recentReminders = await onboardingDb.getTaskReminders(tasks[0].onboardingTasks?.id);
        const lastReminder = recentReminders[0];
        
        if (lastReminder) {
          const hoursSinceLastReminder = 
            (Date.now() - new Date(lastReminder.sentAt).getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastReminder < 24) {
            console.log(`[Task Reminders] Skipping recruiter ${recruiterId} - reminder sent ${hoursSinceLastReminder.toFixed(1)}h ago`);
            continue;
          }
        }

        // Build email content
        const taskListHtml = tasks
          .map((task: any) => {
            const dueDate = task.onboardingTasks?.dueDate 
              ? new Date(task.onboardingTasks.dueDate).toLocaleDateString()
              : "Not set";
            
            const daysUntilDue = task.onboardingTasks?.dueDate
              ? Math.ceil((new Date(task.onboardingTasks.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;

            const urgencyClass = daysUntilDue !== null && daysUntilDue <= 1 ? "color: #dc2626;" : "";

            return `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px;">
                  <strong>${task.onboardingTasks?.title || "Untitled Task"}</strong><br/>
                  <span style="font-size: 14px; color: #6b7280;">
                    ${task.onboardingTasks?.description || "No description"}
                  </span>
                </td>
                <td style="padding: 12px 8px; ${urgencyClass}">
                  ${dueDate}
                  ${daysUntilDue !== null ? `<br/><span style="font-size: 12px;">(${daysUntilDue} days)</span>` : ""}
                </td>
                <td style="padding: 12px 8px;">
                  <span style="padding: 4px 8px; background: #fef3c7; color: #92400e; border-radius: 4px; font-size: 12px;">
                    ${task.onboardingTasks?.priority || "medium"}
                  </span>
                </td>
              </tr>
            `;
          })
          .join("");

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Task Reminder</h1>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Hi <strong>${recruiter.users.name || "there"}</strong>,
              </p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                You have <strong>${tasks.length}</strong> pending onboarding/offboarding task${tasks.length > 1 ? "s" : ""} 
                that ${tasks.length > 1 ? "are" : "is"} due soon. Please review and complete them as soon as possible.
              </p>

              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Task</th>
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Due Date</th>
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  ${taskListHtml}
                </tbody>
              </table>

              <div style="margin-top: 30px; padding: 20px; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #1e40af;">
                  <strong>💡 Tip:</strong> Log in to the platform to view task details, add notes, and mark tasks as complete.
                </p>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.VITE_APP_URL || "https://hotgigs.manus.space"}/recruiter/onboarding-tasks" 
                   style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  View Tasks
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
                This is an automated reminder from HotGigs Onboarding System.<br/>
                You're receiving this because you have pending tasks assigned to you.
              </p>
            </div>
          </body>
          </html>
        `;

        // Send the email
        await sendEmail({
          to: recruiter.users.email,
          subject: `⏰ Task Reminder: ${tasks.length} Pending Task${tasks.length > 1 ? "s" : ""} Due Soon`,
          html: emailHtml,
        });

        // Record reminder for each task
        for (const task of tasks) {
          if (task.onboardingTasks?.id) {
            await onboardingDb.createTaskReminder({
              taskId: task.onboardingTasks.id,
              recruiterId: recruiterId,
              sentAt: new Date(),
              reminderType: "due_soon",
            });
          }
        }

        result.remindersSent++;
        console.log(`[Task Reminders] Sent reminder to ${recruiter.users.email} for ${tasks.length} task(s)`);

      } catch (error) {
        const errorMsg = `Failed to send reminder to recruiter ${recruiterId}: ${error instanceof Error ? error.message : String(error)}`;
        result.errors.push(errorMsg);
        console.error(`[Task Reminders] ${errorMsg}`);
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
    }

    console.log(`[Task Reminders] Completed: ${result.remindersSent} reminders sent, ${result.errors.length} errors`);

  } catch (error) {
    result.success = false;
    result.errors.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    console.error("[Task Reminders] Fatal error:", error);
  }

  return result;
}

/**
 * Send immediate reminder for a specific task
 */
export async function sendTaskReminderNow(taskId: number): Promise<boolean> {
  try {
    const assignments = await onboardingDb.getAssignmentsByTaskId(taskId);
    
    if (!assignments || assignments.length === 0) {
      console.log(`[Task Reminders] No assignments found for task ${taskId}`);
      return false;
    }

    const task = await onboardingDb.getTaskById(taskId);
    if (!task) {
      console.log(`[Task Reminders] Task ${taskId} not found`);
      return false;
    }

    let sentCount = 0;

    for (const assignment of assignments) {
      const recruiterId = assignment.taskAssignments?.recruiterId;
      if (!recruiterId) continue;

      const recruiter = await onboardingDb.getRecruiterById(recruiterId);
      if (!recruiter || !recruiter.users?.email) continue;

      const dueDate = task.dueDate 
        ? new Date(task.dueDate).toLocaleDateString()
        : "Not set";

      await sendEmail({
        to: recruiter.users.email,
        subject: `Task Reminder: ${task.title || "Task"}`,
        html: `
          <h2>Task Reminder</h2>
          <p>Hi <strong>${recruiter.users.name || "there"}</strong>,</p>
          <p>This is a reminder about your assigned task:</p>
          <div style="padding: 15px; background: #f3f4f6; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <p><strong>Task:</strong> ${task.title || "Untitled"}</p>
            <p><strong>Description:</strong> ${task.description || "No description"}</p>
            <p><strong>Due Date:</strong> ${dueDate}</p>
            <p><strong>Priority:</strong> ${task.priority || "medium"}</p>
          </div>
          <p>Please log in to the platform to complete this task.</p>
        `,
      });

      await onboardingDb.createTaskReminder({
        taskId: task.id,
        recruiterId: recruiterId,
        sentAt: new Date(),
        reminderType: "manual",
      });

      sentCount++;
    }

    console.log(`[Task Reminders] Sent immediate reminder for task ${taskId} to ${sentCount} recruiter(s)`);
    return sentCount > 0;

  } catch (error) {
    console.error(`[Task Reminders] Error sending immediate reminder for task ${taskId}:`, error);
    return false;
  }
}
