import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as onboardingDb from "./onboardingDb";
import { sendEmail } from "./emailNotifications";

export const onboardingRouter = router({
  // Associate Management
  getAllAssociates: protectedProcedure.query(async () => {
    return await onboardingDb.getAllAssociates();
  }),

  getAssociateById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await onboardingDb.getAssociateById(input.id);
    }),

  createAssociate: protectedProcedure
    .input(
      z.object({
        candidateId: z.number(),
        startDate: z.date(),
        jobTitle: z.string(),
        department: z.string().optional(),
        employeeId: z.string().optional(),
        status: z.enum(["active", "onboarding", "offboarding", "terminated"]).default("onboarding"),
        onboardedBy: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const associateId = await onboardingDb.createAssociate(input);
      return { id: associateId };
    }),

  updateAssociate: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["active", "onboarding", "offboarding", "terminated"]).optional(),
        endDate: z.date().optional(),
        department: z.string().optional(),
        jobTitle: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await onboardingDb.updateAssociate(id, updates);
      return { success: true };
    }),

  // Onboarding Process Management
  getAllOnboardingProcesses: protectedProcedure.query(async () => {
    return await onboardingDb.getAllOnboardingProcesses();
  }),

  getOnboardingProcessById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await onboardingDb.getOnboardingProcessById(input.id);
    }),

  initiateOnboarding: protectedProcedure
    .input(
      z.object({
        associateId: z.number(),
        processType: z.enum(["onboarding", "offboarding"]),
        dueDate: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const processId = await onboardingDb.createOnboardingProcess({
        ...input,
        startedBy: ctx.user.id,
        status: "in_progress",
      });

      // Send notification email to the associate
      const associate = await onboardingDb.getAssociateById(input.associateId);
      if (associate && associate.users?.email) {
        await sendEmail({
          to: associate.users.email,
          subject: `${input.processType === "onboarding" ? "Welcome" : "Offboarding"} Process Started`,
          html: `
            <h2>${input.processType === "onboarding" ? "Welcome to the team!" : "Offboarding Process Initiated"}</h2>
            <p>Your ${input.processType} process has been initiated.</p>
            ${input.dueDate ? `<p><strong>Target Completion:</strong> ${input.dueDate.toLocaleDateString()}</p>` : ""}
            <p>You will receive updates as tasks are completed.</p>
          `,
        });
      }

      return { id: processId };
    }),

  updateOnboardingProcess: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
        completedAt: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await onboardingDb.updateOnboardingProcess(id, updates);
      return { success: true };
    }),

  // Task Management
  getTasksByProcess: protectedProcedure
    .input(z.object({ processId: z.number() }))
    .query(async ({ input }) => {
      return await onboardingDb.getTasksByProcessId(input.processId);
    }),

  createTask: protectedProcedure
    .input(
      z.object({
        processId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        taskType: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const taskId = await onboardingDb.createTask({
        ...input,
        status: "pending",
      });
      return { id: taskId };
    }),

  updateTask: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "in_progress", "completed", "blocked"]).optional(),
        completedAt: z.date().optional(),
        completedBy: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input;
      
      // If task is being marked as completed, update completedAt and completedBy
      if (updates.status === "completed") {
        if (!updates.completedAt) updates.completedAt = new Date();
        if (!updates.completedBy) updates.completedBy = ctx.user.id;
      }

      await onboardingDb.updateTask(id, updates);

      // Get task details for notification
      const task = await onboardingDb.getTaskById(id);

      // Send notification to assigned recruiters
      const assignments = await onboardingDb.getAssignmentsByTaskId(id);
      for (const assignment of assignments) {
        if (assignment.users?.email) {
          await sendEmail({
            to: assignment.users.email,
            subject: `Task Updated: ${task?.title || "Task"}`,
            html: `
              <h2>Task Status Update</h2>
              <p><strong>Task:</strong> ${task?.title || "Task"}</p>
              <p><strong>New Status:</strong> ${updates.status || "Updated"}</p>
              ${updates.notes ? `<p><strong>Notes:</strong> ${updates.notes}</p>` : ""}
            `,
          });
        }
      }

      return { success: true };
    }),

  completeTask: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await onboardingDb.updateTask(input.id, {
        status: "completed",
        completedAt: new Date(),
        completedBy: ctx.user.id,
        notes: input.notes,
      });
      return { success: true };
    }),

  // Task Assignment Management
  getAssignmentsByTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await onboardingDb.getAssignmentsByTaskId(input.taskId);
    }),

  getAssignmentsByRecruiter: protectedProcedure
    .input(z.object({ recruiterId: z.number() }))
    .query(async ({ input }) => {
      return await onboardingDb.getAssignmentsByRecruiterId(input.recruiterId);
    }),

  assignTask: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        recruiterId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const assignmentId = await onboardingDb.createTaskAssignment({
        ...input,
        assignedBy: ctx.user.id,
      });

      // Send notification email to assigned recruiter
      const task = await onboardingDb.getTaskById(input.taskId);
      const recruiter = await onboardingDb.getRecruiterById(input.recruiterId);
      
      if (task && recruiter && recruiter.users?.email) {
        await sendEmail({
          to: recruiter.users.email,
          subject: `New Task Assigned: ${task.title || "Task"}`,
          html: `
            <h2>You have been assigned a new task</h2>
            <p><strong>Task:</strong> ${task.title || "Task"}</p>
            <p><strong>Description:</strong> ${task.description || "No description"}</p>
            <p><strong>Due Date:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Not set"}</p>
            <p><strong>Priority:</strong> ${task.priority || "medium"}</p>
            <p>Please log in to the platform to view and complete this task.</p>
          `,
        });
      }

      return { id: assignmentId };
    }),

  // Task Templates
  getAllTaskTemplates: protectedProcedure.query(async () => {
    return await onboardingDb.getAllTaskTemplates();
  }),

  createTaskTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        processType: z.enum(["onboarding", "offboarding"]),
        tasks: z.string(), // JSON string of task array
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const templateId = await onboardingDb.createTaskTemplate({
        ...input,
        createdBy: ctx.user.id,
      });
      return { id: templateId };
    }),

  // Create tasks from template
  createTasksFromTemplate: protectedProcedure
    .input(
      z.object({
        processId: z.number(),
        templateId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const template = await onboardingDb.getTaskTemplateById(input.templateId);
      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task template not found",
        });
      }

      const process = await onboardingDb.getOnboardingProcessById(input.processId);
      if (!process || !process.onboardingProcesses) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Onboarding process not found",
        });
      }

      // Parse template tasks
      const templateTasks = JSON.parse(template.tasks || "[]");
      const startDate = new Date();
      const createdTasks = [];

      for (const taskTemplate of templateTasks) {
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + (taskTemplate.daysFromStart || 0));

        const taskId = await onboardingDb.createTask({
          processId: input.processId,
          title: taskTemplate.title,
          description: taskTemplate.description,
          dueDate: dueDate,
          priority: taskTemplate.priority || "medium",
          taskType: taskTemplate.taskType || null,
          status: "pending",
        });

        createdTasks.push({ id: taskId });
      }

      return createdTasks;
    }),

  // Dashboard Stats
  getOnboardingStats: protectedProcedure.query(async () => {
    const associates = await onboardingDb.getAllAssociates();
    const processes = await onboardingDb.getAllOnboardingProcesses();
    
    const activeAssociates = associates.filter((a) => a.associates?.status === "active").length;
    const onboardingProcesses = processes.filter(
      (p) => p.onboardingProcesses?.processType === "onboarding" && p.onboardingProcesses?.status === "in_progress"
    ).length;
    const offboardingProcesses = processes.filter(
      (p) => p.onboardingProcesses?.processType === "offboarding" && p.onboardingProcesses?.status === "in_progress"
    ).length;

    return {
      activeAssociates,
      onboardingProcesses,
      offboardingProcesses,
      totalProcesses: processes.length,
    };
  }),

  getPendingTasks: protectedProcedure.query(async ({ ctx }) => {
    // Get all tasks assigned to the current user that are not completed
    const assignments = await onboardingDb.getAssignmentsByRecruiterId(ctx.user.id);
    const pendingTasks = assignments.filter(
      (a) => a.onboardingTasks?.status !== "completed"
    );
    
    return pendingTasks;
  }),

  getAllRecruiters: protectedProcedure.query(async () => {
    return await onboardingDb.getAllRecruiters();
  }),

  // Task Reminders
  sendTaskReminders: protectedProcedure.mutation(async () => {
    const { sendTaskReminders } = await import("./taskReminderService");
    const result = await sendTaskReminders();
    return result;
  }),

  sendTaskReminderNow: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ input }) => {
      const { sendTaskReminderNow } = await import("./taskReminderService");
      const success = await sendTaskReminderNow(input.taskId);
      return { success };
    }),
});
